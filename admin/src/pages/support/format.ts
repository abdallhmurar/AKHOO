// Today -> just the time; anything older -> a short date and time.
export function formatStamp(iso: string, locale: string) {
  const date = new Date(iso)
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })
}

// The list only needs "when", not the exact minute, for older conversations.
export function formatListStamp(iso: string, locale: string) {
  const date = new Date(iso)
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(locale, { dateStyle: 'medium' })
}
