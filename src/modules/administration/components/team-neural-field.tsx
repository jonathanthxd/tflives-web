"use client";

/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, type Group, type Mesh } from "three";

function seeded(index: number, salt: number) {
  const x = Math.sin(index * 91.713 + salt * 37.119) * 43758.5453;
  return x - Math.floor(x);
}

function NeuralMesh({ activeIndex, memberCount }: { activeIndex: number; memberCount: number }) {
  const groupRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);

  const { pointGeometry, edgeGeometry } = useMemo(() => {
    const count = Math.max(30, Math.min(54, memberCount * 5 + 24));
    const points: [number, number, number][] = Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2 + seeded(index, 1) * 0.34;
      const radius = 1.35 + seeded(index, 2) * 2.15;
      const squash = 0.7 + seeded(index, 3) * 0.32;
      return [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * squash,
        (seeded(index, 4) - 0.5) * 2.25,
      ];
    });

    const pointPositions = points.flatMap((point) => point);
    const edgePositions: number[] = [];

    points.forEach((point, index) => {
      const neighbors = points
        .map((candidate, candidateIndex) => {
          if (candidateIndex === index) return null;
          const dx = point[0] - candidate[0];
          const dy = point[1] - candidate[1];
          const dz = point[2] - candidate[2];
          return { candidate, candidateIndex, distance: dx * dx + dy * dy + dz * dz };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, index % 4 === 0 ? 3 : 2);

      neighbors.forEach(({ candidate, candidateIndex }) => {
        if (candidateIndex < index) return;
        edgePositions.push(...point, ...candidate);
      });
    });

    const pointsBuffer = new BufferGeometry();
    pointsBuffer.setAttribute("position", new Float32BufferAttribute(pointPositions, 3));
    const edgesBuffer = new BufferGeometry();
    edgesBuffer.setAttribute("position", new Float32BufferAttribute(edgePositions, 3));

    return { pointGeometry: pointsBuffer, edgeGeometry: edgesBuffer };
  }, [memberCount]);

  useEffect(() => () => {
    pointGeometry.dispose();
    edgeGeometry.dispose();
  }, [edgeGeometry, pointGeometry]);

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(elapsed * 0.11 + activeIndex * 0.14) * 0.035;
      groupRef.current.rotation.x = Math.cos(elapsed * 0.08) * 0.025;
      groupRef.current.rotation.y += delta * 0.015;
      groupRef.current.position.y = Math.sin(elapsed * 0.22) * 0.045;
    }
    if (coreRef.current) {
      const pulse = 0.92 + Math.sin(elapsed * 1.35) * 0.08;
      coreRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef} rotation={[0.06, 0, 0]}>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color="#60a5fa" transparent opacity={0.2} depthWrite={false} toneMapped={false} />
      </lineSegments>
      <points geometry={pointGeometry}>
        <pointsMaterial
          color="#bae6fd"
          size={0.055}
          sizeAttenuation
          transparent
          opacity={0.82}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      <mesh ref={coreRef} position={[0, 0, -0.15]}>
        <sphereGeometry args={[0.58, 32, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.045} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.1]}>
        <ringGeometry args={[0.72, 0.735, 80]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.22} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function TeamNeuralField({ activeIndex, memberCount }: { activeIndex: number; memberCount: number }) {
  return (
    <div aria-hidden className="team-neural-field">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 6.4], fov: 49 }}
        gl={{ alpha: true, antialias: true }}
      >
        <NeuralMesh activeIndex={activeIndex} memberCount={memberCount} />
      </Canvas>
    </div>
  );
}
