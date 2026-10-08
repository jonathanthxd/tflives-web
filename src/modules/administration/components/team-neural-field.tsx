"use client";

import { Html, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  type Group,
  type Mesh,
  Vector3,
} from "three";
import { CosmeticAvatarFrame } from "@/modules/cosmetics/components/cosmetic-renderer";
import { UserAvatar } from "@/modules/profiles/components/user-identity";
import type { TeamConstellationMember } from "@/modules/administration/components/team-constellation";

import { teamSpacePosition, type TeamSpacePoint } from "./team-space";

function nearestEdges(points: TeamSpacePoint[], neighbors = 3) {
  const seen = new Set<string>();
  const lines: number[] = [];

  points.forEach((point, index) => {
    points
      .map((candidate, candidateIndex) => {
        if (candidateIndex === index) return null;
        const dx = point[0] - candidate[0];
        const dy = point[1] - candidate[1];
        const dz = point[2] - candidate[2];
        return { candidateIndex, distance: dx * dx + dy * dy + dz * dz };
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, neighbors)
      .forEach(({ candidateIndex }) => {
        const from = Math.min(index, candidateIndex);
        const to = Math.max(index, candidateIndex);
        const key = `${from}:${to}`;
        if (seen.has(key)) return;
        seen.add(key);
        lines.push(...points[from], ...points[to]);
      });
  });

  return lines;
}

function activeEdges(points: TeamSpacePoint[], activeIndex: number) {
  const source = points[activeIndex];
  if (!source) return [];
  const nearest = points
    .map((candidate, index) => {
      if (index === activeIndex) return null;
      const dx = source[0] - candidate[0];
      const dy = source[1] - candidate[1];
      const dz = source[2] - candidate[2];
      return { index, distance: dx * dx + dy * dy + dz * dz };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  return nearest.flatMap(({ index }) => [...source, ...points[index]]);
}

function useLineGeometry(values: number[]) {
  const geometry = useMemo(() => {
    const next = new BufferGeometry();
    next.setAttribute("position", new Float32BufferAttribute(values, 3));
    return next;
  }, [values]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

function CameraRig({ points, activeIndex }: { points: TeamSpacePoint[]; activeIndex: number }) {
  const targetRef = useRef(new Vector3());
  const desiredCamera = useRef(new Vector3());
  const desiredTarget = useRef(new Vector3());

  useFrame(({ camera, clock }, delta) => {
    const point = points[activeIndex] ?? points[0] ?? ([0, 0, 0] as const);
    const phase = activeIndex * 1.61803398875;
    const breathe = Math.sin(clock.getElapsedTime() * 0.26 + phase) * 0.09;

    desiredTarget.current.set(point[0], point[1], point[2]);
    desiredCamera.current.set(
      point[0] + Math.sin(phase * 0.87) * 0.46,
      point[1] + Math.cos(phase * 0.63) * 0.34 + breathe,
      point[2] + 7.65 + Math.sin(phase * 0.41) * 0.38,
    );

    const positionEase = 1 - Math.exp(-delta * 2.35);
    const targetEase = 1 - Math.exp(-delta * 2.8);
    camera.position.lerp(desiredCamera.current, positionEase);
    targetRef.current.lerp(desiredTarget.current, targetEase);
    camera.lookAt(targetRef.current);
  });

  return null;
}

function ConstellationMesh({
  points,
  activeIndex,
}: {
  points: TeamSpacePoint[];
  activeIndex: number;
}) {
  const groupRef = useRef<Group>(null);
  const pulseRef = useRef<Mesh>(null);

  const pointValues = useMemo(() => points.flatMap((point) => [...point]), [points]);
  const edgeValues = useMemo(() => nearestEdges(points, points.length > 28 ? 2 : 3), [points]);
  const activeValues = useMemo(() => activeEdges(points, activeIndex), [points, activeIndex]);

  const pointGeometry = useLineGeometry(pointValues);
  const edgeGeometry = useLineGeometry(edgeValues);
  const activeGeometry = useLineGeometry(activeValues);


  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(elapsed * 0.08) * 0.018;
      groupRef.current.rotation.x = Math.cos(elapsed * 0.065) * 0.012;
      groupRef.current.rotation.y += delta * 0.004;
    }
    if (pulseRef.current) {
      const point = points[activeIndex] ?? ([0, 0, 0] as const);
      pulseRef.current.position.set(point[0], point[1], point[2]);
      const scale = 0.72 + Math.sin(elapsed * 1.75) * 0.09;
      pulseRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial
          color="#93c5fd"
          transparent
          opacity={0.13}
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </lineSegments>
      <lineSegments geometry={activeGeometry}>
        <lineBasicMaterial
          color="#dbeafe"
          transparent
          opacity={0.58}
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </lineSegments>
      <points geometry={pointGeometry}>
        <pointsMaterial
          color="#bfdbfe"
          size={0.06}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </points>

      <mesh ref={pulseRef}>
        <ringGeometry args={[0.62, 0.65, 64]} />
        <meshBasicMaterial
          color="#e0f2fe"
          transparent
          opacity={0.5}
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function MemberNodes({
  members,
  points,
  activeIndex,
  onSelect,
}: {
  members: TeamConstellationMember[];
  points: TeamSpacePoint[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <>
      {members.map((member, index) => {
        const point = points[index];
        const selected = index === activeIndex;

        return (
          <group key={member.id} position={point}>
            <mesh scale={selected ? 1.5 : 1}>
              <sphereGeometry args={[selected ? 0.12 : 0.075, 18, 18]} />
              <meshBasicMaterial
                color={selected ? "#e0f2fe" : "#93c5fd"}
                transparent
                opacity={selected ? 0.85 : 0.34}
                depthWrite={false}
                toneMapped={false}
                blending={AdditiveBlending}
              />
            </mesh>

            {!selected ? (
              <Html
                center
                distanceFactor={8.4}
                zIndexRange={[3, 0]}
                style={{ pointerEvents: "auto" }}
              >
                <button
                  type="button"
                  className="team-neural-space-node"
                  onClick={() => onSelect(index)}
                  aria-label={`${member.displayName} — ${member.roleTitle}`}
                  title={`${member.displayName} — ${member.roleTitle}`}
                >
                  <span className="team-neural-space-node__orbit" aria-hidden />
                  <span className="team-neural-space-node__avatar">
                    <CosmeticAvatarFrame preset={member.cosmetics.avatarFrame} className="team-neural-space-node__frame">
                      <UserAvatar identity={member} alt="" className="size-11 text-sm" />
                    </CosmeticAvatarFrame>
                  </span>
                  <span className="team-neural-space-node__label" aria-hidden>
                    <strong>{member.displayName}</strong>
                    <small>{member.roleTitle}</small>
                  </span>
                </button>
              </Html>
            ) : null}
          </group>
        );
      })}
    </>
  );
}

export default function TeamNeuralField({
  members,
  activeIndex,
  onSelect,
}: {
  members: TeamConstellationMember[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const points = useMemo(
    () => members.map((_, index) => teamSpacePosition(index, members.length)),
    [members],
  );

  return (
    <div aria-hidden={false} className="team-neural-field">
      <Canvas
        dpr={[1, 1.65]}
        camera={{ position: [0, 0, 7.8], fov: 48, near: 0.1, far: 60 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Stars radius={26} depth={18} count={950} factor={2.3} saturation={0.08} fade speed={0.2} />
        <CameraRig points={points} activeIndex={activeIndex} />
        <ConstellationMesh points={points} activeIndex={activeIndex} />
        <MemberNodes members={members} points={points} activeIndex={activeIndex} onSelect={onSelect} />
      </Canvas>
    </div>
  );
}
