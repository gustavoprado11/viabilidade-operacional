import { createServerClient, type CookieOptions } from '@supabase/ssr';
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import type { Database } from '@/lib/supabase/types';

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Server-side Supabase client bound to the user's session via Next cookies.
 * Honors RLS — every query runs as the authenticated user.
 */
export async function createClient(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — cookies are read-only.
            // The middleware refreshes sessions; ignore here.
          }
        },
      },
    },
  ) as unknown as TypedSupabaseClient;
}

/**
 * Service-role client — BYPASSES RLS. Use only for:
 *   - bootstrap/seed scripts (scripts/bootstrap-data.ts)
 *   - admin-only server actions that explicitly justify the bypass
 *
 * Never import this from a Client Component or Route Handler exposed
 * to the browser. Every call site must document why RLS is bypassed.
 */
export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
