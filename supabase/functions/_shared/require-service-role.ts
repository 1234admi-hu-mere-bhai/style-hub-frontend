// Shared helper to gate cron/internal-only edge functions.
// Returns a Response (403) if the caller is not the Supabase scheduler / service role.
// Returns null when the request is authorized.
export function requireServiceRole(req: Request, corsHeaders: Record<string, string>): Response | null {
  const expected = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!expected || token !== expected) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return null;
}
