-- Lets a business partner redeem their own offer codes directly from the
-- app's Partner Tools QR scanner, instead of routing every redemption
-- through admin staff (0022's admin_redeem_offer_code, which stays - still
-- used for codes with no partner_id, or when a partner disputes a scan and
-- admin needs to step in). Mirrors admin_redeem_offer_code's logic exactly,
-- except authorization is has_partner_access(v_row.partner_id) instead of
-- is_admin(), and a null partner_id (an AKHOO-general offer with no linked
-- business) is never redeemable this way - nobody holds partner access to
-- "no partner", so it falls through to the same exception as any other
-- unauthorized code.
create or replace function public.partner_redeem_offer_code(p_code text)
returns public.offer_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.offer_redemptions;
  v_title text;
begin
  if public.is_banned() then
    raise exception 'Account is restricted';
  end if;

  perform public.expire_stale_offer_redemptions();

  select * into v_row from public.offer_redemptions where code = p_code and status = 'pending';
  if v_row.id is null then
    raise exception 'Invalid, expired, or already-used code';
  end if;

  if v_row.partner_id is null or not public.has_partner_access(v_row.partner_id) then
    raise exception 'Not authorized to redeem this code';
  end if;

  update public.offer_redemptions set status = 'redeemed', redeemed_at = now() where id = v_row.id
  returning * into v_row;

  select title into v_title from public.partner_offers where id = v_row.offer_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'redemption_redeemed', 'redemption', v_row.id, v_title, jsonb_build_object(
    'offer_id', v_row.offer_id, 'user_id', v_row.user_id, 'points_spent', v_row.points_spent,
    'redeemed_by_partner_user', true
  ));

  return v_row;
end;
$$;

grant execute on function public.partner_redeem_offer_code(text) to authenticated;
