import { headers } from "next/headers";
import { connection } from "next/server";
import { auth } from "@/infrastructure/auth/auth";

export async function getCurrentSession() {
  // Sessions depend on the incoming request. Explicitly terminate prerendering
  // before accessing request headers when Cache Components are enabled.
  await connection();
  return auth.api.getSession({ headers: await headers() });
}

export async function getCurrentAuthUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}
