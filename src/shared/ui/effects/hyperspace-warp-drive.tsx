"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HyperspaceWarpDrive() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    currentMount.appendChild(renderer.domElement);

    // --- GLSL Shader Code (TFLives Edition) ---

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;

      // Pseudo-random number generator
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main() {
        vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
        
        // TFLives deep night background: #0B1120
        vec3 color = vec3(0.043, 0.067, 0.125);
        
        // Mouse influence (warp distortion)
        st += u_mouse * 0.08;

        float len = length(st);
        
        // Convert to polar coordinates
        vec2 polar = vec2(atan(st.y, st.x), len);
        
        // Number of stars/streaks
        float num_stars = 250.0;
        polar.x *= num_stars;

        // Create star seeds
        float star_seed = floor(polar.x) + 0.5;
        float random_star = random(vec2(star_seed));
        
        // Animate stars moving outwards — speed increases with mouse movement
        float time_offset = u_time * (0.3 + random_star * 0.4);
        float star_pos = fract(random_star + time_offset) * 2.0;
        
        // Create streaks
        float streak_width = 0.004 + random_star * 0.004;
        float star_streak = smoothstep(-streak_width, streak_width, polar.y - star_pos) - 
                          smoothstep(streak_width, streak_width + 0.15, polar.y - star_pos);

        // Fade stars at the edges
        star_streak *= smoothstep(0.0, 0.2, polar.y) * smoothstep(1.0, 0.6, polar.y);

        // TFLives blue palette based on randomness
        float brightness = 0.6 + random_star * 0.4;
        vec3 star_color;
        
        // 70% sky blue (#60A5FA), 20% pastel (#93C5FD), 10% glacier (#BFDBFE)
        float color_roll = random(vec2(star_seed, 3.0));
        if (color_roll > 0.9) {
          // Glacier: #BFDBFE
          star_color = vec3(0.749, 0.859, 0.996) * brightness;
        } else if (color_roll > 0.7) {
          // Pastel: #93C5FD
          star_color = vec3(0.576, 0.773, 0.992) * brightness;
        } else {
          // Sky: #60A5FA
          star_color = vec3(0.376, 0.647, 0.980) * brightness;
        }

        color += star_streak * star_color;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // --- Shader Material ---
    const uniforms = {
      u_time: { value: 0.0 },
      u_resolution: {
        value: new THREE.Vector2(
          currentMount.clientWidth,
          currentMount.clientHeight
        ),
      },
      u_mouse: { value: new THREE.Vector2() },
    };

    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const planeMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);

    // --- Mouse Interaction ---
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove, false);

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    let rafId: number;

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // Smooth mouse interpolation
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      uniforms.u_mouse.value.x = currentMouseX;
      uniforms.u_mouse.value.y = currentMouseY;
      uniforms.u_time.value = clock.getElapsedTime();

      renderer.render(scene, camera);
    };

    animate();

    // --- Responsive Handling ---
    const handleResize = () => {
      const width = currentMount.clientWidth;
      const height = currentMount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      uniforms.u_resolution.value.set(width, height);
    };

    window.addEventListener("resize", handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
      renderer.dispose();
      planeGeometry.dispose();
      planeMaterial.dispose();
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full"
      style={{
        filter: "blur(0.4px)", // Minimal blur for visual comfort
      }}
    />
  );
}