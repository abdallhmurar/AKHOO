import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { useVideoPlayer, VideoView } from 'expo-video'
import { ArrowLeft, ArrowRight, Camera, PaperPlaneTilt } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { translateActionError } from '../../lib/rpcErrors'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { missionRepository } from '../../repositories/missionRepository'
import { profileRepository } from '../../repositories/profileRepository'
import { messageRepository } from '../../repositories/messageRepository'
import type { ChatMessage } from '../../repositories/messageRepository'
import { queryKeys } from '../../services/queryKeys'
import { Avatar, IconButton } from '../../components/ui'

function useMissionDetail(missionId: string) {
  return useQuery({ queryKey: queryKeys.mission(missionId), queryFn: () => missionRepository.get(missionId), enabled: !!missionId })
}

// Real chat between a requester and their matched helper - text, photos and
// video, scoped to one help request (see supabase/migrations/0017_mission_
// chat.sql and messageRepository). Both sides reach this from their own
// mission screen's chat button.
export function MissionChatScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const router = useRouter()
  const { missionId } = useLocalSearchParams<{ missionId: string }>()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const mission = useMissionDetail(String(missionId))
  const row = mission.data
  const otherId = row ? (row.requester_id === session?.user.id ? row.helper_id : row.requester_id) : null
  const other = useQuery({ queryKey: otherId ? queryKeys.profile(otherId) : ['participant'], queryFn: () => profileRepository.get(otherId!), enabled: !!otherId })

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const listRef = useRef<FlatList<ChatMessage>>(null)
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  const messagesQuery = useQuery({
    queryKey: row ? queryKeys.missionMessages(row.request_id) : ['messages'],
    queryFn: () => messageRepository.list(row!.request_id),
    enabled: !!row?.request_id
  })

  useEffect(() => {
    if (!row?.request_id) return
    return messageRepository.subscribe(row.request_id, message => {
      queryClient.setQueryData<ChatMessage[]>(queryKeys.missionMessages(row.request_id), current =>
        current?.some(existing => existing.id === message.id) ? current : [...(current ?? []), message]
      )
    })
  }, [row?.request_id, queryClient])

  async function send() {
    const body = text.trim()
    if (!body || !row?.request_id || !session) return
    setText('')
    setSending(true)
    try {
      await messageRepository.sendText(row.request_id, session.user.id, body)
    } catch (cause: any) {
      Alert.alert(t('common.error'), translateActionError(t, cause))
    } finally {
      setSending(false)
    }
  }

  async function pickMedia() {
    if (!row?.request_id || !session) return
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permission.status !== 'granted') {
      Alert.alert(t('auth.signup.permissionPhotos.title'), t('auth.signup.permissionPhotos.message'))
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.6 })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    const mediaType: 'image' | 'video' = asset.type === 'video' ? 'video' : 'image'
    setUploading(true)
    try {
      await messageRepository.sendMedia(row.request_id, session.user.id, asset.uri, mediaType)
    } catch (cause: any) {
      Alert.alert(t('common.error'), translateActionError(t, cause))
    } finally {
      setUploading(false)
    }
  }

  // Sent bubbles stay on the physical right and received on the left
  // regardless of language - the near-universal chat convention (own
  // messages always on the same side), not the app's usual per-language
  // mirroring. Under RTL, ambient dir="rtl" already flips flex-end/
  // flex-start to mean physical left/right, so isMine is XORed against
  // isRTL to land on the correct physical side either way.
  function renderMessage({ item }: { item: ChatMessage }) {
    const isMine = item.sender_id === session?.user.id
    return (
      <View style={[styles.bubbleRow, { justifyContent: (isMine !== isRTL) ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs, { backgroundColor: isMine ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border, borderWidth: isMine ? 0 : 1 }]}>
          {item.media_type === 'image' && item.media_url ? <Image source={{ uri: item.media_url }} style={styles.bubbleImage} /> : null}
          {item.media_type === 'video' && item.media_url ? <ChatVideoBubble uri={item.media_url} /> : null}
          {item.body ? <Text style={[typography.body, { color: isMine ? theme.colors.onPrimary : theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{item.body}</Text> : null}
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, dirStyles(isRTL).row, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <IconButton label={t('common.back')} size={40} icon={<BackIcon size={18} color={theme.colors.textPrimary} />} onPress={() => router.back()} />
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{other.data?.full_name || t('activeRequest.defaultVolunteerName')}</Text>
          </View>
          <Avatar name={other.data?.full_name || 'AKHOO'} uri={other.data?.avatar_url} size={36} tone="community" />
        </View>

        <FlatList
          ref={listRef}
          data={messagesQuery.data ?? []}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            messagesQuery.isLoading
              ? <ActivityIndicator color={theme.colors.primary} />
              : <Text style={[typography.small, styles.centerText, { color: theme.colors.textMuted }]}>{t('chat.empty')}</Text>
          }
        />

        <View style={[styles.inputRow, dirStyles(isRTL).row, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Pressable onPress={pickMedia} disabled={uploading} style={styles.attachButton} accessibilityRole="button" accessibilityLabel={t('chat.capability.photos')}>
            {uploading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Camera size={22} color={theme.colors.primary} />}
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            multiline
            style={[styles.textInput, typography.body, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
          />
          <Pressable onPress={send} disabled={!text.trim() || sending} style={[styles.sendButton, { backgroundColor: text.trim() ? theme.colors.primary : theme.colors.disabledBackground }]} accessibilityRole="button" accessibilityLabel={t('common.next')}>
            {sending ? <ActivityIndicator size="small" color={theme.colors.onPrimary} /> : <PaperPlaneTilt size={18} color={theme.colors.onPrimary} weight="fill" style={isRTL ? styles.sendIconRTL : undefined} />}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

function ChatVideoBubble({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => { p.loop = false })
  return <VideoView player={player} style={styles.bubbleVideo} nativeControls contentFit="cover" />
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centerText: { textAlign: 'center', marginTop: space.xxl },
  header: { alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth },
  headerCopy: { flex: 1 },
  listContent: { padding: space.lg, gap: space.sm, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '78%', borderRadius: radius.lg, padding: space.md, gap: 6, ...shadow.soft },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleTheirs: { borderBottomLeftRadius: 4 },
  bubbleImage: { width: 200, height: 200, borderRadius: radius.md },
  bubbleVideo: { width: 220, height: 220, borderRadius: radius.md },
  inputRow: { alignItems: 'flex-end', gap: space.sm, padding: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  attachButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  textInput: { flex: 1, minHeight: 40, maxHeight: 120, paddingHorizontal: space.md, paddingVertical: 10 },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendIconRTL: { transform: [{ scaleX: -1 }] }
})
