import Image from "next/image";
import { cn } from "@/shared/utilities/utils";

/** Single source of truth for the official TFLives symbol.
 * The supplied white SVG stays unchanged; the dark tile ensures contrast in light and dark themes.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-grid shrink-0 place-items-center overflow-hidden rounded-[22%] bg-[#111827] p-[12%] ring-1 ring-white/10", className)}
    >
      <Image src="/brand/tflives.svg" alt="" width={96} height={96} unoptimized className="block h-full w-full object-contain" />
    </span>
  );
}
