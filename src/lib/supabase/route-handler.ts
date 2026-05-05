import { getServiceRoleClient } from './service-role';
import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';

/**
 * Extracts and verifies the Bearer token from the Authorization header.
 *
 * The browser Supabase client stores the session in localStorage (not cookies),
 * so cookie-based auth on the server side doesn't work for this app.
 * Instead, every SWR fetch attaches `Authorization: Bearer <access_token>`,
 * and we verify it here via the service-role client's auth.getUser().
 *
 * Returns the authenticated User, or null if missing / invalid.
 */
export async function verifyUser(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;

  const { data: { user }, error } = await getServiceRoleClient().auth.getUser(token);
  if (error || !user) return null;
  return user;
}
