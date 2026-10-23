begin;

-- Announcement posters can be animated GIFs: every app version already shows
-- posters with the plain Image component, which plays GIFs on iOS and Android,
-- so an animated poster reaches builds that cannot play the MP4 added in 0049.
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
where id = 'content';

commit;
