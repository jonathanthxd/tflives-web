import { headers } from "next/headers";
import { auth } from "@/infrastructure/auth/auth";

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getCurrentAuthUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}
