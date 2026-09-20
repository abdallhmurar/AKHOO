import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AdminAuditLog, MissionMessage, Report } from '@/types'

export function useReportDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['report', id],
    enabled: !!id,
    queryFn: async () => {
      const { data: report, error } = await supabase.from('reports').select('*').eq('id', id!).single()
      if (error) throw error
      const r = report as Report

      const [{ data: reporter }, { data: history }] = await Promise.all([
        supabase.from('profiles').select('id, full_name').eq('id', r.reporter_id).maybeSingle(),
        supabase.from('admin_audit_log').select('*').eq('target_type', 'report').eq('target_id', r.id).order('created_at', { ascending: false })
      ])

      // The flagged conversation is only readable at all while this report is
      // open/reviewing (see the messages RLS policy in
      // 0023_admin_phase3_5.sql) - once resolved/dismissed, this naturally
      // comes back empty, which is the intended "monitoring only when
      // needed" behavior, not a bug.
      let messages: MissionMessage[] = []
      if (r.target_type === 'request') {
        const { data } = await supabase.from('messages').select('*').eq('request_id', r.target_id).order('created_at', { ascending: true })
        messages = (data ?? []) as MissionMessage[]
      } else if (r.target_type === 'message') {
        const { data: flagged } = await supabase.from('messages').select('request_id').eq('id', r.target_id).maybeSingle()
        if (flagged?.request_id) {
          const { data } = await supabase.from('messages').select('*').eq('request_id', flagged.request_id).order('created_at', { ascending: true })
          messages = (data ?? []) as MissionMessage[]
        }
      }

      messages = messages.map(m => ({ ...m, media_url: m.media_url?.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/mission-chat\//, '') ?? null }))
      const paths = messages.flatMap(m => m.media_url ? [m.media_url] : [])
      if (paths.length) {
        const { data: signed, error: mediaError } = await supabase.storage.from('mission-chat').createSignedUrls(paths, 900)
        if (mediaError) throw mediaError
        const urls = new Map(signed.map(item => [item.path, item.signedUrl]))
        messages = messages.map(m => ({ ...m, media_url: m.media_url ? urls.get(m.media_url) ?? null : null }))
      }
      return {
        report: r,
        reporterName: (reporter?.full_name as string | undefined) ?? null,
        history: (history ?? []) as AdminAuditLog[],
        messages
      }
    }
  })
}
