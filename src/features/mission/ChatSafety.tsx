import { useState } from 'react'
import { Text } from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'phosphor-react-native'
import { BottomSheet, Button, IconButton, TextField, useToast } from '../../components/ui'
import { moderationRepository } from '../../repositories/moderationRepository'
import { useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

export function useChatBlocked(userId: string | undefined, otherId: string | null) {
  return useQuery({ queryKey: ['chat-blocked', userId, otherId], queryFn: () => moderationRepository.isBlocked(otherId!), enabled: !!userId && !!otherId, refetchInterval: 10_000 })
}

export function ChatSafety({ requestId, userId, otherId }: { requestId: string; userId: string; otherId: string }) {
  const { t } = useTranslation()
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const toast = useToast()
  const client = useQueryClient()
  const blocked = useChatBlocked(userId, otherId)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function report() {
    setBusy(true); setError(false)
    try {
      await moderationRepository.reportRequest(requestId, userId, reason, details)
      setReason(''); setDetails(''); setOpen(false)
      toast.show(t('chat.safety.reportSent'), 'success')
    } catch { setError(true) }
    finally { setBusy(false) }
  }
  async function changeBlock() {
    setBusy(true); setError(false)
    try {
      if (blocked.data) await moderationRepository.unblock(userId, otherId)
      else await moderationRepository.block(userId, otherId)
      await client.invalidateQueries({ queryKey: ['chat-blocked', userId, otherId] })
    } catch { setError(true) }
    finally { setBusy(false) }
  }
  return <>
    <IconButton label={t('chat.safety.title')} icon={<ShieldCheck size={22} color={theme.colors.primary} />} onPress={() => setOpen(true)} />
    <BottomSheet visible={open} onClose={() => setOpen(false)} title={t('chat.safety.title')} dismissible={!busy}>
      <Text style={[typography.small, { color: theme.colors.textSecondary }]}>{t('chat.safety.hint')}</Text>
      <TextField label={t('chat.safety.reason')} value={reason} onChangeText={setReason} maxLength={200} />
      <TextField label={t('chat.safety.details')} value={details} onChangeText={setDetails} multiline maxLength={2000} />
      <Button label={t('chat.safety.report')} disabled={reason.trim().length < 3} loading={busy} onPress={report} />
      <Text style={[typography.small, { color: theme.colors.textSecondary }]}>{t('chat.safety.blockHint')}</Text>
      <Button label={t(blocked.data ? 'chat.safety.unblock' : 'chat.safety.block')} variant="outline" disabled={blocked.isPending || blocked.isError} loading={busy} onPress={changeBlock} />
      {blocked.data ? <Text style={[typography.small, { color: theme.colors.textSecondary }]}>{t('chat.safety.blocked')}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={[typography.small, { color: theme.colors.danger }]}>{t('chat.safety.error')}</Text> : null}
    </BottomSheet>
  </>
}
