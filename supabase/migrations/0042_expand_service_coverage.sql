-- End the Jerusalem-only pilot. Existing clients treat no active pilot
-- zones as unrestricted service coverage. Keep historical rows for audit;
-- nearby matching and notification distance limits remain unchanged.
begin;
update public.pilot_zones set active = false where market = 'IL' and active;
commit;
