-- Read-only. Run against staging, then the intended production project.
-- Review every result before applying 0027-0031; do not auto-fix history.
select version from supabase_migrations.schema_migrations order by version;

-- Must have at least one active, known administrator before revoking bootstrap.
select count(*) as active_admins from public.profiles where is_admin and not is_banned;

-- Investigate historical self-assignment/points created before hardening.
select id, requester_id, volunteer_id, status from public.help_requests
where requester_id=volunteer_id;
select request_id,volunteer_id,points from public.volunteer_point_transactions
where request_id in(select id from public.help_requests where requester_id=volunteer_id);

-- Safety checks for existing active missions.
select volunteer_id,count(*) from public.help_requests
where volunteer_id is not null and status in('accepted','on_the_way','arrived','awaiting_confirmation')
group by volunteer_id having count(*)>1;
select requester_id,count(*) from public.help_requests
where status not in('completed','cancelled') group by requester_id having count(*)>1;

-- Old URL format is normalized by 0027. Other URL formats need review.
select count(*) as unexpected_chat_media_paths from public.messages
where media_url is not null
and media_url !~ '^https?://[^/]+/storage/v1/object/public/mission-chat/'
and media_url !~ '^[0-9a-f-]{36}/';
select id,public from storage.buckets where id='mission-chat';

-- Metadata-only checks; never print or copy webhook secret values.
select key,length(value)>0 as configured from private.app_settings
where key in('notify_webhook_secret','points_per_mission');
