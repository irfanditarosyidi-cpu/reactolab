"use client";

// Module 2 — 3D scene (Three.js): surface area (shape of the solid).
//
// Macroscopic view : Erlenmeyer flask with a fixed volume of HCl and CaCO₃ of
//                    the chosen shape (same mass → same total solid volume),
//                    stopper + delivery tube into an INVERTED measuring
//                    cylinder standing in a water trough. CO₂ bubbles travel to
//                    the cylinder and push the water level down, so the gas
//                    volume can be read from the printed scale.
// "Zoom" view      : the solid particles of the chosen shape with H⁺ ions
//                    colliding against their exposed surfaces — many small
//                    particles (powder) expose far more surface than one lump.
//                    Contact points are highlighted and counted.
//
// Same mobile-first rules as Module 1 (no shadow maps, instancing, capped
// pixel ratio, paused when off-screen, touch-action: pan-y, 2D fallback).

import {
  memo,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import * as THREE from "three";

export interface M2SimShared {
  shape: string; // option value: bongkahan | kepingan | butiran | serbuk
  factor: number;
  volume: number; // current CO₂ volume (mL)
  vmax: number;
  progress: number; // volume / vmax
  inserted: boolean;
  reacting: boolean;
  finished: boolean;
  micro: boolean;
  resetToken: number;
}

export interface M2Stats {
  collisions: number;
}

interface Props {
  shared: MutableRefObject<M2SimShared>;
  micro: boolean;
  onStats?: (s: M2Stats) => void;
  className?: string;
}

// ---- shape catalogue: equal total volume (~0.6 u³), different surface area ----
interface ShapeSpec {
  count: number;
  size: [number, number, number];
  spread: number;
  layers: number;
}
const SHAPES: Record<string, ShapeSpec> = {
  bongkahan: { count: 1, size: [0.9, 0.75, 0.89], spread: 0, layers: 1 },
  kepingan: { count: 6, size: [0.72, 0.16, 0.87], spread: 0.75, layers: 2 },
  butiran: { count: 27, size: [0.28, 0.28, 0.28], spread: 0.95, layers: 3 },
  serbuk: { count: 125, size: [0.17, 0.17, 0.17], spread: 1.15, layers: 5 },
};
const MAX_SOLIDS = 125;

// ---- apparatus geometry (scene units) ----
const FLASK_X = -1.6;
const FLASK_BODY_H = 1.6;
const FLASK_R_BOTTOM = 1.0;
const FLASK_R_TOP = 0.36;
const FLASK_NECK_H = 0.7;
const LIQUID_H = 0.9;
const MACRO_SOLID_SCALE = 0.5;
const CYL_X = 1.72;
const CYL_R = 0.42;
const CYL_BOTTOM = 0.18;
const CYL_TOP = 3.15;
const TROUGH_R = 0.95;
const TROUGH_H = 0.95;
const WATER_LEVEL = 0.7;
const SCALE_TOP = CYL_TOP - 0.02;
const SCALE_H = 2.2; // 0–50 mL printed over this height
const SCALE_CAP = 50;
const TUBE_END = { x: CYL_X, y: 0.3, z: 0 };

const MAX_BUBBLES = 220;
const H_IONS = 28;
const CL_IONS = 12;
const FLASH_POOL = 28;
const MICRO = { x: 2.4, yMin: 0.12, yMax: 2.9, z: 1.35 };
const ION_R = 0.1;

type TObject = InstanceType<typeof THREE.Object3D>;
type TInstanced = InstanceType<typeof THREE.InstancedMesh>;
type TMesh = InstanceType<typeof THREE.Mesh>;

function rand(a = 0, b = 1) {
  return a + Math.random() * (b - a);
}
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
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
function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

interface Placed {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  rotY: number;
}
/** Deterministic pile layout for a shape (micro units, floor at y = 0). */
function layoutShape(value: string): Placed[] {
  const spec = SHAPES[value] ?? SHAPES.bongkahan;
  const rnd = mulberry32(hashString(value));
  const perLayer = Math.ceil(spec.count / spec.layers);
  const out: Placed[] = [];
  for (let i = 0; i < spec.count; i++) {
    const layer = Math.floor(i / perLayer);
    const radius = spec.spread * (1 - (layer / Math.max(1, spec.layers)) * 0.65);
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * radius;
    out.push({
      x: Math.cos(a) * r,
      z: Math.sin(a) * r * 0.8,
      y: spec.size[1] * (0.5 + layer * 0.92),
      sx: spec.size[0],
      sy: spec.size[1],
      sz: spec.size[2],
      rotY: (rnd() - 0.5) * 1.2,
    });
  }
  return out;
}

function makeScaleTexture(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 1600;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#0f172a";
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.font = "bold 58px Inter, system-ui, sans-serif";
    const pad = 24;
    for (let v = 0; v <= SCALE_CAP; v += 2) {
      const y = pad + (v / SCALE_CAP) * (c.height - pad * 2); // 0 mL at the TOP (inverted cylinder)
      const long = v % 10 === 0;
      const len = long ? 52 : 24;
      ctx.lineWidth = long ? 6 : 3;
      ctx.beginPath();
      ctx.moveTo(c.width - len, y);
      ctx.lineTo(c.width, y);
      ctx.stroke();
      if (long) ctx.fillText(String(v), c.width - len - 10, y);
    }
  }
  return c;
}

