import { connection } from "next/server";
import SettingsPageShell from "./settings-page-shell";

// This is a private, user-specific page. With Cache Components enabled,
// `instant = false` only opts out of instant-navigation validation; it does
// not itself stop build-time prerendering. `connection()` creates the
// request-time boundary explicitly so Vercel does not try to prerender the
// authenticated settings route during `next build`.
export const instant = false;

export default async function SettingsPage() {
  await connection();
  return <SettingsPageShell />;
}
