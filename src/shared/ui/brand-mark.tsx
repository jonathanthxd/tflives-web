import Image from "next/image";
import { cn } from "@/shared/utilities/utils";

/**
 * Official TFLives logo on a transparent canvas, with no background tile,
 * border, ring or padding. White on dark themes; dark on light backgrounds.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/icons/icon-192.png"
      alt=""
      aria-hidden="true"
      width={96}
      height={96}
      unoptimized
      className={cn(
        "inline-block shrink-0 object-contain brightness-0 dark:brightness-100",
        className,
      )}
    />
  );
}
