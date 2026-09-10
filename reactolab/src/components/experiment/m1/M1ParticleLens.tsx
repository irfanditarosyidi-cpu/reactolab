"use client";

// Module 1 submicroscopic model: Mg(s) + acid.
//
// Scientific conventions used by this view:
// - The canvas is a representative, equal-volume window, not a closed vessel.
// - H+(aq) is drawn as hydrated H3O+ so a bare proton is never implied.
// - Cl- is a spectator ion and MgCl2(aq) is never drawn as bonded molecules.
// - Mg oxidation and H2 formation occur only at the metal-solution interface.
// - A yellow event is the NET ionic summary of several surface/electron-transfer
//   steps. It is deliberately not animated as a literal three-body collision.
// - One H2 entity is a bonded diatomic molecule, not a gas bubble.
// - progress is the sole source of reaction extent. The local animation clock is
//   used only for Brownian/depth motion and encounter indicators.

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* -------------------------------------------------------------------------- */
/* Public types retained for compatibility                                    */
/* -------------------------------------------------------------------------- */

export type ParticleKind = "h" | "cl" | "h2" | "mg2";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  kind: ParticleKind;
  age?: number;
  dead?: boolean;
}

export interface MgAtom {
  x: number;
  y: number;
  r: number;
  row: number;
  opacity: number;
}

export interface Flash {
  x: number;
  y: number;
  ttl: number;
  effective: boolean;
  text?: string;
}

export interface M1ParticleLensProps {
  factor: number;
  maxFactor: number;
  diameter?: number;
  progress: number;
  label?: string;
  showHeader?: boolean;
  showLegend?: boolean;
  showFrequency?: boolean;
  className?: string;
  /** Whether playback is advancing. Paused playback freezes every moving mark. */
  running?: boolean;
  /** Visual playback multiplier. Reaction extent still comes only from progress. */
  playbackRate?: number;
}

/* -------------------------------------------------------------------------- */
/* Deterministic representative population                                    */
/* -------------------------------------------------------------------------- */

interface SeededSite {
  x: number;
  y: number;
  z: number;
  phase: number;
  speed: number;
  ampX: number;
  ampY: number;
  tilt: number;
}

interface LensGeometry {
  cx: number;
  cy: number;
  r: number;
  backY: number;
  frontY: number;
}

interface Point3D {
  x: number;
  y: number;
  scale: number;
  z: number;
}

interface SceneInput {
  factor: number;
  maxFactor: number;
  progress: number;
  running: boolean;
  playbackRate: number;
  reduceMotion: boolean;
}

const MAX_ION_ICONS = 30;
const WATER_ICON_COUNT = 30;
const MG_ROWS = 4;
const MG_COLUMNS = 8;
const MG_ATOM_COUNT = MG_ROWS * MG_COLUMNS;
const MAX_REPRESENTATIVE_PRODUCT_ICONS = 2;
const TAU = Math.PI * 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let n = state;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSites(count: number, seed: number): SeededSite[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    x: 0.08 + random() * 0.84,
    y: 0.05 + random() * 0.88,
    z: 0.04 + random() * 0.92,
    phase: random() * TAU,
    speed: 0.52 + random() * 0.56,
    ampX: 0.012 + random() * 0.022,
    ampY: 0.01 + random() * 0.02,
    tilt: (random() - 0.5) * 0.9,
  }));
}

