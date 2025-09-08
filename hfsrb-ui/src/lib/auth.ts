import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getUserFromRequest(req: Request) {
  try {
    const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    const token = (auth.startsWith('Bearer ') ? auth.slice(7) : undefined) || getCookie(req, 'sb-access-token');
    if (!token) return null;
    const supabase = createClient(supabaseUrl, supabaseAnon);
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data.user ?? null;
  } catch { return null; }
}

export async function requireUser(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return null;
  const allowedDomain = process.env.ADMIN_EMAIL_DOMAIN;
  const allowedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!allowedDomain && allowedEmails.length === 0) return user; // open to any signed-in user
  const email = (user.email || '').toLowerCase();
  if (allowedEmails.includes(email)) return user;
  if (allowedDomain && email.endsWith(`@${allowedDomain.toLowerCase()}`)) return user;
  return null;
}

function getCookie(req: Request, name: string) {
  const header = req.headers.get('cookie') || '';
  const parts = header.split(/;\s*/);
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k === name) return decodeURIComponent(v || '');
  }
  return undefined;
}

