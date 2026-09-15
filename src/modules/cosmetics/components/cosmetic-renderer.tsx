import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/shared/utilities/utils";
import {
  COSMETIC_PRESETS,
  presetCssVariables,
  type CosmeticTypeKey,
  type CosmeticVisualPresetKey,
} from "@/modules/cosmetics/visuals";

function styleFor(preset?: CosmeticVisualPresetKey): CSSProperties {
  return presetCssVariables(preset) as CSSProperties;
}

const FRAME_DETAIL_COUNTS: Record<string, number> = {
  metal: 5,
  mono: 5,
  wave: 7,
  pulse: 5,
  frost: 7,
  circuit: 8,
  flame: 9,
  toxic: 8,
  prism: 8,
  grid: 7,
  petal: 8,
  void: 7,
  flare: 8,
  royal: 7,
  nebula: 8,
  galaxy: 8,
};

/**
 * Avatar-frame motion is intentionally semantic rather than shared.
 * Each preset receives independent pieces so petals can fall, embers can rise,
 * circuit nodes can pulse, gems can sparkle, etc. The portrait stays circular;
 * the decorative silhouette is never clipped to that circle.
 */
function AvatarFrameDetails({ variant }: { variant: string }) {
  const count = FRAME_DETAIL_COUNTS[variant] ?? 0;
  if (!count) return null;
  return (
    <span aria-hidden className="cosmetic-avatar-frame__details">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={`cosmetic-avatar-frame__piece cosmetic-avatar-frame__piece--${index + 1}`} />
      ))}
    </span>
  );
}

export function CosmeticAvatarFrame({ preset, className, children }: { preset?: CosmeticVisualPresetKey; className?: string; children: ReactNode }) {
  const definition = preset ? COSMETIC_PRESETS[preset] : null;
  if (!definition || definition.type !== "AVATAR_FRAME") return <span className={cn("relative inline-grid shrink-0 place-items-center", className)}>{children}</span>;
  return (
    <span className={cn("cosmetic-avatar-frame relative inline-grid shrink-0 place-items-center", className)} data-variant={definition.variant} style={styleFor(preset)}>
      <span aria-hidden className="cosmetic-avatar-frame__aura" />
      <span aria-hidden className="cosmetic-avatar-frame__motif" />
      <span aria-hidden className="cosmetic-avatar-frame__orbit" />
      <span aria-hidden className="cosmetic-avatar-frame__particles" />
      <span aria-hidden className="cosmetic-avatar-frame__ornament" />
      <AvatarFrameDetails variant={definition.variant} />
      <span className="relative z-[4] inline-grid place-items-center">{children}</span>
    </span>
  );
}

export function CosmeticNameplate({ preset, children, className }: { preset?: CosmeticVisualPresetKey; children: ReactNode; className?: string }) {
  const definition = preset ? COSMETIC_PRESETS[preset] : null;
  if (!definition || definition.type !== "NAMEPLATE") return <span className={className}>{children}</span>;
  return (
    <span className={cn("cosmetic-nameplate", className)} data-variant={definition.variant} style={styleFor(preset)}>
      <span aria-hidden className="cosmetic-nameplate__microfx" />
      <span className="cosmetic-nameplate__label">{children}</span>
    </span>
  );
}

export function CosmeticBadge({ preset, label }: { preset?: CosmeticVisualPresetKey; label: string }) {
  const definition = preset ? COSMETIC_PRESETS[preset] : null;
  if (!definition || definition.type !== "PROFILE_BADGE" || !definition.badge) return null;
  return (
    <span
      className="cosmetic-profile-badge"
      data-variant={definition.variant}
      style={styleFor(preset)}
      aria-hidden={label ? undefined : true}
      aria-label={label || undefined}
      title={label || undefined}
    >
      <span aria-hidden>{definition.badge}</span>
    </span>
  );
}

export function CosmeticBannerLayer({ preset }: { preset?: CosmeticVisualPresetKey }) {
  const definition = preset ? COSMETIC_PRESETS[preset] : null;
  if (!definition || definition.type !== "BANNER_STYLE") return null;
  return <span aria-hidden className="cosmetic-banner-layer" data-variant={definition.variant} style={styleFor(preset)}><span /></span>;
}

export function CosmeticAccentLayer({ preset }: { preset?: CosmeticVisualPresetKey }) {
  const definition = preset ? COSMETIC_PRESETS[preset] : null;
  if (!definition || definition.type !== "PROFILE_ACCENT") return null;
  return <span aria-hidden className="cosmetic-profile-atmosphere" data-variant={definition.variant} style={styleFor(preset)}><span /></span>;
}

export function cosmeticAccentProps(preset?: CosmeticVisualPresetKey) {
  const definition = preset ? COSMETIC_PRESETS[preset] : null;
  if (!definition || definition.type !== "PROFILE_ACCENT") return {};
  return {
    "data-accent-variant": definition.variant,
    style: styleFor(preset),
  } as const;
}

export function CosmeticPreviewScene({ type, preset }: { type: CosmeticTypeKey; preset: CosmeticVisualPresetKey }) {
  const definition = COSMETIC_PRESETS[preset];
  const isType = definition.type === type;
  if (!isType) return null;
  return (
    <div className="cosmetic-preview-scene group relative grid h-28 place-items-center overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted/90 via-card to-primary/10" style={styleFor(preset)}>
      <span aria-hidden className="cosmetic-preview-glow" />
      {type === "AVATAR_FRAME" && (
        <CosmeticAvatarFrame preset={preset} className="translate-y-1">
          <span className="grid size-14 place-items-center rounded-full border-2 border-card bg-card text-lg font-bold text-foreground shadow-lg">T</span>
        </CosmeticAvatarFrame>
      )}
      {type === "PROFILE_BADGE" && <CosmeticBadge preset={preset} label="" />}
      {type === "NAMEPLATE" && <CosmeticNameplate preset={preset} className="text-sm font-bold">TFLives</CosmeticNameplate>}
      {type === "BANNER_STYLE" && (
        <span className="relative h-14 w-28 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 shadow-lg">
          <CosmeticBannerLayer preset={preset} />
        </span>
      )}
      {type === "PROFILE_ACCENT" && (
        <span className="relative h-16 w-28 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <span className="absolute inset-2 rounded-lg border border-white/25" />
          <CosmeticAccentLayer preset={preset} />
        </span>
      )}
    </div>
  );
}
