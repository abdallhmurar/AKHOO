-- Phase 2B: correctness/safety fixes for the redemption + chat-moderation
-- work shipped in 0017-0023. 0021/0022/0023 are deliberately NOT edited (they
-- may already be applied to production - editing an applied migration would
-- silently diverge history from the live schema). Everything here is a
-- `create or replace` over an existing object, a new helper function, or a
-- drop/create of one policy, so this file is safe to apply once on top of
-- 0023 and is idempotent on re-run. No table shape changes, no data writes,
-- no secrets.
--
-- Contents:
--   1. Redemption code generation that works wherever pgcrypto actually lives
--   2. messages RLS: remove the self-referential (recursive) admin policy
--   3. notify_new_message: read the webhook secret the same way 0005 does
--   4. get_points_balance: an EXPIRED pending hold is not a permanent debit
--   5. create_offer_redemption: locking, member_only, redemption_limit,
--      and "don't issue a second code for an offer you already hold one for"
--   6. admin_redeem_offer_code: one atomic pending -> redeemed transition
--
-- search_path: every function below pins `set search_path = ''` and
-- schema-qualifies everything outside pg_catalog. That is stricter than the
-- `= public` used by earlier migrations on purpose: with an empty path an
-- object created in a caller-writable schema can never shadow a table,
-- function or operator used inside a SECURITY DEFINER body. (pg_catalog is
-- always searched implicitly, and pg_temp is never searched for functions or
-- operators, so built-ins still resolve normally.)

-- ── 1. Redemption code generation ────────────────────────────────────────
--
-- 0022 called an unqualified gen_random_bytes(20) from a function pinned to
-- `set search_path = public`. 0001 ran `create extension if not exists
-- pgcrypto` with no schema, which on Supabase is a no-op because pgcrypto is
-- pre-installed in `extensions` - so the call raises "function
-- gen_random_bytes(integer) does not exist" and EVERY redemption fails.
-- On a plain Postgres, 0001 would instead have put pgcrypto in `public`.
--
-- Rather than guess, look the schema up from pg_extension and call it fully
-- qualified. If pgcrypto is not installed at all, fall back to
-- gen_random_uuid(), which is core (pg_catalog) since PostgreSQL 13 and
-- also a CSPRNG. Either way the result is 40 unguessable hex characters.

create or replace function public.generate_redemption_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_schema name;
  v_code text;
begin
  select n.nspname into v_schema
  from pg_catalog.pg_extension e
  join pg_catalog.pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if v_schema is not null then
    execute pg_catalog.format('select pg_catalog.encode(%I.gen_random_bytes(20), ''hex'')', v_schema)
    into v_code;
  else
    -- 40 hex chars from v4 UUID randomness (~150 random bits).
    v_code := pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', '')
           || pg_catalog.left(pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''), 8);
  end if;

  return v_code;
end;
$$;

-- Internal helper only. Supabase's default privileges grant EXECUTE on new
-- public functions to anon/authenticated as well as PUBLIC, so revoke all
-- three. create_offer_redemption (SECURITY DEFINER, same owner) still calls it.
revoke all on function public.generate_redemption_code() from public;

revoke all on function public.generate_redemption_code() from anon, authenticated;

-- ── 2. messages RLS recursion ────────────────────────────────────────────
--
-- 0023's "messages readable by admin when reported" policy ran a subquery
-- against public.messages from inside a policy ON public.messages. Postgres
-- applies that table's SELECT policies to the subquery too, re-entering the
-- same policy -> "infinite recursion detected in policy for relation
-- messages", which breaks EVERY select on messages (participants included),
-- not just the admin path. Same failure 0002/0003 documented for
-- profiles/help_requests; same fix: route the lookup through a SECURITY
-- DEFINER helper, whose internal reads run as the owner and don't re-enter
-- RLS.
--
-- Access is narrowed, never widened:
--   - The helper returns false unless the caller is an admin, so it can't be
--     used by an ordinary user as an oracle for "is this chat reported".
--   - Only a report filed by an actual participant of the request (its
--     requester or volunteer) opens the conversation. 0023's reports INSERT
--     policy only checks reporter_id = auth.uid(), so without this any user
--     could file a report naming an arbitrary request/message id and thereby
--     open a stranger's chat to admin reading.
--   - As before, access closes on its own once the report is resolved or
--     dismissed.

