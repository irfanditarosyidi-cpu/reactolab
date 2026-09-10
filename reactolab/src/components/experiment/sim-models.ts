// Canvas drawing + timing models for the four virtual experiments (PRD §18–§21).
// Simulated time is accelerated; the stopwatch shows "simulated seconds".

import type { ExperimentConfig } from "@/lib/module-defs";

export interface DrawOpts {
  factor: number;
  label: string;
  t: number; // simulated seconds
  duration: number;
  progress: number; // 0..1
  volume?: number;
  vmax?: number;
}

/** Simulated seconds needed for one run. */
export function runDuration(cfg: ExperimentConfig, factor: number): number {
  switch (cfg.kind) {
    case "concentration":
      return round1(18 / factor); // Mg strip fully dissolved
    case "temperature":
      return round1(24 * Math.pow(2, (30 - factor) / 20)); // X mark disappears
    case "surface":
    case "catalyst":
      return cfg.gas?.duration ?? 40; // fixed observation window
  }
}

/** Gas volume produced at simulated time t (surface & catalyst experiments). */
export function volumeAt(cfg: ExperimentConfig, factor: number, t: number): number {
  const vmax = cfg.gas?.vmax ?? 50;
  const k = cfg.kind === "surface" ? 0.02 * factor : 0.012 * factor;
  return vmax * (1 - Math.exp(-k * t));
}

export function buildSeries(
  cfg: ExperimentConfig,
  factor: number
): { t: number; v: number }[] {
  const every = cfg.gas?.sampleEvery ?? 2;
  const dur = cfg.gas?.duration ?? 40;
  const out: { t: number; v: number }[] = [];
  for (let t = 0; t <= dur; t += every) {
    out.push({ t, v: Math.round(volumeAt(cfg, factor, t) * 10) / 10 });
  }
  return out;
}

export function computeRate(
  cfg: ExperimentConfig,
  factor: number,
  duration: number
): { rate: number; rateLabel: string } {
  if (cfg.rateKind === "inverseTime") {
    const rate = 1 / duration;
    return { rate, rateLabel: `${rate.toFixed(4)} ${cfg.rateUnit}` };
  }
  const v10 = volumeAt(cfg, factor, 10);
  const rate = v10 / 10;
  return { rate, rateLabel: `${rate.toFixed(2)} ${cfg.rateUnit}` };
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

// deterministic pseudo-random per index (stable bubbles)
function hash(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ---------- shared primitives ----------

function drawBeaker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  liquid: string,
  liquidLevel = 0.78
) {
  // liquid
  const lh = h * liquidLevel;
  ctx.fillStyle = liquid;
  ctx.fillRect(x + 3, y + h - lh, w - 6, lh - 3);
  // glass
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y - 6);
  ctx.stroke();
}

function drawBubbles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  intensity: number, // 0..1
  color = "rgba(255,255,255,0.85)"
) {
  const n = Math.round(4 + intensity * 26);
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const px = x + 6 + hash(i) * (w - 12);
    const speed = 0.5 + hash(i + 50) * 0.9;
    const phase = (t * speed * (0.4 + intensity) + hash(i + 99) * 10) % 1;
    const py = y + h - 8 - phase * (h - 16);
    const r = 1.2 + hash(i + 7) * 2.2 * (1 - phase * 0.4);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGasCylinder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fraction: number,
  label: string
) {
  // measuring cylinder filling with gas (water displaced downward)
  ctx.fillStyle = "#dbeafe";
  ctx.fillRect(x, y, w, h);
  const gasH = h * Math.max(0, Math.min(1, fraction));
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(x, y, w, gasH);
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  // scale ticks
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const ty = y + (h / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, ty);
    ctx.lineTo(x + 7, ty);
    ctx.stroke();
  }
  ctx.fillStyle = "#334155";
  ctx.font = "bold 11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + h + 16);
}

