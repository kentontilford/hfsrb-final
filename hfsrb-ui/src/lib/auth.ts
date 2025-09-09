// Minimal auth without Supabase: accept a static bearer token for admin actions.
// Set ADMIN_TOKEN in the environment and pass Authorization: Bearer <ADMIN_TOKEN> on requests.

export async function requireUser(req: Request) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) return null;
  const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
  if (token && token === adminToken) {
    return { role: 'admin' } as any;
  }
  return null;
}