function makeSoftShadow(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, "rgba(15,23,42,0.32)");
    g.addColorStop(1, "rgba(15,23,42,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  return c;
}

export default memo(function M2Scene3D({ shared, micro, onStats, className }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [fallback, setFallback] = useState(false);
  const onStatsRef = useRef(onStats);
  onStatsRef.current = onStats;

  // ------------------------------------------------------------------ WebGL
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: InstanceType<typeof THREE.WebGLRenderer> | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setFallback(true);
      return;
    }
    const gl = renderer;
    const smallScreen = window.innerWidth < 640;
    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, smallScreen ? 1.5 : 2));
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.setClearColor(0x000000, 0);
    const canvas = gl.domElement as HTMLCanvasElement;
    canvas.className = "block h-full w-full select-none";
    canvas.style.touchAction = "pan-y";
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "Simulasi 3D reaksi CaCO₃ dengan HCl; gas CO₂ dikumpulkan dalam gelas ukur terbalik; geser mendatar untuk memutar"
    );
    host.appendChild(canvas);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(o: T): T => {
      disposables.push(o);
      return o;
    };
    const dummy: TObject = new THREE.Object3D();
    const hideInstance = (mesh: TInstanced, i: number) => {
      dummy.position.set(0, -50, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(0.0001);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfdbfe, 2.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(4, 8, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x93c5fd, 0.9);
    fill.position.set(-6, 3, -4);
    scene.add(fill);

    // shared materials
    const glassMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xdbeafe,
        transparent: true,
        opacity: 0.22,
        roughness: 0.06,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    const liquidMat = track(
      new THREE.MeshPhysicalMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.45, roughness: 0.12, depthWrite: false })
    );
    const waterMat = track(
      new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.5, roughness: 0.1, depthWrite: false })
    );
    const surfaceMat = track(
      new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.6, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false })
    );
    const solidMat = track(new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.9, metalness: 0 }));
    const standMat = track(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.3 }));
    const rubberMat = track(new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.75 }));
    const stopperMat = track(new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 }));
    const shadowTex = track(new THREE.CanvasTexture(makeSoftShadow()));
    const shadowMat = track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    const shadowGeo = track(new THREE.PlaneGeometry(1, 1));

    // ================================================================ MACRO
    const macro = new THREE.Group();
    scene.add(macro);

    // --- Erlenmeyer flask ---
    const flaskBody = new THREE.Mesh(
      track(new THREE.CylinderGeometry(FLASK_R_TOP, FLASK_R_BOTTOM, FLASK_BODY_H, 48, 1, true)),
      glassMat
    );
    flaskBody.position.set(FLASK_X, FLASK_BODY_H / 2, 0);
    flaskBody.renderOrder = 4;
    macro.add(flaskBody);
    const flaskBottom = new THREE.Mesh(track(new THREE.CircleGeometry(FLASK_R_BOTTOM, 48)), glassMat);
    flaskBottom.rotation.x = -Math.PI / 2;
    flaskBottom.position.set(FLASK_X, 0.001, 0);
    flaskBottom.renderOrder = 4;
    macro.add(flaskBottom);
    const neck = new THREE.Mesh(
      track(new THREE.CylinderGeometry(FLASK_R_TOP, FLASK_R_TOP, FLASK_NECK_H, 32, 1, true)),
      glassMat
    );
    neck.position.set(FLASK_X, FLASK_BODY_H + FLASK_NECK_H / 2, 0);
    neck.renderOrder = 4;
    macro.add(neck);
    const neckRim = new THREE.Mesh(track(new THREE.TorusGeometry(FLASK_R_TOP, 0.03, 10, 48)), surfaceMat);
    neckRim.rotation.x = Math.PI / 2;
    neckRim.position.set(FLASK_X, FLASK_BODY_H + FLASK_NECK_H, 0);
    macro.add(neckRim);
    // HCl (fixed volume)
    const rAtLiquid = FLASK_R_BOTTOM - (FLASK_R_BOTTOM - FLASK_R_TOP) * (LIQUID_H / FLASK_BODY_H);
    const hcl = new THREE.Mesh(
      track(new THREE.CylinderGeometry(rAtLiquid - 0.03, FLASK_R_BOTTOM - 0.03, LIQUID_H, 40, 1, false)),
      liquidMat
    );
    hcl.position.set(FLASK_X, LIQUID_H / 2, 0);
    hcl.renderOrder = 1;
    macro.add(hcl);
    const hclSurface = new THREE.Mesh(track(new THREE.CircleGeometry(rAtLiquid - 0.03, 40)), surfaceMat);
    hclSurface.rotation.x = -Math.PI / 2;
    hclSurface.position.set(FLASK_X, LIQUID_H + 0.002, 0);
    hclSurface.renderOrder = 2;
    macro.add(hclSurface);
    const flaskShadow = new THREE.Mesh(shadowGeo, shadowMat);
    flaskShadow.rotation.x = -Math.PI / 2;
    flaskShadow.scale.set(2.8, 2.8, 1);
    flaskShadow.position.set(FLASK_X, -0.02, 0);
    macro.add(flaskShadow);

    // --- stopper + glass delivery tube (raised before insertion, seated after) ---
    const stopperGroup = new THREE.Group();
    const stopper = new THREE.Mesh(track(new THREE.CylinderGeometry(0.4, 0.33, 0.32, 32)), stopperMat);
    stopper.position.y = 0.16;
    stopperGroup.add(stopper);
    const glassTube = new THREE.Mesh(track(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 12)), surfaceMat);
    glassTube.position.y = 0.32 + 0.375;
    stopperGroup.add(glassTube);
    const STOPPER_SEATED_Y = FLASK_BODY_H + FLASK_NECK_H;
    const STOPPER_RAISED_Y = STOPPER_SEATED_Y + 0.75;
    stopperGroup.position.set(FLASK_X, STOPPER_RAISED_Y, 0);
    macro.add(stopperGroup);

    // --- rubber tube to the trough (ends under the inverted cylinder) ---
    const tubeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(FLASK_X, STOPPER_SEATED_Y + 1.05, 0),
      new THREE.Vector3(FLASK_X + 0.15, STOPPER_SEATED_Y + 1.45, 0.05),
      new THREE.Vector3(0.2, 3.75, 0.25),
      new THREE.Vector3(2.4, 3.05, 0.42),
      new THREE.Vector3(2.75, 1.6, 0.35),
      new THREE.Vector3(2.6, 0.55, 0.2),
      new THREE.Vector3(2.1, 0.3, 0.06),
      new THREE.Vector3(TUBE_END.x, TUBE_END.y, TUBE_END.z),
    ]);
    const rubberTube = new THREE.Mesh(track(new THREE.TubeGeometry(tubeCurve, 110, 0.065, 10, false)), rubberMat);
    macro.add(rubberTube);

    // --- water trough ---
    const trough = new THREE.Mesh(
      track(new THREE.CylinderGeometry(TROUGH_R, TROUGH_R * 0.94, TROUGH_H, 48, 1, true)),
      glassMat
    );
    trough.position.set(CYL_X, TROUGH_H / 2, 0);
    trough.renderOrder = 4;
    macro.add(trough);
    const troughBottom = new THREE.Mesh(track(new THREE.CircleGeometry(TROUGH_R * 0.94, 48)), glassMat);
    troughBottom.rotation.x = -Math.PI / 2;
    troughBottom.position.set(CYL_X, 0.001, 0);
    macro.add(troughBottom);
    const troughWater = new THREE.Mesh(
      track(new THREE.CylinderGeometry(TROUGH_R - 0.05, TROUGH_R * 0.94 - 0.04, WATER_LEVEL, 40, 1, false)),
      waterMat
    );
    troughWater.position.set(CYL_X, WATER_LEVEL / 2, 0);
    troughWater.renderOrder = 1;
    macro.add(troughWater);
    const troughSurface = new THREE.Mesh(track(new THREE.RingGeometry(CYL_R + 0.01, TROUGH_R - 0.05, 48)), surfaceMat);
    troughSurface.rotation.x = -Math.PI / 2;
    troughSurface.position.set(CYL_X, WATER_LEVEL + 0.002, 0);
    troughSurface.renderOrder = 2;
    macro.add(troughSurface);
    const troughShadow = new THREE.Mesh(shadowGeo, shadowMat);
    troughShadow.rotation.x = -Math.PI / 2;
    troughShadow.scale.set(2.9, 2.9, 1);
    troughShadow.position.set(CYL_X, -0.02, 0);
    macro.add(troughShadow);

    // --- inverted measuring cylinder ---
    const cylWall = new THREE.Mesh(
      track(new THREE.CylinderGeometry(CYL_R, CYL_R, CYL_TOP - CYL_BOTTOM, 48, 1, true)),
      glassMat
    );
    cylWall.position.set(CYL_X, (CYL_TOP + CYL_BOTTOM) / 2, 0);
    cylWall.renderOrder = 5;
    macro.add(cylWall);
    const cylTop = new THREE.Mesh(track(new THREE.CircleGeometry(CYL_R, 48)), glassMat);
    cylTop.rotation.x = -Math.PI / 2;
    cylTop.position.set(CYL_X, CYL_TOP, 0);
    cylTop.renderOrder = 5;
    macro.add(cylTop);
    const cylRim = new THREE.Mesh(track(new THREE.TorusGeometry(CYL_R, 0.03, 10, 48)), surfaceMat);
    cylRim.rotation.x = Math.PI / 2;
    cylRim.position.set(CYL_X, CYL_BOTTOM, 0);
    macro.add(cylRim);
    // water column inside the cylinder (unit height, scaled every frame)
    const cylWater = new THREE.Mesh(track(new THREE.CylinderGeometry(CYL_R - 0.03, CYL_R - 0.03, 1, 36, 1, false)), waterMat);
    cylWater.renderOrder = 1;
    macro.add(cylWater);
    const cylWaterTop = new THREE.Mesh(track(new THREE.CircleGeometry(CYL_R - 0.03, 36)), surfaceMat);
    cylWaterTop.rotation.x = -Math.PI / 2;
    cylWaterTop.renderOrder = 2;
    macro.add(cylWaterTop);
    // printed scale (0 mL at the top)
    const scaleTex = track(new THREE.CanvasTexture(makeScaleTexture()));
    scaleTex.anisotropy = 4;
    const scaleStrip = new THREE.Mesh(
      track(new THREE.PlaneGeometry(0.3, SCALE_H)),
      track(new THREE.MeshBasicMaterial({ map: scaleTex, transparent: true, depthWrite: false }))
    );
    scaleStrip.position.set(CYL_X - 0.04, SCALE_TOP - SCALE_H / 2, CYL_R + 0.012);
    scaleStrip.renderOrder = 6;
    macro.add(scaleStrip);
    // stand: rod + clamp behind the cylinder
    const rod = new THREE.Mesh(track(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 14)), standMat);
    rod.position.set(CYL_X + 0.95, 2.0, -0.6);
    macro.add(rod);
    const rodBase = new THREE.Mesh(track(new THREE.CylinderGeometry(0.55, 0.6, 0.1, 32)), standMat);
    rodBase.position.set(CYL_X + 0.95, -0.05, -0.6);
    macro.add(rodBase);
    const arm = new THREE.Mesh(track(new THREE.BoxGeometry(0.07, 0.07, 0.75)), standMat);
    arm.position.set(CYL_X + 0.5, 2.5, -0.3);
    arm.rotation.y = -0.9;
    macro.add(arm);
    const clamp = new THREE.Mesh(track(new THREE.TorusGeometry(CYL_R + 0.06, 0.045, 10, 48)), standMat);
    clamp.rotation.x = Math.PI / 2;
    clamp.position.set(CYL_X, 2.5, 0);
    macro.add(clamp);

    // --- CaCO₃ solids in the flask (instanced) ---
    const solidGeo = track(new THREE.BoxGeometry(1, 1, 1));
    const macroSolids: TInstanced = new THREE.InstancedMesh(solidGeo, solidMat, MAX_SOLIDS);
    macroSolids.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    macroSolids.frustumCulled = false;
    macro.add(macroSolids);

    // --- CO₂ bubbles (instanced; zone 0 = flask, zone 1 = cylinder) ---
    const bubbleMat = track(
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.62, roughness: 0.08, clearcoat: 1, depthWrite: false })
    );
    const bubbles: TInstanced = new THREE.InstancedMesh(track(new THREE.SphereGeometry(1, 8, 6)), bubbleMat, MAX_BUBBLES);
    bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    bubbles.frustumCulled = false;
    bubbles.renderOrder = 3;
    macro.add(bubbles);
    const bAlive = new Uint8Array(MAX_BUBBLES);
    const bZone = new Uint8Array(MAX_BUBBLES);
    const bX = new Float32Array(MAX_BUBBLES);
    const bY = new Float32Array(MAX_BUBBLES);
    const bZ = new Float32Array(MAX_BUBBLES);
    const bVy = new Float32Array(MAX_BUBBLES);
    const bR = new Float32Array(MAX_BUBBLES);
    const bPhase = new Float32Array(MAX_BUBBLES);
    for (let i = 0; i < MAX_BUBBLES; i++) hideInstance(bubbles, i);
    bubbles.instanceMatrix.needsUpdate = true;

    // ================================================================ MICRO
    const microG = new THREE.Group();
    microG.visible = false;
    scene.add(microG);
    const microFloor = new THREE.Mesh(
      track(new THREE.PlaneGeometry(7, 4)),
      track(new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.45, roughness: 0.2, depthWrite: false }))
    );
    microFloor.rotation.x = -Math.PI / 2;
    microFloor.position.y = -0.002;
    microG.add(microFloor);
    const microSolids: TInstanced = new THREE.InstancedMesh(solidGeo, solidMat, MAX_SOLIDS);
    microSolids.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    microSolids.frustumCulled = false;
    microG.add(microSolids);

    const hMesh: TInstanced = new THREE.InstancedMesh(
      track(new THREE.SphereGeometry(ION_R, 14, 10)),
      track(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 })),
      H_IONS
    );
    const clMesh: TInstanced = new THREE.InstancedMesh(
      track(new THREE.SphereGeometry(0.14, 14, 10)),
      track(new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.4 })),
      CL_IONS
    );
    for (const m of [hMesh, clMesh]) {
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      microG.add(m);
    }
    const ION_TOTAL = H_IONS + CL_IONS;
    const ionPos = new Float32Array(ION_TOTAL * 3);
    const ionVel = new Float32Array(ION_TOTAL * 3);
    const seedIon = (i: number) => {
      const o = i * 3;
      ionPos[o] = rand(-MICRO.x, MICRO.x);
      ionPos[o + 1] = rand(1.2, MICRO.yMax);
      ionPos[o + 2] = rand(-MICRO.z, MICRO.z);
      const speed = rand(1.4, 2.2);
      const th = rand(0, Math.PI * 2);
      const ph = rand(-1, 1);
      const horiz = Math.sqrt(1 - ph * ph);
      ionVel[o] = Math.cos(th) * horiz * speed;
      ionVel[o + 1] = ph * speed;
      ionVel[o + 2] = Math.sin(th) * horiz * speed;
    };
    for (let i = 0; i < ION_TOTAL; i++) seedIon(i);

    const flashGeo = track(new THREE.SphereGeometry(0.07, 10, 8));
    const flashes = Array.from({ length: FLASH_POOL }, () => {
      const mat = track(new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0, depthWrite: false }));
      const m = new THREE.Mesh(flashGeo, mat);
      m.visible = false;
      microG.add(m);
      return { mesh: m as TMesh, mat, age: 0, active: false };
    });
    let flashCursor = 0;
    const spawnFlash = (x: number, y: number, z: number) => {
      const f = flashes[flashCursor++ % FLASH_POOL];
      f.active = true;
      f.age = 0;
      f.mesh.position.set(x, y, z);
      f.mesh.scale.setScalar(1);
      f.mesh.visible = true;
    };

    // ---- state ----
    const stats: M2Stats = { collisions: 0 };
    let statsDirty = false;
    let statsTimer = 0;
    let lastReset = shared.current.resetToken;
    let currentShape = "";
    let placed: Placed[] = [];
    let insertStart = -1;
    let spawnAcc0 = 0;
    let spawnAcc1 = 0;

    const applyShape = (value: string) => {
      currentShape = value;
      placed = layoutShape(value);
      for (let i = 0; i < MAX_SOLIDS; i++) {
        hideInstance(macroSolids, i);
        hideInstance(microSolids, i);
      }
      macroSolids.instanceMatrix.needsUpdate = true;
      microSolids.instanceMatrix.needsUpdate = true;
    };
    applyShape(shared.current.shape);

    const resetDynamic = () => {
      for (let i = 0; i < MAX_BUBBLES; i++) {
        bAlive[i] = 0;
        hideInstance(bubbles, i);
      }
      bubbles.instanceMatrix.needsUpdate = true;
      for (const f of flashes) {
        f.active = false;
        f.mesh.visible = false;
      }
      stats.collisions = 0;
      statsDirty = true;
      insertStart = -1;
      spawnAcc0 = 0;
      spawnAcc1 = 0;
    };

    // ---- orbit (horizontal drag; vertical gestures scroll the page) ----
    const orbit = { az: 0.3, dist: 8.8, polar: 1.38, tx: 0.15, ty: 1.55, userUntil: 0, dragging: false, lastX: 0 };
    const onDown = (e: PointerEvent) => {
      orbit.dragging = true;
      orbit.lastX = e.clientX;
      orbit.userUntil = performance.now() + 4000;
    };
    const onMove = (e: PointerEvent) => {
      if (!orbit.dragging) return;
      orbit.az += (e.clientX - orbit.lastX) * 0.007;
      orbit.lastX = e.clientX;
      orbit.userUntil = performance.now() + 4000;
    };
    const onUp = () => {
      orbit.dragging = false;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onUp);
    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    let aspect = 1;
    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      aspect = w / h;
      camera.aspect = aspect;
      camera.fov = aspect < 1 ? 42 : 33;
      camera.updateProjectionMatrix();
      gl.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    let onScreen = true;
    let pageVisible = document.visibilityState !== "hidden";
    let raf = 0;
    let running = false;
    let last = performance.now();
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
        syncLoop();
      },
      { threshold: 0.02 }
    );
    io.observe(host);
    const onVis = () => {
      pageVisible = document.visibilityState !== "hidden";
      syncLoop();
    };
    document.addEventListener("visibilitychange", onVis);

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const s = shared.current;

      if (s.resetToken !== lastReset) {
        lastReset = s.resetToken;
        resetDynamic();
      }
      if (s.shape !== currentShape) applyShape(s.shape);

      macro.visible = !s.micro;
      microG.visible = s.micro;
      const dissolve = s.finished ? 0 : Math.cbrt(Math.max(0, 1 - s.progress));
      const rateNorm = s.reacting ? Math.max(0, 1 - s.progress) : 0; // dV/dt ∝ (Vmax − V)

      // ---------- MACRO ----------
      if (!s.micro) {
        // insertion (pour) + stopper seating
        let k = 1;
        if (s.inserted) {
          if (insertStart < 0) insertStart = now;
          k = easeOutCubic((now - insertStart) / 1000 / 0.9);
          const sk = easeOutCubic(((now - insertStart) / 1000 - 0.5) / 0.5);
          stopperGroup.position.y = STOPPER_RAISED_Y + (STOPPER_SEATED_Y - STOPPER_RAISED_Y) * sk;
        } else {
          insertStart = -1;
          stopperGroup.position.y = STOPPER_RAISED_Y;
        }
        // solids
        for (let i = 0; i < MAX_SOLIDS; i++) {
          if (i >= placed.length || !s.inserted || s.finished) {
            hideInstance(macroSolids, i);
            continue;
          }
          const p = placed[i];
          const stagger = Math.min(1, Math.max(0, k * 1.35 - (i / Math.max(1, placed.length)) * 0.35));
          const restY = p.y * MACRO_SOLID_SCALE + 0.02;
          const dropFrom = FLASK_BODY_H + FLASK_NECK_H + 0.9;
          dummy.position.set(
            FLASK_X + p.x * MACRO_SOLID_SCALE * (0.25 + 0.75 * stagger),
            dropFrom + (restY - dropFrom) * easeOutCubic(stagger),
            p.z * MACRO_SOLID_SCALE * (0.25 + 0.75 * stagger)
          );
          dummy.rotation.set(0, p.rotY, 0);
          dummy.scale.set(p.sx * MACRO_SOLID_SCALE * dissolve, p.sy * MACRO_SOLID_SCALE * dissolve, p.sz * MACRO_SOLID_SCALE * dissolve);
          dummy.updateMatrix();
          macroSolids.setMatrixAt(i, dummy.matrix);
        }
        macroSolids.instanceMatrix.needsUpdate = true;

        // water level inside the inverted cylinder follows the gas volume
        const gasH = (Math.min(SCALE_CAP, s.volume) / SCALE_CAP) * SCALE_H;
        const waterTop = SCALE_TOP - gasH;
        const h = Math.max(0.01, waterTop - WATER_LEVEL);
        cylWater.scale.set(1, h, 1);
        cylWater.position.set(CYL_X, WATER_LEVEL + h / 2, 0);
        cylWaterTop.position.set(CYL_X, waterTop, 0);

        // bubbles: flask (on the solid) and cylinder (from the tube end)
        const settled = s.inserted && insertStart > 0 && now - insertStart >= 900;
        if (s.reacting && settled) {
          spawnAcc0 += (2 + 30 * rateNorm * Math.min(1, s.factor / 3)) * dt;
          spawnAcc1 += (1 + 16 * rateNorm * Math.min(1, s.factor / 3)) * dt;
          const spawn = (zone: number) => {
            let slot = -1;
            for (let i = 0; i < MAX_BUBBLES; i++) {
              if (!bAlive[i]) {
                slot = i;
                break;
              }
            }
            if (slot < 0) return;
            bAlive[slot] = 1;
            bZone[slot] = zone;
            if (zone === 0) {
              const src = placed[Math.floor(Math.random() * placed.length)] ?? { x: 0, y: 0.1, z: 0 };
              bX[slot] = FLASK_X + src.x * MACRO_SOLID_SCALE + rand(-0.06, 0.06);
              bY[slot] = src.y * MACRO_SOLID_SCALE * dissolve + 0.04;
              bZ[slot] = src.z * MACRO_SOLID_SCALE + rand(-0.06, 0.06);
              bR[slot] = 0.018 + rand(0, 0.025);
              bVy[slot] = 0.45 + rand(0, 0.35);
            } else {
              bX[slot] = TUBE_END.x + rand(-0.08, 0.08);
              bY[slot] = TUBE_END.y + 0.05;
              bZ[slot] = TUBE_END.z + rand(-0.08, 0.08);
              bR[slot] = 0.03 + rand(0, 0.035);
              bVy[slot] = 0.7 + rand(0, 0.4);
            }
            bPhase[slot] = rand(0, Math.PI * 2);
          };
          while (spawnAcc0 >= 1) {
            spawnAcc0 -= 1;
            spawn(0);
          }
          while (spawnAcc1 >= 1) {
            spawnAcc1 -= 1;
            spawn(1);
          }
        }
        for (let i = 0; i < MAX_BUBBLES; i++) {
          if (!bAlive[i]) continue;
          bY[i] += bVy[i] * dt;
          bPhase[i] += dt * 6;
          const x = bX[i] + Math.sin(bPhase[i]) * 0.008;
          const limit = bZone[i] === 0 ? LIQUID_H - bR[i] : waterTop - bR[i];
          if (bY[i] >= limit) {
            bAlive[i] = 0;
            hideInstance(bubbles, i);
            continue;
          }
          dummy.position.set(x, bY[i], bZ[i]);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(bR[i]);
          dummy.updateMatrix();
          bubbles.setMatrixAt(i, dummy.matrix);
        }
        bubbles.instanceMatrix.needsUpdate = true;
      }

      // ---------- MICRO ----------
      if (s.micro) {
        const solidPresent = s.inserted && !s.finished;
        for (let i = 0; i < MAX_SOLIDS; i++) {
          if (i >= placed.length || !solidPresent) {
            hideInstance(microSolids, i);
            continue;
          }
          const p = placed[i];
          dummy.position.set(p.x, p.y * dissolve, p.z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(p.sx * dissolve, p.sy * dissolve, p.sz * dissolve);
          dummy.updateMatrix();
          microSolids.setMatrixAt(i, dummy.matrix);
        }
        microSolids.instanceMatrix.needsUpdate = true;

        for (let i = 0; i < ION_TOTAL; i++) {
          const isH = i < H_IONS;
          const mesh = isH ? hMesh : clMesh;
          const idx = isH ? i : i - H_IONS;
          const r = isH ? ION_R : 0.14;
          const o = i * 3;
          ionPos[o] += ionVel[o] * dt;
          ionPos[o + 1] += ionVel[o + 1] * dt;
          ionPos[o + 2] += ionVel[o + 2] * dt;
          if (ionPos[o] < -MICRO.x || ionPos[o] > MICRO.x) {
            ionVel[o] *= -1;
            ionPos[o] = Math.max(-MICRO.x, Math.min(MICRO.x, ionPos[o]));
          }
          if (ionPos[o + 2] < -MICRO.z || ionPos[o + 2] > MICRO.z) {
            ionVel[o + 2] *= -1;
            ionPos[o + 2] = Math.max(-MICRO.z, Math.min(MICRO.z, ionPos[o + 2]));
          }
          if (ionPos[o + 1] > MICRO.yMax) {
            ionVel[o + 1] = -Math.abs(ionVel[o + 1]);
            ionPos[o + 1] = MICRO.yMax;
          }
          if (ionPos[o + 1] < MICRO.yMin) {
            ionVel[o + 1] = Math.abs(ionVel[o + 1]);
            ionPos[o + 1] = MICRO.yMin;
          }
          // collisions with the exposed surfaces of the solid particles (AABB)
          if (solidPresent) {
            for (let j = 0; j < placed.length; j++) {
              const p = placed[j];
              const hx = (p.sx * dissolve) / 2;
              const hy = (p.sy * dissolve) / 2;
              const hz = (p.sz * dissolve) / 2;
              const cy = p.y * dissolve;
              const cx = Math.max(p.x - hx, Math.min(p.x + hx, ionPos[o]));
              const cyy = Math.max(cy - hy, Math.min(cy + hy, ionPos[o + 1]));
              const cz = Math.max(p.z - hz, Math.min(p.z + hz, ionPos[o + 2]));
              const dx = ionPos[o] - cx;
              const dy = ionPos[o + 1] - cyy;
              const dz = ionPos[o + 2] - cz;
              const d2 = dx * dx + dy * dy + dz * dz;
              if (d2 < r * r) {
                const d = Math.sqrt(d2) || 1e-6;
                const nx = d2 > 1e-12 ? dx / d : 0;
                const ny = d2 > 1e-12 ? dy / d : 1;
                const nz = d2 > 1e-12 ? dz / d : 0;
                const vdot = ionVel[o] * nx + ionVel[o + 1] * ny + ionVel[o + 2] * nz;
                if (vdot < 0) {
                  ionVel[o] -= 2 * vdot * nx;
                  ionVel[o + 1] -= 2 * vdot * ny;
                  ionVel[o + 2] -= 2 * vdot * nz;
                }
                ionPos[o] = cx + nx * (r + 0.002);
                ionPos[o + 1] = cyy + ny * (r + 0.002);
                ionPos[o + 2] = cz + nz * (r + 0.002);
                if (isH) {
                  spawnFlash(cx, cyy, cz);
                  stats.collisions++;
                  statsDirty = true;
                }
                break;
              }
            }
          }
          dummy.position.set(ionPos[o], ionPos[o + 1], ionPos[o + 2]);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          mesh.setMatrixAt(idx, dummy.matrix);
        }
        hMesh.instanceMatrix.needsUpdate = true;
        clMesh.instanceMatrix.needsUpdate = true;

        for (const f of flashes) {
          if (!f.active) continue;
          f.age += dt;
          if (f.age >= 0.45) {
            f.active = false;
            f.mesh.visible = false;
            continue;
          }
          const kk = f.age / 0.45;
          f.mesh.scale.setScalar(1 + kk * 1.8);
          f.mat.opacity = 1 - kk;
        }
        statsTimer += dt;
        if (statsDirty && statsTimer >= 0.25) {
          statsTimer = 0;
          statsDirty = false;
          onStatsRef.current?.({ ...stats });
        }
      }

      // ---------- CAMERA ----------
      const want = s.micro
        ? { dist: 6.2, polar: 1.15, tx: 0, ty: 0.8 }
        : { dist: 8.8, polar: 1.38, tx: 0.15, ty: 1.55 };
      const narrow = aspect < 1 ? 1.22 : 1;
      const kc = 1 - Math.exp(-dt * 5);
      orbit.dist += (want.dist * narrow - orbit.dist) * kc;
      orbit.polar += (want.polar - orbit.polar) * kc;
      orbit.tx += (want.tx - orbit.tx) * kc;
      orbit.ty += (want.ty - orbit.ty) * kc;
      if (!s.micro && !s.reacting && now > orbit.userUntil && !orbit.dragging) {
        orbit.az += dt * 0.1;
      }
      const sp = Math.sin(orbit.polar);
      camera.position.set(
        orbit.tx + orbit.dist * sp * Math.sin(orbit.az),
        orbit.ty + orbit.dist * Math.cos(orbit.polar),
        orbit.dist * sp * Math.cos(orbit.az)
      );
      camera.lookAt(orbit.tx, orbit.ty, 0);

      gl.render(scene, camera);
      if (running) raf = requestAnimationFrame(tick);
    };

    const syncLoop = () => {
      const shouldRun = onScreen && pageVisible;
      if (shouldRun && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    syncLoop();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onUp);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      disposables.forEach((d: { dispose: () => void }) => d.dispose());
      gl.dispose();
      canvas.remove();
    };
  }, [shared]);

  // ------------------------------------------------------- 2D fallback (no WebGL)
  useEffect(() => {
    if (!fallback) return;
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full";
    host.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const bubbles: Array<{ x: number; y: number; r: number; vy: number; limit: number }> = [];
    const ions = Array.from({ length: 22 }, () => ({ x: Math.random(), y: Math.random() * 0.6, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4 }));
    let raf = 0;
    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = shared.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = host.clientWidth;
      const H = host.clientHeight;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!s.micro) {
        const base = H * 0.86;
        // flask (trapezoid) + liquid
        const fx = W * 0.3;
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fx - 18, base - H * 0.55);
        ctx.lineTo(fx - 18, base - H * 0.42);
        ctx.lineTo(fx - 60, base);
        ctx.lineTo(fx + 60, base);
        ctx.lineTo(fx + 18, base - H * 0.42);
        ctx.lineTo(fx + 18, base - H * 0.55);
        ctx.stroke();
        ctx.fillStyle = "rgba(186,230,253,0.6)";
        ctx.beginPath();
        ctx.moveTo(fx - 45, base - H * 0.14);
        ctx.lineTo(fx + 45, base - H * 0.14);
        ctx.lineTo(fx + 60, base);
        ctx.lineTo(fx - 60, base);
        ctx.fill();
        if (s.inserted && !s.finished) {
          ctx.fillStyle = "#d6d3d1";
          const sz = 22 * Math.cbrt(1 - s.progress);
          ctx.fillRect(fx - sz / 2, base - sz, sz, sz);
        }
        // inverted cylinder with water level
        const cx = W * 0.72;
        const top = base - H * 0.62;
        const cw = 44;
        ctx.strokeStyle = "#94a3b8";
        ctx.strokeRect(cx - cw / 2, top, cw, base - H * 0.08 - top);
        const gasH = (Math.min(50, s.volume) / 50) * (base - H * 0.08 - top) * 0.9;
        ctx.fillStyle = "rgba(125,211,252,0.6)";
        ctx.fillRect(cx - cw / 2 + 2, top + gasH, cw - 4, base - H * 0.08 - top - gasH - 2);
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.textAlign = "left";
        for (let v = 0; v <= 50; v += 10) {
          const y = top + (v / 50) * (base - H * 0.08 - top) * 0.9;
          ctx.fillRect(cx + cw / 2, y, 8, 1.5);
          ctx.fillText(String(v), cx + cw / 2 + 11, y + 4);
        }
        if (s.reacting) {
          for (let n = 0; n < 2; n++) if (Math.random() < 0.4 * (1 - s.progress) + 0.05) bubbles.push({ x: cx + (Math.random() - 0.5) * 20, y: base - H * 0.1, r: 2 + Math.random() * 2, vy: 60, limit: top + gasH });
        }
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i];
          b.y -= b.vy * dt;
          if (b.y < b.limit) {
            bubbles.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const spec = SHAPES[s.shape] ?? SHAPES.bongkahan;
        const floor = H * 0.78;
        const present = s.inserted && !s.finished;
        if (present) {
          ctx.fillStyle = "#d6d3d1";
          const n = Math.min(spec.count, 40);
          const size = Math.max(6, 70 / Math.cbrt(spec.count)) * Math.cbrt(1 - s.progress);
          for (let i = 0; i < n; i++) {
            const x = W * 0.5 + ((i % 8) - 3.5) * size * 1.2;
            const y = floor - size - Math.floor(i / 8) * size * 0.9;
            ctx.fillRect(x - size / 2, y, size, size);
          }
        }
        for (const ion of ions) {
          ion.x += ion.vx * dt;
          ion.y += ion.vy * dt;
          if (ion.x < 0.02 || ion.x > 0.98) ion.vx *= -1;
          if (ion.y < 0.02) ion.vy = Math.abs(ion.vy);
          if (ion.y > 0.7) {
            ion.vy = -Math.abs(ion.vy);
            if (present) {
              ctx.strokeStyle = "#f59e0b";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(ion.x * W, floor - 4, 8, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(ion.x * W, ion.y * H, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      canvas.remove();
    };
  }, [fallback, shared]);

  return (
    <div
      ref={hostRef}
      className={
        "relative h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,#f8fbff_0%,#e6f0fb_55%,#d5e5f6_100%)] " +
        (className ?? "")
      }
    >
      {micro && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,rgba(255,255,255,0)_58%,rgba(219,234,254,0.85)_100%)]"
        />
      )}
      {fallback && (
        <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold text-slate-500">
          Mode 2D (WebGL tidak tersedia)
        </p>
      )}
    </div>
  );
});
