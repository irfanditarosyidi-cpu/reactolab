"use client";

// Submicroscopic particle animation shown inside the inline magnifier lens /
// zoom panel (PRD §10.5, §30-C). One canvas, four modes.

import { useEffect, useRef } from "react";
import type { ExperimentConfig } from "@/lib/module-defs";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  kind: number; // 0 = species A, 1 = species B
}

interface Flash {
  x: number;
  y: number;
  ttl: number;
}

export interface ParticleConfig {
  kind: ExperimentConfig["kind"];
  factor: number; // selected option factor
  maxFactor: number;
}

export default function ParticleView({
  cfg,
  width,
  height,
  className,
}: {
  cfg: ParticleConfig;
  width?: number;
  height?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let particles: Particle[] = [];
    let flashes: Flash[] = [];
    let initKey = "";

    const init = (W: number, H: number) => {
      const c = cfgRef.current;
      const rel = Math.max(0.12, Math.min(1, c.factor / c.maxFactor));
      // particle count: concentration/surface scale with factor; others fixed
      const n =
        c.kind === "concentration"
          ? Math.round(10 + rel * 42)
          : c.kind === "temperature"
            ? 30
            : c.kind === "catalyst"
              ? 22
              : 26;
      // particle speed: temperature scales with factor
      const sp =
        c.kind === "temperature" ? 18 + rel * 70 : c.kind === "catalyst" ? 30 : 34;
      particles = [];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = sp * (0.6 + Math.random() * 0.8);
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H * (c.kind === "concentration" ? 0.8 : 1),
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          r: 3 + Math.random() * 2,
          kind: i % 2,
        });
      }
      flashes = [];
    };

    const solidPieces = (W: number, H: number) => {
      const c = cfgRef.current;
      const rel = c.factor / c.maxFactor;
      const count = Math.max(1, Math.round(rel * rel * 9));
      const size = Math.max(10, 46 / Math.sqrt(count));
      const rects: { x: number; y: number; w: number; h: number }[] = [];
      for (let i = 0; i < count; i++) {
        const gx = i % 3;
        const gy = Math.floor(i / 3);
        rects.push({
          x: W * 0.28 + gx * (size + 14) - ((Math.min(count, 3) - 1) * (size + 14)) / 2 + W * 0.2,
          y: H * 0.62 + gy * (size + 10) - size / 2,
          w: size,
          h: size,
        });
      }
      return rects;
    };

    const step = (now: number) => {
      const c = cfgRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const key = `${c.kind}-${c.factor}-${W}x${H}`;
      if (key !== initKey) {
        initKey = key;
        init(W, H);
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // background
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0f2a5e";
      ctx.fillRect(0, 0, W, H);

      const rects = c.kind === "surface" ? solidPieces(W, H) : [];

      // static solids
      if (c.kind === "concentration") {
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(0, H - 14, W, 14);
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(0, H - 14, W, 4);
      }
      if (c.kind === "surface") {
        for (const r of rects) {
          ctx.fillStyle = "#e7e5e4";
          ctx.fillRect(r.x, r.y, r.w, r.h);
          ctx.strokeStyle = "#a8a29e";
          ctx.strokeRect(r.x, r.y, r.w, r.h);
        }
      }
      let catX = 0;
      let catY = 0;
      if (c.kind === "catalyst" && c.factor > 1) {
        catX = W / 2;
        catY = H * 0.68;
        ctx.fillStyle = "#7c3aed";
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          const px = catX + Math.cos(a) * 16;
          const py = catY + Math.sin(a) * 16;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ddd6fe";
        ctx.font = "bold 9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("katalis", catX, catY + 3);
      }

      // move particles
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < p.r || p.x > W - p.r) {
          p.vx *= -1;
          p.x = Math.max(p.r, Math.min(W - p.r, p.x));
        }
        const floor = c.kind === "concentration" ? H - 14 : H;
        if (p.y < p.r || p.y > floor - p.r) {
          p.vy *= -1;
          p.y = Math.max(p.r, Math.min(floor - p.r, p.y));
          if (c.kind === "concentration" && p.y >= floor - p.r - 0.5) {
            // collision with metal surface → occasionally effective
            if (Math.random() < 0.35) flashes.push({ x: p.x, y: floor - 6, ttl: 0.5 });
          }
        }
        if (c.kind === "surface") {
          for (const r of rects) {
            if (
              p.x > r.x - p.r &&
              p.x < r.x + r.w + p.r &&
              p.y > r.y - p.r &&
              p.y < r.y + r.h + p.r
            ) {
              // bounce off the solid piece + flash on its surface
              if (Math.abs(p.x - (r.x + r.w / 2)) > Math.abs(p.y - (r.y + r.h / 2))) {
                p.vx *= -1;
              } else {
                p.vy *= -1;
              }
              if (Math.random() < 0.3)
                flashes.push({ x: p.x, y: p.y, ttl: 0.45 });
            }
          }
        }
        if (c.kind === "catalyst" && c.factor > 1) {
          const dx = p.x - catX;
          const dy = p.y - catY;
          if (dx * dx + dy * dy < 26 * 26 && Math.random() < 0.2) {
            flashes.push({ x: p.x, y: p.y, ttl: 0.5 });
          }
        }
      }

      // particle-particle effective collisions (temperature & catalyst-none)
      if (c.kind === "temperature" || (c.kind === "catalyst" && c.factor <= 1)) {
        const rel = c.factor / c.maxFactor;
        const chance = c.kind === "temperature" ? 0.08 + rel * 0.4 : 0.02;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];
            if (a.kind === b.kind) continue;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const rr = (a.r + b.r) * (a.r + b.r);
            if (dx * dx + dy * dy < rr) {
              const tvx = a.vx;
              const tvy = a.vy;
              a.vx = b.vx;
              a.vy = b.vy;
              b.vx = tvx;
              b.vy = tvy;
              if (Math.random() < chance)
                flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, ttl: 0.5 });
            }
          }
        }
      }

      // draw particles
      for (const p of particles) {
        ctx.fillStyle =
          c.kind === "concentration"
            ? p.kind === 0
              ? "#ef4444"
              : "#0284c7"
            : p.kind === 0
              ? "#60a5fa"
              : "#fbbf24";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // draw collision flashes
      flashes = flashes.filter((f) => (f.ttl -= dt) > 0);
      for (const f of flashes) {
        ctx.strokeStyle = `rgba(250, 204, 21, ${f.ttl * 2})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 6 + (0.5 - f.ttl) * 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width ?? 320}
      height={height ?? 170}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