create or replace function public.admin_may_read_request_messages(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    and exists (
      select 1
      from public.reports r
      join public.help_requests hr on hr.id = p_request_id
      where r.status in ('open', 'reviewing')
        and r.reporter_id in (hr.requester_id, hr.volunteer_id)
        and (
          (r.target_type = 'request' and r.target_id = p_request_id)
          or (
            r.target_type = 'message'
            and exists (
              select 1 from public.messages m
              where m.id = r.target_id and m.request_id = p_request_id
            )
          )
        )
    )
$$;

-- Must stay executable by authenticated: policies are evaluated with the
-- querying user's privileges. anon has no business calling it.
revoke all on function public.admin_may_read_request_messages(uuid) from public;

revoke all on function public.admin_may_read_request_messages(uuid) from anon;

grant execute on function public.admin_may_read_request_messages(uuid) to authenticated;

drop policy if exists "messages readable by admin when reported" on public.messages;

create policy "messages readable by admin when reported" on public.messages for select to authenticated using (
  public.admin_may_read_request_messages(messages.request_id)
);

-- ── 3. notify_new_message: one way to read the webhook secret ────────────
--
-- 0004 read the secret via current_setting('app.settings.notify_webhook_
-- secret'); 0005 replaced that with a private.app_settings lookup precisely
-- because `alter database ... set` needs superuser rights the CLI role does
-- not have. 0018 then reintroduced the current_setting form for chat pushes,
-- so on a project configured per 0005 the chat trigger reads NULL and
-- silently no-ops - chat push notifications never fire.
--
-- Read private.app_settings first (the 0005 way, same as
-- notify_new_help_request), keeping current_setting only as a fallback so a
-- project configured the old way keeps working. The secret value itself is
-- deliberately NOT written here - it is set out-of-band in
-- private.app_settings. The URL is the same public project endpoint 0005/0018
-- already use, not a secret.

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  select s.value into v_secret from private.app_settings s where s.key = 'notify_webhook_secret';
  if v_secret is null or v_secret = '' then
    v_secret := pg_catalog.current_setting('app.settings.notify_webhook_secret', true);
  end if;
  if v_secret is null or v_secret = '' then
    return new;
  end if;

  perform net.http_post(
    url := 'https://zmpwdufahjmlxfwzafvr.supabase.co/functions/v1/notify-new-message',
    headers := pg_catalog.jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := pg_catalog.jsonb_build_object('message_id', new.id)
  );

  return new;
end;
$$;

-- ── 4. get_points_balance: expired holds are not permanent debits ────────
--
-- 0022 subtracted every 'pending' row regardless of expires_at and relied on
-- expire_stale_offer_redemptions() having swept lapsed rows to 'expired'
-- first. Any read before that sweep (the Perks screen's own balance query,
-- for one) showed the user short by the points of a hold that had already
-- lapsed - indefinitely, if nothing ever triggered the sweep.
--
-- Deducting only holds that are still live makes the balance correct at read
-- time regardless of when the sweep runs. Refund semantics are unchanged:
-- leaving ('pending','redeemed') still IS the refund, exactly as 0022
-- designed it.
--
-- Still NOT security definer (same reasoning as 0022): called directly by a
-- client it runs under that client's RLS, so it can only ever sum rows the
-- caller could already read. Called from create_offer_redemption it runs with
-- that function's owner rights and sees the real totals.

create or replace function public.get_points_balance(p_user_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select (
    coalesce((
      select sum(t.points)
      from public.volunteer_point_transactions t
      where t.volunteer_id = p_user_id
    ), 0)
    - coalesce((
      select sum(r.points_spent)
      from public.offer_redemptions r
      where r.user_id = p_user_id
        and (r.status = 'redeemed' or (r.status = 'pending' and r.expires_at > pg_catalog.now()))
    ), 0)
  )::integer
$$;

-- ── 5. create_offer_redemption ───────────────────────────────────────────
--
-- Defects in 0022's version, fixed together because they all live in this
-- one function:
--
--  (a) CONCURRENCY. Balance was read, then a row inserted, with nothing
--      serializing the two: two concurrent calls both saw the same balance
--      and both succeeded, spending more points than the user has. Same race
--      for the redemption_limit count. Fixed with transaction-scoped advisory
--      locks, always taken offer-first then user, so two sessions can never
--      wait on each other in opposite order. Every check below runs after
--      both locks are held; under READ COMMITTED (PostgREST's default) each
--      later statement takes a fresh snapshot, so it sees what the session
--      that held the lock before us committed.
--  (b) member_only was enforced only in the client (resolveOfferUseAction in
--      src/lib/membershipLogic.ts); a direct RPC call bypassed it.
--  (c) redemption_limit (added in 0021) was never enforced anywhere.
--  (d) Calling it again for an offer you already hold a live code for issued
--      a SECOND code and deducted the points again. The live hold is now
--      returned as-is (after all eligibility checks) instead.
--  (e) auth.uid() was never checked for null, and gen_random_bytes did not
--      resolve (see section 1).
--
-- TODO(product): redemption_limit is enforced as a TOTAL cap on the offer
-- (all users combined) - the literal reading of a bare integer column on
-- partner_offers with no user dimension. If "N times PER USER" was meant,
-- that is a different rule and needs its own column; confirm before relying
-- on it commercially.

create or replace function public.create_offer_redemption(p_offer_id uuid)
returns public.offer_redemptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_offer public.partner_offers;
  v_partner_ok boolean;
  v_balance integer;
  v_minutes integer;
  v_used integer;
  v_row public.offer_redemptions;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if public.is_banned() then
    raise exception 'Account is restricted';
  end if;

  if p_offer_id is null then
    raise exception 'Offer not found';
  end if;

  -- (a) Serialize every redemption of this offer (limit check) and every
  -- redemption by this user (balance check). Released at commit/rollback.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('akhoo.offer_redemption.offer:' || p_offer_id::text, 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('akhoo.offer_redemption.user:' || v_user_id::text, 0));

  perform public.expire_stale_offer_redemptions();

  select * into v_offer from public.partner_offers o where o.id = p_offer_id;
  if v_offer.id is null then
    raise exception 'Offer not found';
  end if;
  if v_offer.status <> 'approved' then
    raise exception 'Offer is not currently available';
  end if;
  if v_offer.valid_from is not null and v_offer.valid_from > pg_catalog.now() then
    raise exception 'Offer is not active yet';
  end if;
  if v_offer.valid_until is not null and v_offer.valid_until < pg_catalog.now() then
    raise exception 'Offer has expired';
  end if;

  if v_offer.partner_id is not null then
    select exists (
      select 1 from public.partners p
      where p.id = v_offer.partner_id and p.status = 'verified' and p.is_active
    ) into v_partner_ok;
    if not v_partner_ok then
      raise exception 'Offer is not currently available';
    end if;
  end if;

  -- (b) member_only, authoritative server-side copy of resolveOfferUseAction:
  -- an 'active' membership row that has no expiry or has not yet expired
  -- (same predicate as useMembership + isMembershipActive in the app).
  if v_offer.member_only then
    if not exists (
      select 1 from public.memberships m
      where m.user_id = v_user_id
        and m.status = 'active'
        and (m.expires_at is null or m.expires_at > pg_catalog.now())
    ) then
      raise exception 'This offer is for members only';
    end if;
  end if;

  -- (d) Already holding a live code for this offer: hand back the same one.
  -- No second charge, no second slot, no second QR.
  select * into v_row
  from public.offer_redemptions r
  where r.user_id = v_user_id
    and r.offer_id = p_offer_id
    and r.status = 'pending'
    and r.expires_at > pg_catalog.now()
  order by r.created_at desc
  limit 1;
  if v_row.id is not null then
    return v_row;
  end if;

  -- (c) redemption_limit. Only live holds and honoured redemptions use up a
  -- slot; a cancelled/expired code returns its slot the same way it returns
  -- its points, and a 'refunded' one (reversed by admin) does too.
  if v_offer.redemption_limit is not null then
    select pg_catalog.count(*) into v_used
    from public.offer_redemptions r
    where r.offer_id = p_offer_id
      and (r.status = 'redeemed' or (r.status = 'pending' and r.expires_at > pg_catalog.now()));
    if v_used >= v_offer.redemption_limit then
      raise exception 'This offer has reached its redemption limit';
    end if;
  end if;

  if coalesce(v_offer.points_required, 0) > 0 then
    v_balance := public.get_points_balance(v_user_id);
    if v_balance < v_offer.points_required then
      raise exception 'Not enough points for this offer';
    end if;
  end if;

  select s.value::integer into v_minutes from private.app_settings s where s.key = 'redemption_expiry_minutes';
  if v_minutes is null or v_minutes <= 0 then
    v_minutes := 30;
  end if;

  insert into public.offer_redemptions (offer_id, partner_id, user_id, code, status, expires_at, points_spent)
  values (
    p_offer_id,
    v_offer.partner_id,
    v_user_id,
    public.generate_redemption_code(),
    'pending',
    pg_catalog.now() + pg_catalog.make_interval(mins => v_minutes),
    coalesce(v_offer.points_required, 0)
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.create_offer_redemption(uuid) to authenticated;

-- ── 6. admin_redeem_offer_code: atomic transition ────────────────────────
--
-- 0022 SELECTed the pending row, then UPDATEd it by id with no status guard.
-- Two concurrent redeems of the same code (double-tap, two staff members)
-- could both pass the SELECT, both flip the row and write two audit entries.
-- A single UPDATE ... WHERE status = 'pending' is atomic: the second writer
-- blocks on the row lock, re-checks the WHERE after the first commits, and
-- matches nothing. It also races correctly against cancel_offer_redemption,
-- which already uses the same guarded-UPDATE shape. Behaviour, messages and
-- audit metadata are otherwise identical to 0022.

create or replace function public.admin_redeem_offer_code(p_code text)
returns public.offer_redemptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.offer_redemptions;
  v_title text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  perform public.expire_stale_offer_redemptions();

  update public.offer_redemptions r
  set status = 'redeemed', redeemed_at = pg_catalog.now()
  where r.code = p_code
    and r.status = 'pending'
    and r.expires_at > pg_catalog.now()
  returning r.* into v_row;

  if v_row.id is null then
    raise exception 'Invalid, expired, or already-used code';
  end if;

  select o.title into v_title from public.partner_offers o where o.id = v_row.offer_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (
    auth.uid(), 'redemption_redeemed', 'redemption', v_row.id, v_title,
    pg_catalog.jsonb_build_object('offer_id', v_row.offer_id, 'user_id', v_row.user_id, 'points_spent', v_row.points_spent)
  );

  return v_row;
end;
$$;

grant execute on function public.admin_redeem_offer_code(text) to authenticated;
