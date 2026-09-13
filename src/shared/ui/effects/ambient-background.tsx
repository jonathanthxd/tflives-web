"use client";

import { useStudio } from "@/providers/studio-provider";
import { StudioBackground } from "@/shared/ui/studio/studio-background";

export default function AmbientBackground() {
  const { background } = useStudio();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-background">
      <StudioBackground background={background} className="absolute inset-0" />
    </div>
  );
}