function shuffledIndices(count: number, seed: number): number[] {
  const random = mulberry32(seed);
  const indices = Array.from({ length: count }, (_, index) => index);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

// All concentrations take a prefix of the same arrays. Consequently a lower
// concentration is a true nested subset of a higher one in an equal volume.
const HYDRONIUM_SITES = makeSites(MAX_ION_ICONS, 0x48a31f2d);
const CHLORIDE_SITES = makeSites(MAX_ION_ICONS, 0x7c21b6e9);
const WATER_SITES = makeSites(WATER_ICON_COUNT, 0x19ef08c7);
const PRODUCT_SITES = makeSites(MG_ATOM_COUNT, 0xa247ce13);

// The surface is sampled in a deterministic, spatially distributed order.
// Every represented atom is on the exposed face; progress=1 removes all of it.
const MG_REMOVAL_ORDER = shuffledIndices(MG_ATOM_COUNT, 0x5fd319a1);

function ionIconCount(factor: number, maxFactor: number) {
  const relative = clamp(factor / Math.max(0.0001, maxFactor), 0, 1);
  return clamp(Math.round(MAX_ION_ICONS * relative), 1, MAX_ION_ICONS);
}

function reactionState(progress: number) {
  const extent = clamp(progress, 0, 1);
  const scaled = extent * MG_ATOM_COUNT;
  const reacted = extent >= 1 ? MG_ATOM_COUNT : Math.floor(scaled + 1e-8);
  const eventPhase = extent >= 1 ? 1 : scaled - Math.floor(scaled);
  return {
    extent,
    reacted,
    remaining: MG_ATOM_COUNT - reacted,
    eventPhase,
  };
}

interface RepresentativeAccounting {
  baselineAcid: number;
  hydronium: number;
  chloride: number;
  magnesiumIon: number;
  hydrogen: number;
}

/**
 * Charge-balanced representative bookkeeping for the aqueous window.
 *
 * The 32 Mg lattice marks sample surface erosion and deliberately do not share
 * the same counting scale as the solution icons. At most two solution-product
 * icons are introduced. For every Mg2+ icon, exactly two H3O+ icons disappear,
 * Cl- stays present, and exactly one H2 molecule appears:
 *
 *   positive charge = remaining H3O+ + 2(Mg2+) = initial Cl- charge.
 */
function representativeAccounting(
  baselineAcid: number,
  reactedSurfaceUnits: number,
): RepresentativeAccounting {
  const maxProducts = Math.min(
    MAX_REPRESENTATIVE_PRODUCT_ICONS,
    Math.max(0, Math.floor((baselineAcid - 1) / 2)),
  );
  const productCount =
    reactedSurfaceUnits <= 0 || maxProducts <= 0
      ? 0
      : Math.min(
          maxProducts,
          Math.ceil((reactedSurfaceUnits / MG_ATOM_COUNT) * maxProducts),
        );

  return {
    baselineAcid,
    hydronium: baselineAcid - productCount * 2,
    chloride: baselineAcid,
    magnesiumIon: productCount,
    hydrogen: productCount,
  };
}

/* -------------------------------------------------------------------------- */
/* Canvas geometry and drawing primitives                                     */
/* -------------------------------------------------------------------------- */

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function geometryFor(width: number, height: number): LensGeometry {
  const r = Math.min(width, height) * 0.465;
  return {
    cx: width / 2,
    cy: height / 2,
    r,
    backY: height / 2 + r * 0.08,
    frontY: height / 2 + r * 0.43,
  };
}

function solutionPoint(
  site: SeededSite,
  geometry: LensGeometry,
  clock: number,
  useStoredClock: boolean,
): Point3D {
  // Pausing stops clock advancement; it must not replace the accumulated phase
  // with zero, otherwise every particle visibly jumps on the pause frame.
  const motion = useStoredClock ? clock : 0;
  const waveX = Math.sin(motion * site.speed * 1.17 + site.phase) * site.ampX;
  const waveY =
    Math.cos(motion * site.speed * 0.91 + site.phase * 1.31) * site.ampY;
  const normalizedX = clamp(site.x + waveX, 0.025, 0.975);
  const normalizedY = clamp(site.y + waveY, 0.02, 0.985);

  // z=0 is the back of the volume and z=1 is nearest the viewer. The bottom
  // follows the oblique Mg plane so particles remain in the aqueous region.
  const halfWidth = geometry.r * (0.62 + site.z * 0.17);
  const topY = geometry.cy - geometry.r * (0.8 - site.z * 0.035);
  const bottomY =
    geometry.backY + site.z * (geometry.frontY - geometry.backY) - geometry.r * 0.055;

  return {
    x:
      geometry.cx +
      (normalizedX - 0.5) * halfWidth * 2 +
      (site.z - 0.5) * geometry.r * 0.025,
    y: topY + normalizedY * (bottomY - topY),
    scale: 0.69 + site.z * 0.39,
    z: site.z,
  };
}

function mgAtomPoint(index: number, geometry: LensGeometry): Point3D {
  const row = Math.floor(index / MG_COLUMNS);
  const column = index % MG_COLUMNS;
  const z = row / Math.max(1, MG_ROWS - 1);
  const halfWidth = geometry.r * (0.59 + z * 0.16);
  const step = (halfWidth * 2) / (MG_COLUMNS - 0.2);
  const stagger = row % 2 === 0 ? 0 : step * 0.42;
  const x =
    geometry.cx -
    halfWidth +
    step * 0.36 +
    column * step +
    stagger -
    (row % 2 === 0 ? 0 : step * 0.19);
  const y =
    geometry.backY +
    z * (geometry.frontY - geometry.backY) +
    (column % 2 === 0 ? -1 : 1) * geometry.r * 0.006;

  return {
    x,
    y,
    scale: 0.74 + z * 0.32,
    z,
  };
}

function drawLensBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  geometry: LensGeometry,
) {
  const { cx, cy, r } = geometry;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.clip();

  const water = ctx.createRadialGradient(
    cx - r * 0.35,
    cy - r * 0.42,
    r * 0.05,
    cx,
    cy,
    r * 1.12,
  );
  water.addColorStop(0, "#fbfdff");
  water.addColorStop(0.42, "#eaf7fb");
  water.addColorStop(0.78, "#d9eef6");
  water.addColorStop(1, "#c4dde8");
  ctx.fillStyle = water;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Subtle volume contours communicate depth without looking like a container.
  ctx.strokeStyle = "rgba(14, 116, 144, 0.075)";
  ctx.lineWidth = Math.max(0.7, r * 0.006);
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy - r * 0.45 + i * r * 0.19,
      r * (0.48 + i * 0.065),
      r * 0.075,
      0,
      0,
      TAU,
    );
    ctx.stroke();
  }

  const light = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  light.addColorStop(0, "rgba(255,255,255,0.42)");
  light.addColorStop(0.48, "rgba(255,255,255,0.03)");
  light.addColorStop(1, "rgba(15,23,42,0.11)");
  ctx.fillStyle = light;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  ctx.restore();

  const rim = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  rim.addColorStop(0, "#a5f3fc");
  rim.addColorStop(0.26, "#4f46e5");
  rim.addColorStop(0.72, "#312e81");
  rim.addColorStop(1, "#818cf8");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(3, r * 0.034);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r - Math.max(3, r * 0.035), Math.PI * 1.08, Math.PI * 1.6);
  ctx.strokeStyle = "rgba(255,255,255,0.74)";
  ctx.lineWidth = Math.max(1, r * 0.012);
  ctx.stroke();

  // Silence unused-variable lint should a canvas implementation not inspect it.
  void width;
  void height;
}

