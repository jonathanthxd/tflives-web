import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * Sube un avatar o banner al bucket público "avatars" (ver
 * supabase/migrations/20260730000001_avatars_bucket.sql para las políticas
 * de RLS: cada usuario solo puede escribir en su propia carpeta) y devuelve
 * la URL pública con un cache-buster.
 */
export async function uploadProfileAsset(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  kind: "avatar" | "banner"
): Promise<string> {
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error("La imagen no puede superar los 2MB");
  }

  const ext = file.name.split(".").pop();
  const path = `${userId}/${kind}.${ext}`;

  const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
  });
  if (uploadErr) throw uploadErr;

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  return `${publicUrl}?t=${Date.now()}`;
}
