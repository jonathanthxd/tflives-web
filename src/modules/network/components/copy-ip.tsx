"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
export default function CopyIp() {
  const t = useTranslations("Content");
  const [message, setMessage] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <code className="select-all break-all text-lg">mc.tflives.com</code>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText("mc.tflives.com");
              setMessage(t("copied"));
            } catch {
              setMessage(t("copyFailed"));
            }
          }}
        >
          {t("copy")}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground" role="status">
        {message}
      </p>
    </div>
  );
}