function drawMetalPlane(
  ctx: CanvasRenderingContext2D,
  geometry: LensGeometry,
  extent: number,
  removed: Set<number>,
) {
  if (extent >= 1) return;

  const { cx, cy, r, backY, frontY } = geometry;
  const leftBack = cx - r * 0.64;
  const rightBack = cx + r * 0.64;
  const leftFront = cx - r * 0.82;
  const rightFront = cx + r * 0.82;
  const frontBottom = Math.min(cy + r * 0.82, frontY + r * 0.28);

  ctx.save();
  ctx.globalAlpha = clamp(1 - extent * 0.84, 0.12, 1);

  const face = ctx.createLinearGradient(0, frontY, 0, frontBottom);
  face.addColorStop(0, "#8a98aa");
  face.addColorStop(0.5, "#667386");
  face.addColorStop(1, "#3d4859");
  ctx.beginPath();
  ctx.moveTo(leftFront, frontY);
  ctx.lineTo(rightFront, frontY);
  ctx.lineTo(rightFront - r * 0.08, frontBottom);
  ctx.lineTo(leftFront + r * 0.08, frontBottom);
  ctx.closePath();
  ctx.fillStyle = face;
  ctx.fill();

  const top = ctx.createLinearGradient(0, backY, 0, frontY);
  top.addColorStop(0, "#e5ebf2");
  top.addColorStop(0.45, "#aeb9c7");
  top.addColorStop(1, "#7d899a");
  ctx.beginPath();
  ctx.moveTo(leftBack, backY);
  ctx.lineTo(rightBack, backY);
  ctx.lineTo(rightFront, frontY);
  ctx.lineTo(leftFront, frontY);
  ctx.closePath();
  ctx.fillStyle = top;
  ctx.fill();
  ctx.strokeStyle = "rgba(51,65,85,0.58)";
  ctx.lineWidth = Math.max(0.8, r * 0.008);
  ctx.stroke();

  // Removed surface units leave subtle pits instead of making the ribbon shrink
  // from one end like a burning fuse.
  for (const index of Array.from(removed)) {
    const point = mgAtomPoint(index, geometry);
    const atomRadius = r * 0.041 * point.scale;
    ctx.beginPath();
    ctx.ellipse(
      point.x,
      point.y + atomRadius * 0.15,
      atomRadius * 0.8,
      atomRadius * 0.43,
      0,
      0,
      TAU,
    );
    ctx.fillStyle = "rgba(51,65,85,0.28)";
    ctx.fill();
  }

  ctx.restore();
}