function drawFlask(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bottomY: number,
  size: number,
  liquid: string
) {
  const neckW = size * 0.28;
  const bodyW = size;
  const bodyH = size * 0.62;
  ctx.fillStyle = liquid;
  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2, bottomY - bodyH - size * 0.42);
  ctx.lineTo(cx - neckW / 2, bottomY - bodyH);
  ctx.lineTo(cx - bodyW / 2, bottomY - 6);
  ctx.lineTo(cx + bodyW / 2, bottomY - 6);
  ctx.lineTo(cx + neckW / 2, bottomY - bodyH);
  ctx.lineTo(cx + neckW / 2, bottomY - bodyH - size * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

// ---------- experiment renderers ----------

function drawConcentration(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  o: DrawOpts
) {
  const bw = 190;
  const bh = 170;
  const bx = W / 2 - bw / 2;
  const by = H - bh - 26;
  const intensity = o.factor / 3;
  drawBeaker(
    ctx,
    bx,
    by,
    bw,
    bh,
    `rgba(96, 165, 250, ${0.18 + intensity * 0.4})`
  );
  // Mg strip shrinking with progress
  const stripH = 96 * (1 - o.progress);
  if (stripH > 1) {
    ctx.fillStyle = "#9ca3af";
    ctx.fillRect(W / 2 - 7, by + bh - 10 - stripH, 14, stripH);
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(W / 2 - 7, by + bh - 10 - stripH, 5, stripH);
  }
  if (o.progress < 1 && o.t > 0) {
    drawBubbles(ctx, bx, by, bw, bh, o.t, 0.2 + intensity * 0.8);
  }
  ctx.fillStyle = "#334155";
  ctx.font = "bold 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`HCl ${o.label}`, W / 2, by + bh + 18);
  ctx.fillText(
    o.progress >= 1 ? "Pita Mg habis bereaksi ✔" : "Pita Mg",
    W / 2,
    by - 14
  );
}

function drawSurface(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  o: DrawOpts
) {
  const groundY = H - 30;
  drawFlask(ctx, W * 0.32, groundY, 150, "rgba(147, 197, 253, 0.4)");
  // tube
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W * 0.32 + 22, groundY - 150);
  ctx.quadraticCurveTo(W * 0.55, groundY - 195, W * 0.72, groundY - 158);
  ctx.stroke();
  // solid pieces by surface factor
  const pieces = Math.max(1, Math.round(o.factor * o.factor * 0.9));
  const size = Math.max(3, 26 / Math.sqrt(pieces));
  ctx.fillStyle = "#d6d3d1";
  ctx.strokeStyle = "#a8a29e";
  ctx.lineWidth = 1;
  const cx = W * 0.32;
  const scale = 1 - o.progress * 0.75;
  for (let i = 0; i < pieces; i++) {
    const px = cx - 40 + hash(i) * 80;
    const py = groundY - 14 - hash(i + 31) * 16;
    const s = size * (0.7 + hash(i + 61) * 0.6) * scale;
    if (s < 1.2) continue;
    ctx.fillRect(px - s / 2, py - s / 2, s, s);
    ctx.strokeRect(px - s / 2, py - s / 2, s, s);
  }
  if (o.progress < 1 && o.t > 0) {
    drawBubbles(ctx, cx - 60, groundY - 120, 120, 105, o.t, Math.min(1, o.factor / 5));
  }
  // gas cylinder
  const frac = (o.volume ?? 0) / (o.vmax ?? 50);
  drawGasCylinder(ctx, W * 0.72 - 27, groundY - 158, 54, 128, frac, "Gas CO₂");
  ctx.fillStyle = "#334155";
  ctx.font = "bold 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`CaCO₃ ${o.label} + HCl`, W * 0.32, groundY + 18);
  ctx.fillText(`${(o.volume ?? 0).toFixed(1)} mL`, W * 0.72, groundY - 168);
}

