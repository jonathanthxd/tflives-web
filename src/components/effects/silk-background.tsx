"use client";

import { useEffect, useRef } from "react";

export default function SilkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    const scale = 2;
    const noiseIntensity = 0.5; // ligeramente menor para que los pliegues sean más suaves

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const noise = (x: number, y: number) => {
      const G = 2.71828;
      const rx = G * Math.sin(G * x);
      const ry = G * Math.sin(G * y);
      return (rx * ry * (1 + x)) % 1;
    };

    const animate = () => {
      const { width, height } = canvas;

      // Fondo degradado azul noche muy oscuro
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#08081a");
      gradient.addColorStop(0.5, "#0f0f2c");
      gradient.addColorStop(1, "#08081a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Recorremos píxeles con paso 2 para suavizar y ahorrar rendimiento
      for (let x = 0; x < width; x += 2) {
        for (let y = 0; y < height; y += 2) {
          const u = (x / width) * scale;
          const v = (y / height) * scale;

          const t = time * 0.5; // velocidad de la animación (antes era 0.02, ahora mucho más rápida)
          let tex_x = u;
          let tex_y = v + 0.03 * Math.sin(8.0 * tex_x - t * 2); // mayor amplitud y frecuencia temporal

          // Patrón sedoso con varias frecuencias
          const pattern =
            0.55 +
            0.45 *
              Math.sin(
                5.0 *
                  (tex_x +
                    tex_y +
                    Math.cos(3.0 * tex_x + 5.0 * tex_y) +
                    0.2 * t) +   // antes 0.02*t, ahora 0.2*t -> movimiento perceptible
                  Math.sin(20.0 * (tex_x + tex_y - 0.5 * t))  // antes 0.1*t, ahora 0.5*t
              );

          const rnd = noise(x, y);
          // Intensidad base (0 a 1)
          let intensity = pattern - (rnd / 15.0) * noiseIntensity;
          intensity = Math.max(0, Math.min(1, intensity));

          // --- Brillo sutil blanco/azulado en las partes más claras ---
          const highlightThreshold = 0.65;
          let glow = 0;
          if (intensity > highlightThreshold) {
            // El brillo crece linealmente hasta intensity = 1
            glow = (intensity - highlightThreshold) / (1 - highlightThreshold);
            // Suavizamos para que no sea un corte brusco
            glow = glow * glow * 0.4; // factor 0.4 para que sea muy sutil
          }

          // Color base: azul noche profundo
          const baseR = 18, baseG = 28, baseB = 75;
          // Color del brillo: azul muy claro / blanco
          const glowR = 200, glowG = 220, glowB = 255;

          // Mezcla: color base + brillo
          const r = Math.floor(baseR + glow * (glowR - baseR));
          const g = Math.floor(baseG + glow * (glowG - baseG));
          const b = Math.floor(baseB + glow * (glowB - baseB));
          const a = 255;

          const index = (y * width + x) * 4;
          if (index + 3 < data.length) {
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = a;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Viñeta radial (oscurece bordes)
      const overlayGradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) / 2
      );
      overlayGradient.addColorStop(0, "rgba(0,0,0,0.05)");
      overlayGradient.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, width, height);

      time += 0.02; // incremento por frame (60fps -> ~1.2 por segundo, el movimiento es fluido)
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        filter: "blur(0.4px)", // un ligero desenfoque para suavizar
      }}
    />
  );
}