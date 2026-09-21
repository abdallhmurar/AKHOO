import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, ArrowRight, Camera, ChatCircleDots, PaperPlaneTilt, X } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { translateActionError } from '../../lib/rpcErrors'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { supportRepository } from '../../repositories/supportRepository'
import { IconButton, useToast } from '../../components/ui'
import type { SupportMessage } from '../../types'
import { hasUnreadReply, supportKeys, useSupportConversation } from './useSupport'

function formatStamp(iso: string, locale: string) {
  const date = new Date(iso)
  const sameDay = date.toDateString() === new Date().toDateString()
  return sameDay
    ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })
}

// One continuous conversation with the AKHOO support team (text + photos),
// answered from the admin panel's support inbox. See migration 0035 and
// supportRepository. Reached from the Help screen.
export function SupportChatScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const insets = useSafeAreaInsets()
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { session } = useAuth()
  const userId = session?.user.id
  const queryClient = useQueryClient()
  const toast = useToast()
  const { conversation, query: conversationQuery } = useSupportConversation()
  const conversationId = conversation?.id

  const [text, setText] = useState('')
  const [previewUri, setPreviewUri] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const listRef = useRef<FlatList<SupportMessage>>(null)
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  const messagesQuery = useQuery({
    queryKey: supportKeys.messages(conversationId),
    queryFn: () => supportRepository.listMessages(conversationId!),
    enabled: !!conversationId,
    // Also keeps the 15-minute signed image URLs from going stale.
    refetchInterval: 60_000
  })
  const messages = messagesQuery.data ?? []
  const lastMessageId = messages.length ? messages[messages.length - 1]!.id : null
  const unread = hasUnreadReply(conversation)

  useEffect(() => {
    if (!conversationId) return
    return supportRepository.subscribeMessages(conversationId, () => {
      void queryClient.invalidateQueries({ queryKey: supportKeys.messages(conversationId) })
    })
  }, [conversationId, queryClient])

  // A reply counts as read once it is on screen: covers opening the chat and
  // a reply arriving while it is already open (clears the dot on Help/Account).
  useEffect(() => {
    if (!conversationId || !messagesQuery.isSuccess || !unread) return
    void supportRepository.markRead().then(() => queryClient.invalidateQueries({ queryKey: supportKeys.conversation(userId) }))
  }, [conversationId, messagesQuery.isSuccess, unread, lastMessageId, userId, queryClient])

  async function refreshAll() {
    await queryClient.invalidateQueries({ queryKey: ['support'] })
  }

  async function send() {
    const body = text.trim()
    if (!body || sending || uploading) return
    setSending(true)
    try {
      await supportRepository.sendText(body)
      setText(current => current.trim() === body ? '' : current)
      await refreshAll()
    } catch (cause: any) {
      toast.show(translateActionError(t, cause), 'error')
    } finally {
      setSending(false)
    }
  }

  async function pickPhoto() {
    if (!userId || sending || uploading) return
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permission.status !== 'granted') {
      Alert.alert(t('auth.signup.permissionPhotos.title'), t('auth.signup.permissionPhotos.message'))
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    setUploading(true)
    try {
      await supportRepository.sendImage(userId, asset.uri, asset.mimeType)
      await refreshAll()
    } catch (cause: any) {
      toast.show(translateActionError(t, cause), 'error')
    } finally {
      setUploading(false)
    }
  }

  // Same convention as the mission chat: your own messages stay on the same
  // physical side whatever the language, so isMine is XORed with isRTL.
  function renderMessage({ item }: { item: SupportMessage }) {
    const isMine = !item.from_admin
    const ink = isMine ? theme.colors.onPrimary : theme.colors.textPrimary
    return (
      <View style={[styles.bubbleRow, { justifyContent: (isMine !== isRTL) ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs, { backgroundColor: isMine ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border, borderWidth: isMine ? 0 : 1 }]}>
          {item.media_url ? (
            <Pressable onPress={() => setPreviewUri(item.media_url)} accessibilityRole="button" accessibilityLabel={t('support.photo')}>
              <Image source={{ uri: item.media_url }} style={styles.bubbleImage} />
            </Pressable>
          ) : null}
          {item.body ? <Text selectable style={[typography.body, { color: ink, textAlign: isRTL ? 'right' : 'left' }]}>{item.body}</Text> : null}
          <Text style={[typography.caption, { color: isMine ? theme.colors.onPrimary : theme.colors.textMuted, opacity: 0.75, textAlign: isRTL ? 'right' : 'left' }]}>{formatStamp(item.created_at, i18n.language)}</Text>
        </View>
      </View>
    )
  }

  const loading = conversationQuery.isLoading || (!!conversationId && messagesQuery.isLoading)
  const canSend = text.trim().length > 0 && !sending && !uploading

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, dirStyles(isRTL).row, { paddingTop: Math.max(space.md, insets.top + space.xs), borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <IconButton label={t('common.back')} size={40} icon={<BackIcon size={18} color={theme.colors.textPrimary} />} onPress={() => router.back()} />
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('support.teamName')}</Text>
            <Text numberOfLines={1} style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('support.teamStatus')}</Text>
          </View>
          <Image source={require('../../../assets/images/icon.png')} style={styles.teamLogo} />
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            loading
              ? <ActivityIndicator color={theme.colors.primary} style={styles.centered} />
              : conversationQuery.isError || messagesQuery.isError
                ? <Text style={[typography.small, styles.centerText, { color: theme.colors.textMuted }]}>{t('support.loadError')}</Text>
                : (
                  <View style={styles.welcome}>
                    <View style={[styles.welcomeIcon, { backgroundColor: theme.colors.primarySoft }]}>
                      <ChatCircleDots size={34} weight="duotone" color={theme.colors.primary} />
                    </View>
                    <Text style={[typography.h3, styles.centerText, { color: theme.colors.textPrimary }]}>{t('support.welcomeTitle')}</Text>
                    <Text style={[typography.body, styles.centerText, { color: theme.colors.textSecondary }]}>{t('support.welcomeBody')}</Text>
                  </View>
                )
          }
        />

        {conversation?.status === 'resolved' ? (
          <Text style={[typography.small, styles.notice, { color: theme.colors.textSecondary, backgroundColor: theme.colors.surfaceMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('support.resolvedNotice')}</Text>
        ) : null}

        <View style={[styles.inputRow, dirStyles(isRTL).row, { paddingBottom: Math.max(space.md, insets.bottom), borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Pressable onPress={pickPhoto} disabled={uploading || sending} style={styles.attachButton} accessibilityRole="button" accessibilityLabel={t('support.attachPhoto')}>
            {uploading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Camera size={22} color={theme.colors.primary} />}
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('support.placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            multiline
            maxLength={4000}
            style={[styles.textInput, typography.body, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
          />
          <Pressable onPress={send} disabled={!canSend} style={[styles.sendButton, { backgroundColor: canSend ? theme.colors.primary : theme.colors.disabledBackground }]} accessibilityRole="button" accessibilityLabel={t('support.send')}>
            {sending ? <ActivityIndicator size="small" color={theme.colors.onPrimary} /> : <PaperPlaneTilt size={18} color={theme.colors.onPrimary} weight="fill" style={isRTL ? styles.sendIconRTL : undefined} />}
          </Pressable>
        </View>
      </View>

      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)} statusBarTranslucent>
        <View style={styles.imageViewerBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreviewUri(null)} accessibilityRole="button" accessibilityLabel={t('common.back')} />
          {previewUri ? <Image source={{ uri: previewUri }} style={styles.imageViewerImage} resizeMode="contain" /> : null}
          <IconButton label={t('common.back')} size={40} style={styles.imageViewerClose} icon={<X size={20} color="#fff" />} onPress={() => setPreviewUri(null)} />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: { marginTop: space.xxl },
  centerText: { textAlign: 'center' },
  header: { alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.md, borderBottomWidth: StyleSheet.hairlineWidth },
  headerCopy: { flex: 1 },
  teamLogo: { width: 36, height: 36, borderRadius: 18 },
  listContent: { padding: space.lg, gap: space.sm, flexGrow: 1 },
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingHorizontal: space.xl },
  welcomeIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, padding: space.md, gap: 6, ...shadow.soft },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleTheirs: { borderBottomLeftRadius: 4 },
  bubbleImage: { width: 200, height: 200, borderRadius: radius.md },
  notice: { paddingHorizontal: space.lg, paddingVertical: space.sm },
  inputRow: { alignItems: 'flex-end', gap: space.sm, paddingTop: space.md, paddingHorizontal: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  attachButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  textInput: { flex: 1, minHeight: 40, maxHeight: 120, paddingHorizontal: space.md, paddingVertical: 10 },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendIconRTL: { transform: [{ scaleX: -1 }] },
  imageViewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  imageViewerImage: { width: '100%', height: '100%' },
  imageViewerClose: { position: 'absolute', top: space.xxl, right: space.lg, backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'transparent' }
})
