"use client";

import dynamic from "next/dynamic";

const SettingsPageClient = dynamic(() => import("./settings-page-client"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center" aria-busy="true">
      <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
    </div>
  ),
});

export default function SettingsPageShell() {
  return <SettingsPageClient />;
}
