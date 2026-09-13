"use client";

import type { StudioBackgroundId } from "@/shared/studio/config";
import { cn } from "@/shared/utilities/utils";

export function StudioBackground({
  background,
  preview = false,
  animate = true,
  className,
}: {
  background: StudioBackgroundId;
  preview?: boolean;
  animate?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "studio-background",
        `studio-background--${background}`,
        preview && "studio-background--preview",
        !animate && "studio-background--paused",
        className,
      )}
    >
      <span className="studio-background__layer studio-background__layer--one" />
      <span className="studio-background__layer studio-background__layer--two" />
      <span className="studio-background__layer studio-background__layer--three" />
    </div>
  );
}
