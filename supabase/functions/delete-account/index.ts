import { createClient } from 'jsr:@supabase/supabase-js@2'

// Deletes the CALLING user's own account and nothing else - the user id
// comes only from verifying their own JWT (forwarded automatically by
// supabase.functions.invoke() on the client), never from the request body,
// so this can't be used to delete anyone else's account. The client is
// responsible for re-authenticating with the user's current password
// before calling this (see authRepository.deleteAccount) - this function
// only checks that the caller is a currently-valid, signed-in user.
//
// The actual auth.users row deletion cascades through the schema's existing
// FK constraints (profiles, help_requests, volunteer_profiles, memberships,
// reviews, etc. are all ON DELETE CASCADE or ON DELETE SET NULL already -
// confirmed against the real schema, not assumed), so no manual per-table
// cleanup is needed here.
Deno.serve(async req => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: userData, error: userError } = await callerClient.auth.getUser()
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userData.user.id)
  if (deleteError) {
    console.error('[delete-account] deleteUser failed:', deleteError)
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  console.log(`[delete-account] deleted user ${userData.user.id}`)
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
