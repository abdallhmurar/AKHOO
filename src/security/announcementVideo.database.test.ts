import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { asUser, createTestDatabase } from '../../test/database'

const admin = '00000000-0000-0000-0000-000000000001'
const reader = '00000000-0000-0000-0000-000000000002'
let db: PGlite
const user = (id: string, sql: string, params: unknown[] = []) => asUser(db, id, sql, params)
const base = 'https://example.supabase.co/storage/v1/object/public/content'
const video = `${base}/announcements-video/1-abcd1234.mp4`
const poster = `${base}/announcements/1-abcd1234.jpg`
const create = (images: string[], videoUrl: string | null) =>
  user(admin, "select * from admin_create_broadcast_notification('عنوان','رسالة','all',$1,null,7,'{}',$2)", [images, videoUrl])

beforeAll(async () => {
  db = await createTestDatabase()
  for (const id of [admin, reader]) await db.query('insert into auth.users(id) values($1)', [id])
  await db.exec("begin; select set_config('sanad.privileged_write','on',true)")
  await db.query('update profiles set is_admin=true where id=$1', [admin])
  await db.exec('commit')
}, 60000)
afterAll(async () => { await db?.close() })

describe('announcement video', () => {
  it('delivers the video with the poster fallback to signed-in users', async () => {
    const row = (await create([poster], video)).rows[0]!
    expect(row.video_url).toBe(video)
    const seen = (await user(reader, 'select * from get_my_announcements()')).rows.find(r => r.id === row.id)
    expect(seen?.video_url).toBe(video)
    expect(seen?.image_urls).toEqual([poster])
  })
  it('still publishes image-only and text-only announcements with no video', async () => {
    const row = (await create([poster], null)).rows[0]!
    expect(row.video_url).toBeNull()
    const text = (await create([], '  ')).rows[0]!
    expect(text.video_url).toBeNull()
  })
  it('only accepts an MP4 from the announcements-video folder of the content bucket', async () => {
    for (const bad of [poster, `${base}/announcements-video/clip.mov`, `${base}/announcements/clip.mp4`, 'https://evil.example/clip.mp4', `${video}?x=1`, `${base}/announcements-video/`]) {
      await expect(create([], bad)).rejects.toThrow('The video must be an MP4')
    }
  })
  it('does not let a video be smuggled in as a poster image', async () => {
    await expect(create([video], null)).rejects.toThrow('Images must be uploaded through the admin panel')
  })
  it('is admin-only and recorded in the audit log', async () => {
    await expect(user(reader, "select * from admin_create_broadcast_notification('a','b','all','{}',null,7,'{}',$1)", [video])).rejects.toThrow('Not authorized')
    const logged = (await user(admin, "select metadata from admin_audit_log where action='broadcast_notification_sent' order by created_at desc limit 20")).rows
    expect(logged.map(r => r.metadata)).toContainEqual(expect.objectContaining({ has_video: true }))
  })
  it('caps uploads to the content bucket at 25 MB and to images (GIF included) plus MP4', async () => {
    const bucket = (await db.query<{ file_size_limit: string | number; allowed_mime_types: string[] }>("select file_size_limit, allowed_mime_types from storage.buckets where id='content'")).rows[0]!
    expect(Number(bucket.file_size_limit)).toBe(25 * 1024 * 1024)
    expect(bucket.allowed_mime_types).toEqual(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'])
  })
})
