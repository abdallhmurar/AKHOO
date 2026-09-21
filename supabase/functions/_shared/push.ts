export type PushMessage = { to: string; title: string; body: string; sound?: string; data?: Record<string, unknown> }
export type PushResult = { token: string; status: 'sent' | 'failed' | 'unknown'; error: string | null }

// A phone notification shows only a few lines whatever is sent, and the push
// payload itself is capped (~4KB), so an admin's long message is trimmed for
// the push only - the full text stays in the in-app announcement. Counts
// code points (not UTF-16 units) so Arabic/Hebrew/emoji are never cut mid-character.
export const PUSH_BODY_MAX = 160
export function truncateForPush(text: string, max = PUSH_BODY_MAX): string {
  const chars = Array.from(text.replace(/\s+/g, ' ').trim())
  return chars.length <= max ? chars.join('') : chars.slice(0, max - 1).join('').trimEnd() + '…'
}

// "sent" means Expo accepted a ticket, not that a handset displayed it.
// Network failures after submission are uncertain and must not be treated
// as definitely unsent by a retry loop.
export async function sendPushBatch(messages: PushMessage[], send: typeof fetch = fetch): Promise<PushResult[]> {
  if (messages.length > 100) throw new Error('Expo batch limit exceeded')
  if (!messages.length) return []
  try {
    const response = await send('https://exp.host/--/api/v2/push/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(messages)
    })
    if (!response.ok) return messages.map(m => ({ token: m.to, status: response.status >= 500 ? 'unknown' : 'failed', error: `expo_${response.status}` }))
    const payload = await response.json()
    const tickets = Array.isArray(payload.data) ? payload.data : []
    return messages.map((m, i) => {
      const ticket = tickets[i]
      if (ticket?.status === 'ok') return { token: m.to, status: 'sent', error: null }
      if (ticket?.status === 'error') return { token: m.to, status: 'failed', error: ticket.details?.error ?? 'ticket_error' }
      return { token: m.to, status: 'unknown', error: 'missing_ticket' }
    })
  } catch { return messages.map(m => ({ token: m.to, status: 'unknown', error: 'network_or_response_error' })) }
}

export async function sendPushMessages(messages: PushMessage[], send: typeof fetch = fetch) {
  const results: PushResult[] = []
  for (let offset = 0; offset < messages.length; offset += 100) results.push(...await sendPushBatch(messages.slice(offset, offset + 100), send))
  return results
}
