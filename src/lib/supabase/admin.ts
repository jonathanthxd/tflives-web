import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la service role key — bypassa RLS. Solo para uso server-side
 * en contextos administrativos puntuales (ej. generar links de confirmación
 * en desarrollo). Nunca exponer al cliente.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