function drawMgAtom(
  ctx: CanvasRenderingContext2D,
  point: Point3D,
  radius: number,
  showLabel: boolean,
) {
  const r = radius * point.scale;
  const gradient = ctx.createRadialGradient(
    point.x - r * 0.36,
    point.y - r * 0.42,
    r * 0.08,
    point.x,
    point.y,
    r,
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.25, "#e5e7eb");
  gradient.addColorStop(0.67, "#9ca3af");
  gradient.addColorStop(1, "#4b5563");

  ctx.beginPath();
  ctx.arc(point.x, point.y, r, 0, TAU);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(51,65,85,0.58)";
  ctx.lineWidth = Math.max(0.55, r * 0.09);
  ctx.stroke();

  if (showLabel && r >= 5) {
    ctx.fillStyle = "rgba(30,41,59,0.88)";
    ctx.font = `700 ${Math.max(5.5, r * 0.82)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Mg", point.x, point.y + r * 0.08);
  }
}

function drawWaterMolecule(
  ctx: CanvasRenderingContext2D,
  point: Point3D,
  baseRadius: number,
  tilt: number,
) {
  const r = baseRadius * point.scale;
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(tilt);
  ctx.globalAlpha = 0.18 + point.z * 0.09;

  ctx.strokeStyle = "#7dd3fc";
  ctx.lineWidth = Math.max(0.55, r * 0.26);
  ctx.beginPath();
  ctx.moveTo(-r * 0.15, 0);
  ctx.lineTo(-r * 0.8, -r * 0.62);
  ctx.moveTo(r * 0.15, 0);
  ctx.lineTo(r * 0.8, -r * 0.62);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.54, 0, TAU);
  ctx.fillStyle = "#38bdf8";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-r * 0.84, -r * 0.64, r * 0.3, 0, TAU);
  ctx.arc(r * 0.84, -r * 0.64, r * 0.3, 0, TAU);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.restore();
}

function drawHydronium(
  ctx: CanvasRenderingContext2D,
  point: Point3D,
  baseRadius: number,
  tilt: number,
) {
  const r = baseRadius * point.scale;
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(tilt);

  // Hydration shell: a soft halo plus a dashed outer orbit.
  const shell = ctx.createRadialGradient(0, 0, r * 0.32, 0, 0, r * 1.55);
  shell.addColorStop(0, "rgba(239,68,68,0.1)");
  shell.addColorStop(0.55, "rgba(125,211,252,0.12)");
  shell.addColorStop(1, "rgba(125,211,252,0)");
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.58, 0, TAU);
  ctx.fillStyle = shell;
  ctx.fill();

  ctx.setLineDash([Math.max(1.2, r * 0.25), Math.max(1.1, r * 0.2)]);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.32, r * 1.02, 0, 0, TAU);
  ctx.strokeStyle = "rgba(14,165,233,0.42)";
  ctx.lineWidth = Math.max(0.55, r * 0.09);
  ctx.stroke();
  ctx.setLineDash([]);

  const oxygen = ctx.createRadialGradient(-r * 0.28, -r * 0.32, r * 0.08, 0, 0, r);
  oxygen.addColorStop(0, "#fecaca");
  oxygen.addColorStop(0.42, "#ef4444");
  oxygen.addColorStop(1, "#991b1b");
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, TAU);
  ctx.fillStyle = oxygen;
  ctx.fill();

  const hydrogenPositions = [
    { x: -r * 0.74, y: -r * 0.48 },
    { x: r * 0.75, y: -r * 0.45 },
    { x: 0, y: r * 0.79 },
  ];
  for (const hydrogen of hydrogenPositions) {
    ctx.beginPath();
    ctx.arc(hydrogen.x, hydrogen.y, r * 0.29, 0, TAU);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "rgba(148,163,184,0.7)";
    ctx.lineWidth = Math.max(0.45, r * 0.055);
    ctx.stroke();
  }

  ctx.rotate(-tilt);
  ctx.beginPath();
  ctx.arc(r * 1.05, -r * 0.92, r * 0.43, 0, TAU);
  ctx.fillStyle = "#be123c";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.max(5, r * 0.66)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+", r * 1.05, -r * 0.9);
  ctx.restore();
}

function drawChloride(
  ctx: CanvasRenderingContext2D,
  point: Point3D,
  baseRadius: number,
) {
  const r = baseRadius * point.scale;
  const gradient = ctx.createRadialGradient(
    point.x - r * 0.35,
    point.y - r * 0.38,
    r * 0.08,
    point.x,
    point.y,
    r,
  );
  gradient.addColorStop(0, "#cffafe");
  gradient.addColorStop(0.38, "#22d3ee");
  gradient.addColorStop(1, "#0e7490");
  ctx.beginPath();
  ctx.arc(point.x, point.y, r, 0, TAU);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(14,116,144,0.72)";
  ctx.lineWidth = Math.max(0.55, r * 0.08);
  ctx.stroke();
  ctx.fillStyle = "#083344";
  ctx.font = `800 ${Math.max(5.5, r * 0.92)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("−", point.x, point.y - r * 0.04);
}

function drawMagnesiumIon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;

  const shell = ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius * 1.55);
  shell.addColorStop(0, "rgba(196,181,253,0.12)");
  shell.addColorStop(0.62, "rgba(167,139,250,0.15)");
  shell.addColorStop(1, "rgba(167,139,250,0)");
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.55, 0, TAU);
  ctx.fillStyle = shell;
  ctx.fill();

  ctx.setLineDash([Math.max(1.2, radius * 0.22), Math.max(1, radius * 0.18)]);
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.28, 0, TAU);
  ctx.strokeStyle = "rgba(109,40,217,0.4)";
  ctx.lineWidth = Math.max(0.55, radius * 0.08);
  ctx.stroke();
  ctx.setLineDash([]);

  const gradient = ctx.createRadialGradient(
    x - radius * 0.33,
    y - radius * 0.37,
    radius * 0.08,
    x,
    y,
    radius,
  );
  gradient.addColorStop(0, "#ede9fe");
  gradient.addColorStop(0.42, "#8b5cf6");
  gradient.addColorStop(1, "#5b21b6");
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = "#5b21b6";
  ctx.lineWidth = Math.max(0.55, radius * 0.08);
  ctx.stroke();

  if (radius >= 5.2) {
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.max(5.2, radius * 0.7)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Mg²⁺", x, y + radius * 0.04);
  }
  ctx.restore();
}

