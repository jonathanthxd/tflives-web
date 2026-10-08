"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
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
import { backgroundValues } from "@/shared/studio/appearance";

const Silk = dynamic(() => import("./backgrounds/silk"), { ssr: false });
const GhostFibers = dynamic(() => import("./backgrounds/ghost-fibers"), { ssr: false });
const CRTWarp = dynamic(() => import("./backgrounds/crt-warp"), { ssr: false });
const MoltenMetal = dynamic(() => import("./backgrounds/molten-metal"), { ssr: false });
const GradientWaves = dynamic(() => import("./backgrounds/gradient-waves"), { ssr: false });
const Prism = dynamic(() => import("./backgrounds/prism"), { ssr: false });
const LineWaves = dynamic(() => import("./backgrounds/line-waves"), { ssr: false });

function AnimatedBackground({
  background,
  paused,
}: {
  background: StudioAnimatedBackgroundId;
  paused: boolean;
}) {
  const { accent, backgroundSettings } = useStudio();
  const palette = getStudioAccent(accent);
  const options = backgroundValues(background, backgroundSettings);
  const pageBase = "#05010a";

  switch (background) {
    case "silk":
      return (
        <Silk
          speed={options.speed}
          scale={options.scale}
          color={palette.color}
          noiseIntensity={options.noiseIntensity}
          rotation={options.rotation}
          lightMode={false}
          paused={paused}
        />
      );
    case "ghost-fibers":
      return (
        <GhostFibers
          lineColor={palette.color}
          glowColor={palette.secondary}
          speed={options.speed}
          scale={options.scale}
          rotation={options.rotation}
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
          glowIntensity={options.glowIntensity}
          brightness={2}
          blueBoost={1.25}
          vignette={0.8}
          grain={0.05}
          dpr={1}
          lightMode={false}
          fps={60}
          paused={paused}
        />
      );
    case "crt-warp":
      return (
        <CRTWarp
          color={palette.color}
          backgroundColor={pageBase}
          speed={options.speed}
          curvature={options.curvature}
          scanlineStrength={options.scanlineStrength}
          scanlineFrequency={200}
          waveAmplitude={0.3}
          waveFrequency={2.5}
          bloom={options.bloom}
          bloomRadius={1}
          noise={0.1}
          vignette={0}
          brightness={1.25}
          pixelation={1}
          rgbShift={0.015}
          mouseReact={!paused && options.mouseReact >= 0.5}
          mouseStrength={0.5}
          dpr={1}
          fps={30}
          paused={paused}
        />
      );
    case "molten-metal":
      return (
        <MoltenMetal
          color1={palette.color}
          color2={palette.secondary}
          color3="#FFFFFF"
          speed={options.speed}
          scale={options.scale}
          detail={3}
          glow={options.glow}
          coreSize={0.1}
          swirl={options.swirl}
          fold={-0.2}
          blackPoint={0.05}
          brightness={1.3}
          colorMode="molten"
          grain
          grainIntensity={0.05}
          mouseInteraction={false}
          mouseStrength={0}
          opacity={1}
          backgroundColor={pageBase}
          lightMode={false}
          paused={paused}
        />
      );
    case "gradient-waves":
      return (
        <GradientWaves
          horizonColor={palette.color}
          waveColor={palette.secondary}
          crestColor="#FFFFFF"
          speed={options.speed}
          amplitude={options.amplitude}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={options.zoom}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1}
          opacity={1}
          mouseInteraction={!paused && options.mouseInteraction >= 0.5}
          parallaxStrength={0.5}
          grain
          grainIntensity={0.05}
          paused={paused}
        />
      );
    case "prism":
      return (
        <Prism
          animationType="rotate"
          timeScale={paused ? 0 : options.timeScale}
          height={3.5}
          baseWidth={5.5}
          scale={options.scale}
          hueShift={palette.prismHueShift}
          colorFrequency={1}
          noise={options.noise}
          glow={options.glow}
          lightMode={false}
        />
      );
    case "line-waves":
      return (
        <LineWaves
          speed={options.speed}
          innerLineCount={32}
          outerLineCount={36}
          warpIntensity={options.warpIntensity}
          rotation={options.rotation}
          edgeFadeWidth={0}
          colorCycleSpeed={1}
          brightness={0.2}
          color1={palette.color}
          color2={palette.secondary}
          color3={palette.tertiary}
          enableMouseInteraction={!paused && options.enableMouseInteraction >= 0.5}
          mouseInfluence={2}
          lightMode={false}
          paused={paused}
        />
      );
  }
}

function StudioBackgroundSurface({
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
    return <ReactiveShadingBackground paused={!animate} className={className} />;
  }

  if (isAnimatedStudioBackground(background)) {
    if (lightMode && !preview) {
      return (
        <div
          aria-hidden="true"
          className={cn("studio-background studio-background--dot", className)}
        />
      );
    }

    return (
      <div
        aria-hidden="true"
        className={cn(
          "studio-background studio-background--animated",
          preview && "studio-background--preview",
          className,
        )}
      >
        <div className="absolute inset-0">
          <AnimatedBackground background={background} paused={!animate} />
        </div>
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

export function StudioBackground(props: Parameters<typeof StudioBackgroundSurface>[0]) {
  const { composition } = useStudio();
  const visibilityRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    let onScreen = true;
    const update = () => setVisible(onScreen && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; update(); });
    if (visibilityRef.current) observer.observe(visibilityRef.current);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  const filtered = composition.blur !== 0 || composition.brightness !== 1 || composition.saturation !== 1;
  return (
    <div ref={visibilityRef} aria-hidden="true" className={cn("absolute inset-0 overflow-hidden", props.className)} data-studio-composition="true">
      <div className="absolute" data-studio-filter="true" style={{
        inset: composition.blur > 0 ? -composition.blur * 2 : 0,
        filter: filtered ? `blur(${composition.blur}px) brightness(${composition.brightness}) saturate(${composition.saturation})` : "none",
        opacity: composition.opacity,
      }}>
        <StudioBackgroundSurface {...props} animate={props.animate !== false && visible} className={undefined} />
      </div>
      {composition.darken > 0 && <span className="pointer-events-none absolute inset-0" data-studio-darken="true" style={{ background: `rgba(0,0,0,${composition.darken})` }} />}
      {composition.vignette > 0 && <span className="pointer-events-none absolute inset-0" data-studio-vignette="true" style={{ background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${composition.vignette}) 100%)` }} />}
    </div>
  );
}