function drawTemperature(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  o: DrawOpts
) {
  const bw = 180;
  const bh = 150;
  const bx = W / 2 - bw / 2;
  const by = H - bh - 46;
  // paper with X under the beaker
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;
  ctx.fillRect(bx - 22, by + bh - 4, bw + 44, 30);
  ctx.strokeRect(bx - 22, by + bh - 4, bw + 44, 30);
  // turbid liquid
  const turb = o.progress;
  drawBeaker(ctx, bx, by, bw, bh, `rgba(226, 232, 240, ${0.25 + turb * 0.05})`);
  ctx.fillStyle = `rgba(250, 250, 249, ${turb * 0.92})`;
  ctx.fillRect(bx + 3, by + bh * 0.22, bw - 6, bh * 0.78 - 3);
  // X mark seen through the solution
  ctx.strokeStyle = `rgba(15, 23, 42, ${Math.max(0, 1 - turb * 1.15)})`;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  const cxm = W / 2;
  const cym = by + bh * 0.62;
  ctx.beginPath();
  ctx.moveTo(cxm - 20, cym - 20);
  ctx.lineTo(cxm + 20, cym + 20);
  ctx.moveTo(cxm + 20, cym - 20);
  ctx.lineTo(cxm - 20, cym + 20);
  ctx.stroke();
  ctx.lineCap = "butt";
  // thermometer
  const th = 120;
  const tx = bx + bw + 46;
  const ty = by + 8;
  ctx.fillStyle = "#f1f5f9";
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.fillRect(tx - 7, ty, 14, th);
  ctx.strokeRect(tx - 7, ty, 14, th);
  const frac = (o.factor - 0) / 60;
  ctx.fillStyle = o.factor >= 40 ? "#ef4444" : o.factor >= 25 ? "#f97316" : "#3b82f6";
  ctx.fillRect(tx - 4, ty + th * (1 - frac), 8, th * frac);
  ctx.beginPath();
  ctx.arc(tx, ty + th + 8, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#334155";
  ctx.font = "bold 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(o.label, tx, ty + th + 34);
  ctx.fillText(
    o.progress >= 1 ? "Tanda X tidak terlihat ✔" : "Amati tanda X dari atas",
    W / 2,
    by - 12
  );
  ctx.fillText("Na₂S₂O₃ + HCl", W / 2, by + bh + 44);
}

function drawCatalyst(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  o: DrawOpts
) {
  const groundY = H - 30;
  drawFlask(ctx, W * 0.32, groundY, 150, "rgba(191, 219, 254, 0.5)");
  // catalyst specks
  if (o.factor > 1) {
    const color =
      o.label.indexOf("MnO₂") >= 0
        ? "#1f2937"
        : o.label.indexOf("FeCl₃") >= 0
          ? "#ea580c"
          : "#92400e";
    ctx.fillStyle = color;
    for (let i = 0; i < 16; i++) {
      const px = W * 0.32 - 38 + hash(i + 3) * 76;
      const py = groundY - 12 - hash(i + 17) * 14;
      ctx.beginPath();
      ctx.arc(px, py, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // foam layer grows with volume
  const frac = (o.volume ?? 0) / (o.vmax ?? 50);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  const foamH = 8 + frac * 44;
  ctx.fillRect(W * 0.32 - 52, groundY - 96 - foamH, 104, foamH);
  ctx.strokeStyle = "#e2e8f0";
  ctx.strokeRect(W * 0.32 - 52, groundY - 96 - foamH, 104, foamH);
  if (o.progress < 1 && o.t > 0) {
    drawBubbles(ctx, W * 0.32 - 55, groundY - 120, 110, 100, o.t, Math.min(1, o.factor / 6));
  }
  // tube + cylinder
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W * 0.32 + 22, groundY - 150);
  ctx.quadraticCurveTo(W * 0.55, groundY - 195, W * 0.72, groundY - 158);
  ctx.stroke();
  drawGasCylinder(ctx, W * 0.72 - 27, groundY - 158, 54, 128, frac, "Gas O₂");
  ctx.fillStyle = "#334155";
  ctx.font = "bold 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`H₂O₂ · ${o.label}`, W * 0.32, groundY + 18);
  ctx.fillText(`${(o.volume ?? 0).toFixed(1)} mL`, W * 0.72, groundY - 168);
}

export function drawExperiment(
  cfg: ExperimentConfig,
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  o: DrawOpts
) {
  ctx.clearRect(0, 0, W, H);
  // lab bench backdrop
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#f8fafc");
  grad.addColorStop(1, "#eff6ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(0, H - 26, W, 26);

  switch (cfg.kind) {
    case "concentration":
      drawConcentration(ctx, W, H, o);
      break;
    case "surface":
      drawSurface(ctx, W, H, o);
      break;
    case "temperature":
      drawTemperature(ctx, W, H, o);
      break;
    case "catalyst":
      drawCatalyst(ctx, W, H, o);
      break;
  }
}