function drawHydrogenMolecule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  angle: number,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.strokeStyle = "rgba(3,105,161,0.72)";
  ctx.lineWidth = Math.max(1.5, radius * 0.45);
  ctx.beginPath();
  ctx.moveTo(-radius * 0.68, 0);
  ctx.lineTo(radius * 0.68, 0);
  ctx.stroke();

  for (const direction of [-1, 1]) {
    const atomX = direction * radius * 0.72;
    const gradient = ctx.createRadialGradient(
      atomX - radius * 0.2,
      -radius * 0.25,
      radius * 0.06,
      atomX,
      0,
      radius * 0.62,
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.48, "#e0f2fe");
    gradient.addColorStop(1, "#7dd3fc");
    ctx.beginPath();
    ctx.arc(atomX, 0, radius * 0.62, 0, TAU);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(2,132,199,0.7)";
    ctx.lineWidth = Math.max(0.5, radius * 0.09);
    ctx.stroke();
  }

  ctx.rotate(-angle);
  if (radius >= 4.5) {
    ctx.fillStyle = "#075985";
    ctx.font = `800 ${Math.max(5.5, radius * 0.78)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("H₂", 0, -radius * 0.82);
  }
  ctx.restore();
}

function drawEventPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  fill: string,
  stroke: string,
  color: string,
  fontSize: number,
) {
  ctx.save();
  ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
  const width = ctx.measureText(text).width + fontSize * 1.45;
  const height = fontSize * 1.75;
  roundedRectPath(ctx, x - width / 2, y - height / 2, width, height, height / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(0.7, fontSize * 0.08);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + fontSize * 0.04);
  ctx.restore();
}

function drawEffectiveEvent(
  ctx: CanvasRenderingContext2D,
  geometry: LensGeometry,
  site: Point3D,
  eventPhase: number,
  compact: boolean,
) {
  const alpha = clamp(1 - eventPhase / 0.74, 0, 1);
  if (alpha <= 0.015) return;

  const pulse = geometry.r * (0.055 + eventPhase * 0.085);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(site.x, site.y, pulse, 0, TAU);
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = Math.max(1.4, geometry.r * 0.014);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(site.x, site.y, pulse * 0.46, 0, TAU);
  ctx.fillStyle = "rgba(253,230,138,0.8)";
  ctx.fill();

  // Two paths indicate the 2:1 net stoichiometry only; the nearby label makes
  // explicit that this is not a literal simultaneous three-particle collision.
  ctx.setLineDash([geometry.r * 0.022, geometry.r * 0.018]);
  ctx.strokeStyle = "rgba(217,119,6,0.8)";
  ctx.lineWidth = Math.max(0.8, geometry.r * 0.008);
  for (const direction of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(site.x + direction * geometry.r * 0.16, site.y - geometry.r * 0.2);
    ctx.quadraticCurveTo(
      site.x + direction * geometry.r * 0.1,
      site.y - geometry.r * 0.08,
      site.x,
      site.y - geometry.r * 0.015,
    );
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  drawEventPill(
    ctx,
    clamp(site.x, geometry.cx - geometry.r * 0.5, geometry.cx + geometry.r * 0.5),
    site.y - geometry.r * 0.15,
    compact ? "NETTO" : "NETTO • ringkasan tahap permukaan",
    `rgba(255,251,235,${0.9 * alpha})`,
    `rgba(245,158,11,${0.88 * alpha})`,
    `rgba(146,64,14,${alpha})`,
    Math.max(6.2, geometry.r * (compact ? 0.052 : 0.047)),
  );
}

function drawIneffectiveEncounter(
  ctx: CanvasRenderingContext2D,
  geometry: LensGeometry,
  clock: number,
  remainingIndices: number[],
  compact: boolean,
  reduceMotion: boolean,
) {
  if (remainingIndices.length === 0) return;
  const cycle = reduceMotion ? 0.58 : (clock * 0.62) % 1;
  const cycleIndex = Math.floor(reduceMotion ? 0 : clock * 0.62);
  const atomIndex = remainingIndices[cycleIndex % remainingIndices.length];
  const site = mgAtomPoint(atomIndex, geometry);
  const alpha = clamp(1 - Math.abs(cycle - 0.62) / 0.34, 0, 0.72);
  if (alpha <= 0.015) return;

  const approachX = site.x + geometry.r * 0.12;
  const approachY = site.y - geometry.r * (0.2 - cycle * 0.12);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.setLineDash([geometry.r * 0.018, geometry.r * 0.015]);
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = Math.max(0.75, geometry.r * 0.007);
  ctx.beginPath();
  ctx.moveTo(approachX, approachY);
  ctx.quadraticCurveTo(site.x + geometry.r * 0.05, site.y - geometry.r * 0.04, site.x, site.y);
  ctx.quadraticCurveTo(
    site.x - geometry.r * 0.02,
    site.y - geometry.r * 0.07,
    site.x - geometry.r * 0.11,
    site.y - geometry.r * 0.12,
  );
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(site.x, site.y, geometry.r * 0.035, 0, TAU);
  ctx.strokeStyle = "rgba(100,116,139,0.78)";
  ctx.stroke();
  ctx.restore();

  if (!compact && alpha > 0.28) {
    drawEventPill(
      ctx,
      clamp(site.x - geometry.r * 0.17, geometry.cx - geometry.r * 0.5, geometry.cx + geometry.r * 0.5),
      site.y - geometry.r * 0.19,
      "tidak efektif",
      `rgba(248,250,252,${0.88 * alpha})`,
      `rgba(148,163,184,${0.82 * alpha})`,
      `rgba(71,85,105,${alpha})`,
      Math.max(6, geometry.r * 0.043),
    );
  }
}

function drawProducts(
  ctx: CanvasRenderingContext2D,
  geometry: LensGeometry,
  productCount: number,
  extent: number,
  clock: number,
  useStoredClock: boolean,
) {
  if (productCount <= 0) return;

  // Product icons use a small, charge-balanced representative scale. Their
  // count is intentionally independent from the 32-unit surface lattice.
  for (let productIndex = 0; productIndex < productCount; productIndex++) {
    const site = PRODUCT_SITES[productIndex];
    const appearanceExtent = productIndex === 0 ? 1 / MG_ATOM_COUNT : 17 / MG_ATOM_COUNT;
    const age = clamp(
      (extent - appearanceExtent) / Math.max(0.0001, 1 - appearanceExtent),
      0,
      1,
    );
    const originIndex = productIndex === 0 ? 0 : 16;
    const origin = mgAtomPoint(MG_REMOVAL_ORDER[originIndex], geometry);
    const wiggle = useStoredClock
      ? Math.sin(clock * 0.72 + site.phase)
      : 0;
    const lateral = (site.x - 0.5) * geometry.r * 0.42;
    const x = origin.x * 0.42 + (geometry.cx + lateral) * 0.58 + wiggle * geometry.r * 0.018;
    const y =
      origin.y -
      geometry.r * (0.12 + age * 0.44) +
      (useStoredClock
        ? Math.cos(clock * 0.55 + site.phase) * geometry.r * 0.012
        : 0);
    drawMagnesiumIon(
      ctx,
      x,
      y,
      geometry.r * (0.047 + site.z * 0.007),
    );

    const hydrogenSite = PRODUCT_SITES[productIndex + 9];
    const hydrogenX =
      origin.x +
      (hydrogenSite.x - 0.5) * geometry.r * 0.25 +
      (useStoredClock
        ? Math.sin(clock * 0.9 + hydrogenSite.phase) * geometry.r * 0.023
        : 0);
    const hydrogenY =
      origin.y -
      geometry.r * (0.18 + age * 0.58) +
      (useStoredClock
        ? Math.cos(clock * 0.74 + hydrogenSite.phase) * geometry.r * 0.014
        : 0);
    drawHydrogenMolecule(
      ctx,
      hydrogenX,
      hydrogenY,
      geometry.r * 0.04,
      hydrogenSite.tilt +
        (useStoredClock
          ? Math.sin(clock * 0.4 + hydrogenSite.phase) * 0.15
          : 0),
    );
  }
}

function drawDepthEntities(
  ctx: CanvasRenderingContext2D,
  geometry: LensGeometry,
  hydroniumCount: number,
  chlorideCount: number,
  clock: number,
  useStoredClock: boolean,
) {
  const entities: Array<{
    kind: "water" | "hydronium" | "chloride";
    site: SeededSite;
    point: Point3D;
  }> = [];

  for (const site of WATER_SITES) {
    entities.push({
      kind: "water",
      site,
      point: solutionPoint(site, geometry, clock, useStoredClock),
    });
  }
  for (let index = 0; index < hydroniumCount; index++) {
    const hydronium = HYDRONIUM_SITES[index];
    entities.push({
      kind: "hydronium",
      site: hydronium,
      point: solutionPoint(hydronium, geometry, clock, useStoredClock),
    });
  }
  for (let index = 0; index < chlorideCount; index++) {
    const chloride = CHLORIDE_SITES[index];
    entities.push({
      kind: "chloride",
      site: chloride,
      point: solutionPoint(chloride, geometry, clock, useStoredClock),
    });
  }

  entities.sort((a, b) => a.point.z - b.point.z);

  for (const entity of entities) {
    if (entity.kind === "water") {
      drawWaterMolecule(
        ctx,
        entity.point,
        geometry.r * 0.026,
        entity.site.tilt,
      );
    } else if (entity.kind === "hydronium") {
      drawHydronium(
        ctx,
        entity.point,
        geometry.r * 0.042,
        entity.site.tilt,
      );
    } else {
      drawChloride(ctx, entity.point, geometry.r * 0.042);
    }
  }
}

function drawSurfaceLabel(
  ctx: CanvasRenderingContext2D,
  geometry: LensGeometry,
  remaining: number,
) {
  const text = remaining > 0 ? "permukaan Mg(s)" : "Mg(s) telah teroksidasi";
  const y =
    remaining > 0
      ? Math.min(geometry.cy + geometry.r * 0.76, geometry.frontY + geometry.r * 0.27)
      : geometry.cy + geometry.r * 0.57;
  drawEventPill(
    ctx,
    geometry.cx,
    y,
    text,
    remaining > 0 ? "rgba(248,250,252,0.88)" : "rgba(236,253,245,0.92)",
    remaining > 0 ? "rgba(100,116,139,0.5)" : "rgba(16,185,129,0.62)",
    remaining > 0 ? "#475569" : "#047857",
    Math.max(6.5, geometry.r * 0.047),
  );
}

function renderScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  input: SceneInput,
  clock: number,
) {
  ctx.clearRect(0, 0, width, height);
  const geometry = geometryFor(width, height);
  const chemistry = reactionState(input.progress);
  const baselineAcid = ionIconCount(input.factor, input.maxFactor);
  const accounting = representativeAccounting(baselineAcid, chemistry.reacted);
  // The accumulated phase is always used when motion is allowed. `running`
  // controls only whether the clock advances in the component's RAF effect.
  const useStoredClock = !input.reduceMotion;
  const hasStarted = input.running || chemistry.extent > 0;
  const compact = geometry.r < 125;

  drawLensBackground(ctx, width, height, geometry);

  ctx.save();
  ctx.beginPath();
  ctx.arc(geometry.cx, geometry.cy, geometry.r * 0.976, 0, TAU);
  ctx.clip();

  const removedIndices = new Set(
    MG_REMOVAL_ORDER.slice(0, chemistry.reacted),
  );
  const remainingIndices = MG_REMOVAL_ORDER.slice(chemistry.reacted);

  drawMetalPlane(ctx, geometry, chemistry.extent, removedIndices);
  drawDepthEntities(
    ctx,
    geometry,
    accounting.hydronium,
    accounting.chloride,
    clock,
    useStoredClock,
  );

  // Draw the remaining metallic lattice from back to front.
  for (let row = 0; row < MG_ROWS; row++) {
    for (let column = 0; column < MG_COLUMNS; column++) {
      const index = row * MG_COLUMNS + column;
      if (removedIndices.has(index)) continue;
      drawMgAtom(
        ctx,
        mgAtomPoint(index, geometry),
        geometry.r * 0.043,
        index % 7 === 0,
      );
    }
  }

  drawProducts(
    ctx,
    geometry,
    accounting.magnesiumIon,
    chemistry.extent,
    clock,
    useStoredClock,
  );

  // Ineffective encounters do not alter any species. They are an animation-only
  // indicator and therefore share the same frozen/scaled local motion clock.
  if (hasStarted && chemistry.remaining > 0) {
    drawIneffectiveEncounter(
      ctx,
      geometry,
      clock,
      remainingIndices,
      compact,
      input.reduceMotion,
    );
  }

  if (hasStarted && chemistry.reacted > 0 && chemistry.extent < 1) {
    const latestAtom = MG_REMOVAL_ORDER[chemistry.reacted - 1];
    drawEffectiveEvent(
      ctx,
      geometry,
      mgAtomPoint(latestAtom, geometry),
      chemistry.eventPhase,
      compact,
    );
  }

  drawSurfaceLabel(ctx, geometry, chemistry.remaining);
  ctx.restore();

  // Gentle glass reflection remains outside the clipped chemistry layers.
  ctx.save();
  ctx.beginPath();
  ctx.arc(geometry.cx, geometry.cy, geometry.r * 0.94, 0, TAU);
  ctx.clip();
  const sheen = ctx.createLinearGradient(
    geometry.cx - geometry.r,
    geometry.cy - geometry.r,
    geometry.cx + geometry.r,
    geometry.cy + geometry.r,
  );
  sheen.addColorStop(0, "rgba(255,255,255,0.34)");
  sheen.addColorStop(0.28, "rgba(255,255,255,0.04)");
  sheen.addColorStop(0.7, "rgba(255,255,255,0)");
  sheen.addColorStop(1, "rgba(255,255,255,0.11)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* DOM legend                                                                 */
/* -------------------------------------------------------------------------- */

function LegendDot({
  type,
}: {
  type: "hydronium" | "chloride" | "mg" | "mg2" | "h2" | "effective" | "ineffective";
}) {
  if (type === "h2") {
    return (
      <span className="relative inline-flex h-4 w-7 shrink-0 items-center justify-center" aria-hidden="true">
        <span className="absolute left-1 h-2.5 w-2.5 rounded-full border border-sky-500 bg-sky-100" />
        <span className="h-[2px] w-3 bg-sky-600" />
        <span className="absolute right-1 h-2.5 w-2.5 rounded-full border border-sky-500 bg-sky-100" />
      </span>
    );
  }

  if (type === "effective" || type === "ineffective") {
    return (
      <span
        className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
          type === "effective"
            ? "border-amber-500 bg-amber-100"
            : "border-dashed border-slate-400 bg-slate-100"
        }`}
        aria-hidden="true"
      />
    );
  }

  const styles = {
    hydronium: "border-rose-500 bg-rose-500 ring-2 ring-sky-200",
    chloride: "border-cyan-700 bg-cyan-400",
    mg: "border-slate-600 bg-slate-300",
    mg2: "border-violet-700 bg-violet-500 ring-2 ring-violet-200",
  } as const;

  return (
    <span
      className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full border ${styles[type]}`}
      aria-hidden="true"
    />
  );
}

function LegendItem({
  type,
  children,
}: {
  type: Parameters<typeof LegendDot>[0]["type"];
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 leading-tight">
      <LegendDot type={type} />
      <span>{children}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default memo(function M1ParticleLens({
  factor,
  maxFactor,
  diameter = 320,
  progress,
  label,
  showHeader = true,
  showLegend = true,
  showFrequency = true,
  className,
  running = false,
  playbackRate = 1,
}: M1ParticleLensProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef({ width: Math.max(1, diameter), height: Math.max(1, diameter), dpr: 1 });
  const clockRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const previousRef = useRef({ factor, progress });
  const [reduceMotion, setReduceMotion] = useState(false);

  const sceneRef = useRef<SceneInput>({
    factor,
    maxFactor,
    progress,
    running,
    playbackRate,
    reduceMotion,
  });
  sceneRef.current = {
    factor,
    maxFactor,
    progress,
    running,
    playbackRate,
    reduceMotion,
  };

  const chemistry = reactionState(progress);
  const visibleIonCount = ionIconCount(factor, maxFactor);
  const accounting = representativeAccounting(
    visibleIonCount,
    chemistry.reacted,
  );
  const relativeConcentration = clamp(factor / Math.max(0.0001, maxFactor), 0, 1);
  const frequencyLevel =
    chemistry.remaining === 0
      ? 0
      : clamp(Math.round(relativeConcentration * 5), 1, 5);

  const ariaSummary = useMemo(() => {
    const condition = label ? ` pada konsentrasi HCl ${label}` : "";
    return [
      `Model submikroskopik tiga dimensi semu${condition}.`,
      `Cuplikan memakai volume yang sama dan menampilkan ${accounting.hydronium} ikon hidronium, ${accounting.chloride} ikon klorida, ${accounting.magnesiumIon} ikon magnesium dua plus, serta ${accounting.hydrogen} molekul hidrogen sebagai populasi representatif yang setara muatan.`,
      `${chemistry.remaining} dari ${MG_ATOM_COUNT} unit model magnesium masih berupa Mg padat; ${chemistry.reacted} unit telah teroksidasi.`,
      "Reaksi netto terjadi hanya di permukaan magnesium; klorida tetap sebagai ion pendamping dan hidrogen digambar sebagai molekul diatomik.",
      "Ukuran, warna, jarak, dan jumlah ikon bukan skala nyata.",
    ].join(" ");
  }, [
    accounting.chloride,
    accounting.hydrogen,
    accounting.hydronium,
    accounting.magnesiumIon,
    chemistry.reacted,
    chemistry.remaining,
    label,
  ]);

  const renderNow = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const { width, height, dpr } = sizeRef.current;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderScene(context, width, height, sceneRef.current, clockRef.current);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, rect.width || diameter);
      const height = Math.max(1, rect.height || width);
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2.5);
      const backingWidth = Math.max(1, Math.round(width * dpr));
      const backingHeight = Math.max(1, Math.round(height * dpr));

      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
      sizeRef.current = { width, height, dpr };
      renderNow();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    return () => observer.disconnect();
  }, [diameter, renderNow]);

  // Reset only the visual motion phase when starting a new condition/trial. The
  // chemical state itself is always reconstructed directly from progress.
  useEffect(() => {
    const previous = previousRef.current;
    if (previous.factor !== factor || progress < previous.progress - 1e-7) {
      clockRef.current = 0;
    }
    previousRef.current = { factor, progress };
    renderNow();
  }, [factor, maxFactor, playbackRate, progress, reduceMotion, renderNow, running]);

  useEffect(() => {
    if (!running || reduceMotion) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      renderNow();
      return;
    }

    let previousTime = performance.now();
    const animate = (now: number) => {
      const delta = Math.min(0.05, Math.max(0, (now - previousTime) / 1000));
      previousTime = now;
      clockRef.current += delta * clamp(sceneRef.current.playbackRate, 0.1, 12);
      renderNow();
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [reduceMotion, renderNow, running]);

  return (
    <div className={`flex min-w-0 flex-col items-center gap-2.5 ${className ?? ""}`}>
      {showHeader && (
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
            Tampilan Submikroskopik
          </p>
          {label && (
            <p className="mt-0.5 text-xs font-semibold text-brand-700">
              Konsentrasi HCl: {label}
            </p>
          )}
        </div>
      )}

      <div
        ref={hostRef}
        className="relative aspect-square w-full shrink-0 overflow-hidden rounded-full bg-sky-50 shadow-[0_14px_42px_rgba(15,23,42,0.14)]"
        style={{ maxWidth: `${Math.max(1, diameter)}px` }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={ariaSummary}
          className="block h-full w-full"
        >
          {ariaSummary}
        </canvas>

        <div
          className="pointer-events-none absolute left-[12%] top-[8%] rounded-full border border-white/70 bg-white/75 px-2 py-1 text-[9px] font-bold tracking-wide text-slate-600 shadow-sm backdrop-blur-sm"
          aria-hidden="true"
        >
          VOLUME CUPLIKAN SAMA
        </div>

        {reduceMotion && (
          <div
            className="pointer-events-none absolute bottom-[10%] right-[10%] rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-[9px] font-semibold text-slate-500 shadow-sm"
            aria-hidden="true"
          >
            Gerak dikurangi
          </div>
        )}
      </div>

      {showLegend && (
        <div className="flex w-full max-w-[430px] flex-col items-center gap-2">
          <div className="grid w-full grid-cols-2 gap-x-3 gap-y-2 text-[11px] text-slate-700 sm:grid-cols-3">
            <LegendItem type="hydronium">H₃O⁺ / H⁺(aq), terhidrasi</LegendItem>
            <LegendItem type="chloride">Cl⁻(aq), ion pendamping</LegendItem>
            <LegendItem type="mg">Mg(s), kisi logam</LegendItem>
            <LegendItem type="mg2">Mg²⁺(aq), terhidrasi</LegendItem>
            <LegendItem type="h2">H₂, molekul diatomik</LegendItem>
            <LegendItem type="effective">Peristiwa netto efektif</LegendItem>
            <LegendItem type="ineffective">Tumbukan tidak efektif</LegendItem>
          </div>

          <p className="text-center text-[11px] font-semibold text-slate-700">
            Mg(s) + 2H⁺(aq) → Mg²⁺(aq) + H₂(g) ↑
          </p>
          <p className="max-w-[430px] text-center text-[10px] leading-relaxed text-slate-500">
            Kilatan kuning merangkum beberapa tahap transfer elektron di permukaan,
            bukan tumbukan serentak tiga partikel. Cl⁻ tetap terpisah di dalam larutan;
            satu gelembung makroskopik mengandung sangat banyak molekul H₂.
          </p>
          <p className="max-w-[430px] text-center text-[10px] italic leading-relaxed text-slate-400">
            Model tidak berskala. Air ditampilkan secara jarang agar ion mudah dibaca;
            warna, ukuran, jarak, dan jumlah ikon bukan ukuran absolut.
          </p>
        </div>
      )}

      {showFrequency && (
        <div className="flex max-w-full flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
          <span className="font-semibold">
            Potensi frekuensi tumbukan H⁺–permukaan Mg
          </span>
          <div className="flex gap-[3px]" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((level) => (
              <span
                key={level}
                className={`h-3.5 w-2 rounded-sm transition-colors ${
                  level <= frequencyLevel ? "bg-indigo-500" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-400">
            {frequencyLevel === 0
              ? "Mg habis"
              : frequencyLevel <= 1
                ? "Rendah"
                : frequencyLevel <= 3
                  ? "Sedang"
                  : "Tinggi"}
          </span>
        </div>
      )}
    </div>
  );
});
