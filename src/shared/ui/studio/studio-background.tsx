"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useStudio } from "@/providers/studio-provider";
import {
  getStudioAccent,
  isAnimatedStudioBackground,
  type StudioAnimatedBackgroundId,
  type StudioBackgroundId,
} from "@/shared/studio/config";
import ReactiveShadingBackground from "@/shared/ui/studio/reactive-shading-background";
import { cn } from "@/shared/utilities/utils";

const Silk = dynamic(() => import("./backgrounds/silk"), { ssr: false });
const GhostFibers = dynamic(() => import("./backgrounds/ghost-fibers"), { ssr: false });
const CRTWarp = dynamic(() => import("./backgrounds/crt-warp"), { ssr: false });
const MoltenMetal = dynamic(() => import("./backgrounds/molten-metal"), { ssr: false });
const GradientWaves = dynamic(() => import("./backgrounds/gradient-waves"), { ssr: false });
const Prism = dynamic(() => import("./backgrounds/prism"), { ssr: false });
const LineWaves = dynamic(() => import("./backgrounds/line-waves"), { ssr: false });

function AnimatedBackground({
  background,
  lightMode,
}: {
  background: StudioAnimatedBackgroundId;
  lightMode: boolean;
}) {
  const { accent } = useStudio();
  const palette = getStudioAccent(accent);
  const pageBase = lightMode ? "#f8fafc" : "#05010a";

  switch (background) {
    case "silk":
      return (
        <Silk
          speed={5}
          scale={1}
          color={palette.color}
          noiseIntensity={1.5}
          rotation={0}
          lightMode={lightMode}
        />
      );
    case "ghost-fibers":
      return (
        <GhostFibers
          lineColor={palette.color}
          glowColor={palette.secondary}
          speed={0.2}
          scale={2}
          rotation={0}
          rotationSpeed={0.25}
          layers={4}
          waveAmplitude={0.015}
          waveFrequency={3}
          waveSpeed={0.15}
          layerSpeed={0.08}
          twist={0.1}
          twistFrequency={5}
          twistSpeed={1.2}
          lineFrequency={5}
          lineSpacing={2}
          lineSharpness={16}
          glowFalloff={10}
          glowIntensity={1.6}
          brightness={2}
          blueBoost={1.25}
          vignette={0.8}
          grain={0.05}
          dpr={1}
          lightMode={lightMode}
          fps={60}
          paused={false}
        />
      );
    case "crt-warp":
      return (
        <CRTWarp
          color={palette.color}
          backgroundColor={pageBase}
          speed={0.5}
          curvature={0.25}
          scanlineStrength={0.25}
          scanlineFrequency={200}
          waveAmplitude={0.3}
          waveFrequency={2.5}
          bloom={1.5}
          bloomRadius={1}
          noise={0.1}
          vignette={0}
          brightness={1.25}
          pixelation={1}
          rgbShift={0.015}
          mouseReact
          mouseStrength={0.5}
          dpr={1}
          fps={30}
          paused={false}
        />
      );
    case "molten-metal":
      return (
        <MoltenMetal
          color1={palette.color}
          color2={palette.secondary}
          color3="#FFFFFF"
          speed={0.35}
          scale={4}
          detail={3}
          glow={1.6}
          coreSize={0.1}
          swirl={1}
          fold={-0.2}
          blackPoint={0.05}
          brightness={1.3}
          colorMode="molten"
          grain
          grainIntensity={0.05}
          mouseInteraction
          mouseStrength={0.3}
          opacity={1}
          backgroundColor={pageBase}
          lightMode={lightMode}
        />
      );
    case "gradient-waves":
      return (
        <GradientWaves
          horizonColor={palette.color}
          waveColor={palette.secondary}
          crestColor="#FFFFFF"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1}
          opacity={1}
          mouseInteraction
          parallaxStrength={0.5}
          grain
          grainIntensity={0.05}
        />
      );
    case "prism":
      return (
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={palette.prismHueShift}
          colorFrequency={1}
          noise={0}
          glow={1}
          lightMode={lightMode}
        />
      );
    case "line-waves":
      return (
        <LineWaves
          speed={0.3}
          innerLineCount={32}
          outerLineCount={36}
          warpIntensity={1}
          rotation={-45}
          edgeFadeWidth={0}
          colorCycleSpeed={1}
          brightness={0.2}
          color1={palette.color}
          color2={palette.secondary}
          color3={palette.tertiary}
          enableMouseInteraction
          mouseInfluence={2}
          lightMode={lightMode}
        />
      );
  }
}

function StaticAnimatedPreview({ background }: { background: StudioAnimatedBackgroundId }) {
  return (
    <div
      className={cn(
        "studio-preview-fallback absolute inset-0",
        `studio-preview-fallback--${background}`,
      )}
    />
  );
}

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
  const { resolvedTheme } = useTheme();
  const lightMode = resolvedTheme === "light";

  if (background === "shading" && !preview) {
    return <ReactiveShadingBackground className={className} />;
  }

  if (isAnimatedStudioBackground(background)) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "studio-background studio-background--animated",
          preview && "studio-background--preview",
          className,
        )}
      >
        {animate ? (
          <div className="absolute inset-0">
            <AnimatedBackground background={background} lightMode={lightMode} />
          </div>
        ) : (
          <StaticAnimatedPreview background={background} />
        )}
        {preview && <span className="studio-background__preview-frame" />}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "studio-background",
        `studio-background--${background}`,
        preview && "studio-background--preview",
        className,
      )}
    >
      {background === "shading" && preview && (
        <>
          <span className="studio-static-shading-preview studio-static-shading-preview--one" />
          <span className="studio-static-shading-preview studio-static-shading-preview--two" />
        </>
      )}
      {preview && <span className="studio-background__preview-frame" />}
    </div>
  );
}
