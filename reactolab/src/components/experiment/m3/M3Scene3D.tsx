"use client";

// Module 3 — 3D virtual laboratory (Three.js): temperature factor.
//
// Macroscopic view : minimal lab bench, Na₂S₂O₃ 0,1 M and HCl 1 M beakers on a
//                    heater/cooler plate with digital thermometers, reaction
//                    beaker on white paper marked with an X. Both solutions
//                    equilibrate to the target temperature, are poured into the
//                    reaction beaker, and the liquid turns cloudy volumetrically
//                    (liquid material + colloidal sulfur particles + sediment).
// "Perbesar" view  : S₂O₃²⁻ and H⁺ spheres in smooth random motion; speed and
//                    the chance of an effective collision rise with temperature.
//
// Camera: perspective slightly from above; horizontal drag rotates, zoom via
// shared.zoom, "Lihat dari Atas" via shared.topView. Same mobile-first rules as
// M1/M2 (no shadow maps, instancing, capped DPR, paused off-screen, pan-y).

import {
  memo,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import * as THREE from "three";

export type M3Phase = "idle" | "heating" | "ready" | "pouring" | "reacting" | "done";

export interface M3SimShared {
  temperature: number; // target °C
  tempA: number; // current Na₂S₂O₃ beaker temperature
  tempB: number; // current HCl beaker temperature
  phase: M3Phase;
  pourProgress: number; // 0..1 during "pouring"
  turbidity: number; // 0 (clear) .. 1 (X invisible) .. 1.3
  micro: boolean;
  microTemp: number; // temperature shown in the particle view
  topView: boolean;
  zoom: number; // 0.65..1.6 (macro camera distance multiplier)
  resetToken: number; // bump to clear dynamic state (colloid, flashes, counters)
  viewResetToken: number; // bump to reset the camera angle/zoom
}

export interface M3Stats {
  effective: number;
  ineffective: number;
}

interface Props {
  shared: MutableRefObject<M3SimShared>;
  micro: boolean;
  phase: M3Phase;
  onStats?: (s: M3Stats) => void;
  className?: string;
}

// ---- layout (scene units) ----
const PLATE_X = -1.7;
const PLATE_Z = 0.35;
const PLATE_TOP = 0.22;
const AX = -2.35;
const BX = -1.05;
const RX = 1.55;
const RZ = 0.45;
const BEAKER_R = 0.42;
const BEAKER_H = 1.0;
const RBEAKER_R = 0.55;
const RBEAKER_H = 1.25;
const R_LIQ_MAX_H = 0.8;
const POUR_TILT = -1.05;
const POUR_POS = { x: RX - 0.66, y: 1.72, z: RZ };
const ROOM_T = 25;

const MAX_COLLOID = 160;
const S_COUNT = 14;
const H_COUNT = 26;
const S_R = 0.17;
const H_R = 0.09;
const FLASH_POOL = 24;
const PRODUCT_POOL = 48;
const PRODUCT_R = 0.075;
const MICRO = { x: 2.2, yMin: 0.2, yMax: 2.8, z: 1.2 };
const MICRO_FLOOR_Y = MICRO.yMin - 0.3;

type TObject = InstanceType<typeof THREE.Object3D>;
type TInstanced = InstanceType<typeof THREE.InstancedMesh>;
type TMesh = InstanceType<typeof THREE.Mesh>;
type TGroup = InstanceType<typeof THREE.Group>;

function rand(a = 0, b = 1) {
  return a + Math.random() * (b - a);
}
function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}
function easeInOut(t: number) {
  const k = clamp01(t);
  return k * k * (3 - 2 * k);
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function particleSpeed(tempC: number) {
  return 0.8 + ((tempC - 10) / 50) * 2.0;
}
function effectiveChance(tempC: number) {
  return 0.1 + 0.6 * Math.pow(clamp01((tempC - 10) / 50), 1.3);
}

/** Small canvas-backed text display (digital readouts / labels). */
function makeDisplay(
  w: number,
  h: number,
  opts: { font: string; fg: string; bg: string; radius?: number }
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  let last = "";
  const draw = (text: string) => {
    if (!ctx || text === last) return;
    last = text;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = opts.bg;
    const r = opts.radius ?? 18;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(0, 0, w, h, r);
    else ctx.rect(0, 0, w, h);
    ctx.fill();
    ctx.fillStyle = opts.fg;
    ctx.font = opts.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + 2);
    tex.needsUpdate = true;
  };
  return { tex, draw };
}

function makeXPaper(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 22;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(70, 70);
    ctx.lineTo(186, 186);
    ctx.moveTo(186, 70);
    ctx.lineTo(70, 186);
    ctx.stroke();
  }
  return c;
}

function makeSoftShadow(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, "rgba(15,23,42,0.28)");
    g.addColorStop(1, "rgba(15,23,42,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  return c;
}

export default memo(function M3Scene3D({ shared, micro, phase, onStats, className }: Props) {
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
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
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
      "Laboratorium virtual 3D: larutan Na₂S₂O₃ dan HCl disetarakan suhunya lalu dicampurkan di atas kertas bertanda X; geser mendatar untuk memutar"
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
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9e6f5, 1.9));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(3, 8, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbfdbfe, 0.8);
    fill.position.set(-6, 4, -4);
    scene.add(fill);

    // ---- shared materials ----
    const glassMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xe2eefb,
        transparent: true,
        opacity: 0.2,
        roughness: 0.05,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    const rimMat = track(new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.65, roughness: 0.1, clearcoat: 1 }));
    const clearLiquidMat = track(new THREE.MeshPhysicalMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.38, roughness: 0.1, depthWrite: false }));
    const surfaceMat = track(new THREE.MeshPhysicalMaterial({ color: 0xf0f9ff, transparent: true, opacity: 0.55, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }));
    const benchMat = track(new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.92 }));
    const darkMat = track(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55, metalness: 0.35 }));
    const padMat = track(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 }));
    const shadowTex = track(new THREE.CanvasTexture(makeSoftShadow()));
    const shadowMat = track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    const shadowGeo = track(new THREE.PlaneGeometry(1, 1));
    const addShadow = (parent: TGroup, x: number, z: number, size: number) => {
      const m = new THREE.Mesh(shadowGeo, shadowMat);
      m.rotation.x = -Math.PI / 2;
      m.scale.set(size, size, 1);
      m.position.set(x, 0.006, z);
      parent.add(m);
    };

    // ================================================================ MACRO
    const macro: TGroup = new THREE.Group();
    scene.add(macro);

    // bench (kept simple)
    const bench = new THREE.Mesh(track(new THREE.BoxGeometry(9.5, 0.12, 4.6)), benchMat);
    bench.position.set(-0.3, -0.06, 0.25);
    macro.add(bench);
    const benchEdge = new THREE.Mesh(track(new THREE.BoxGeometry(9.5, 0.05, 4.6)), track(new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.9 })));
    benchEdge.position.set(-0.3, -0.135, 0.25);
    macro.add(benchEdge);

    // heater / cooler plate with indicator ring and target display
    const plate = new THREE.Mesh(track(new THREE.BoxGeometry(3.1, PLATE_TOP, 1.5)), darkMat);
    plate.position.set(PLATE_X, PLATE_TOP / 2, PLATE_Z);
    macro.add(plate);
    addShadow(macro, PLATE_X, PLATE_Z, 4.4);
    const padGeo = track(new THREE.CylinderGeometry(0.52, 0.52, 0.03, 40));
    for (const x of [AX, BX]) {
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(x, PLATE_TOP + 0.015, PLATE_Z);
      macro.add(pad);
    }
    const ringMat = track(new THREE.MeshStandardMaterial({ color: 0x64748b, emissive: 0x000000, roughness: 0.4 }));
    const ringGeo = track(new THREE.TorusGeometry(0.55, 0.022, 10, 56));
    for (const x of [AX, BX]) {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, PLATE_TOP + 0.03, PLATE_Z);
      macro.add(ring);
    }
    const plateDisplay = makeDisplay(320, 96, { font: "bold 54px ui-monospace, Menlo, monospace", fg: "#a7f3d0", bg: "#0f172a", radius: 14 });
    track(plateDisplay.tex);
    const plateScreen = new THREE.Mesh(
      track(new THREE.PlaneGeometry(0.9, 0.27)),
      track(new THREE.MeshBasicMaterial({ map: plateDisplay.tex, transparent: true }))
    );
    plateScreen.position.set(PLATE_X, PLATE_TOP / 2 + 0.02, PLATE_Z + 0.755);
    macro.add(plateScreen);

    // beaker factory (glass + liquid + label)
    const beakerWall = track(new THREE.CylinderGeometry(BEAKER_R, BEAKER_R * 0.96, BEAKER_H, 40, 1, true));
    const beakerBottom = track(new THREE.CircleGeometry(BEAKER_R * 0.96, 40));
    const beakerRim = track(new THREE.TorusGeometry(BEAKER_R, 0.022, 10, 48));
    const beakerLiquid = track(new THREE.CylinderGeometry(BEAKER_R - 0.03, BEAKER_R * 0.96 - 0.03, 1, 32, 1, false));
    const beakerSurface = track(new THREE.CircleGeometry(BEAKER_R - 0.03, 32));
    const LIQ_H = 0.6;
    const makeBeaker = (label: string, homeX: number) => {
      const g: TGroup = new THREE.Group();
      const wall = new THREE.Mesh(beakerWall, glassMat);
      wall.position.y = BEAKER_H / 2;
      wall.renderOrder = 4;
      g.add(wall);
      const bottom = new THREE.Mesh(beakerBottom, glassMat);
      bottom.rotation.x = -Math.PI / 2;
      bottom.position.y = 0.002;
      bottom.renderOrder = 4;
      g.add(bottom);
      const rim = new THREE.Mesh(beakerRim, rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = BEAKER_H;
      g.add(rim);
      const liquid = new THREE.Mesh(beakerLiquid, clearLiquidMat);
      liquid.scale.set(1, LIQ_H, 1);
      liquid.position.y = LIQ_H / 2 + 0.01;
      liquid.renderOrder = 1;
      g.add(liquid);
      const surface = new THREE.Mesh(beakerSurface, surfaceMat);
      surface.rotation.x = -Math.PI / 2;
      surface.position.y = LIQ_H + 0.012;
      surface.renderOrder = 2;
      g.add(surface);
      const lbl = makeDisplay(360, 96, { font: "bold 44px Inter, system-ui, sans-serif", fg: "#1e293b", bg: "rgba(255,255,255,0.92)", radius: 16 });
      track(lbl.tex);
      lbl.draw(label);
      const plateLabel = new THREE.Mesh(
        track(new THREE.PlaneGeometry(0.76, 0.2)),
        track(new THREE.MeshBasicMaterial({ map: lbl.tex, transparent: true, depthWrite: false }))
      );
      plateLabel.position.set(0, 0.78, BEAKER_R + 0.005);
      plateLabel.renderOrder = 5;
      g.add(plateLabel);
      g.position.set(homeX, PLATE_TOP + 0.03, PLATE_Z);
      macro.add(g);
      return { group: g, liquid: liquid as TMesh, surface: surface as TMesh };
    };
    const beakerA = makeBeaker("Na₂S₂O₃ 0,1 M", AX);
    const beakerB = makeBeaker("HCl 1 M", BX);

    // digital thermometers (probe + stand + display) behind each beaker
    const probeGeo = track(new THREE.CylinderGeometry(0.018, 0.018, 1.25, 10));
    const standGeo = track(new THREE.CylinderGeometry(0.03, 0.03, 1.25, 10));
    const makeThermo = (x: number) => {
      const g: TGroup = new THREE.Group();
      const stand = new THREE.Mesh(standGeo, darkMat);
      stand.position.set(x + 0.62, PLATE_TOP + 0.625, PLATE_Z - 0.55);
      g.add(stand);
      const disp = makeDisplay(300, 110, { font: "bold 60px ui-monospace, Menlo, monospace", fg: "#e0f2fe", bg: "#0f172a", radius: 16 });
      track(disp.tex);
      const screen = new THREE.Mesh(
        track(new THREE.PlaneGeometry(0.62, 0.23)),
        track(new THREE.MeshBasicMaterial({ map: disp.tex, transparent: true }))
      );
      screen.position.set(x + 0.62, PLATE_TOP + 1.35, PLATE_Z - 0.55);
      g.add(screen);
      const probe = new THREE.Mesh(probeGeo, track(new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, roughness: 0.3 })));
      probe.position.set(x + 0.2, PLATE_TOP + 0.75, PLATE_Z - 0.1);
      probe.rotation.z = 0.45;
      probe.rotation.x = 0.35;
      g.add(probe);
      macro.add(g);
      return { draw: disp.draw };
    };
    const thermoA = makeThermo(AX);
    const thermoB = makeThermo(BX);

    // reaction beaker on the X paper
    const paperTex = track(new THREE.CanvasTexture(makeXPaper()));
    const paper = new THREE.Mesh(track(new THREE.PlaneGeometry(1.5, 1.5)), track(new THREE.MeshBasicMaterial({ map: paperTex })));
    paper.rotation.x = -Math.PI / 2;
    paper.position.set(RX, 0.004, RZ);
    macro.add(paper);
    addShadow(macro, RX, RZ, 2.4);
    const rWall = new THREE.Mesh(track(new THREE.CylinderGeometry(RBEAKER_R, RBEAKER_R * 0.97, RBEAKER_H, 48, 1, true)), glassMat);
    rWall.position.set(RX, RBEAKER_H / 2, RZ);
    rWall.renderOrder = 4;
    macro.add(rWall);
    const rRim = new THREE.Mesh(track(new THREE.TorusGeometry(RBEAKER_R, 0.024, 10, 56)), rimMat);
    rRim.rotation.x = Math.PI / 2;
    rRim.position.set(RX, RBEAKER_H, RZ);
    macro.add(rRim);
    const rLiquidMat = track(new THREE.MeshPhysicalMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false }));
    const rLiquid = new THREE.Mesh(track(new THREE.CylinderGeometry(RBEAKER_R - 0.035, RBEAKER_R * 0.97 - 0.035, 1, 40, 1, false)), rLiquidMat);
    rLiquid.renderOrder = 2;
    rLiquid.visible = false;
    macro.add(rLiquid);
    const rSurface = new THREE.Mesh(track(new THREE.CircleGeometry(RBEAKER_R - 0.035, 40)), surfaceMat);
    rSurface.rotation.x = -Math.PI / 2;
    rSurface.renderOrder = 3;
    rSurface.visible = false;
    macro.add(rSurface);
    const sedimentMat = track(new THREE.MeshStandardMaterial({ color: 0xf3e3b5, transparent: true, opacity: 0, roughness: 0.9, depthWrite: false }));
    const sediment = new THREE.Mesh(track(new THREE.CircleGeometry(RBEAKER_R - 0.04, 40)), sedimentMat);
    sediment.rotation.x = -Math.PI / 2;
    sediment.position.set(RX, 0.03, RZ);
    sediment.renderOrder = 1;
    macro.add(sediment);
    // colloidal sulfur inside the liquid (volumetric turbidity)
    const colloidMat = track(new THREE.MeshStandardMaterial({ color: 0xfde68a, transparent: true, opacity: 0, roughness: 0.8, depthWrite: false }));
    const colloid: TInstanced = new THREE.InstancedMesh(track(new THREE.SphereGeometry(1, 7, 5)), colloidMat, MAX_COLLOID);
    colloid.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    colloid.frustumCulled = false;
    colloid.renderOrder = 2;
    macro.add(colloid);
    const cA = new Float32Array(MAX_COLLOID); // angle
    const cR = new Float32Array(MAX_COLLOID); // radius fraction
    const cY = new Float32Array(MAX_COLLOID); // height fraction
    const cS = new Float32Array(MAX_COLLOID); // size
    const cP = new Float32Array(MAX_COLLOID); // phase
    for (let i = 0; i < MAX_COLLOID; i++) {
      cA[i] = rand(0, Math.PI * 2);
      cR[i] = Math.sqrt(rand()) * 0.86;
      cY[i] = rand(0.05, 0.95);
      cS[i] = rand(0.018, 0.045);
      cP[i] = rand(0, Math.PI * 2);
      hideInstance(colloid, i);
    }
    colloid.instanceMatrix.needsUpdate = true;
    // pour stream
    const stream = new THREE.Mesh(track(new THREE.CylinderGeometry(0.035, 0.045, 1, 12, 1, false)), clearLiquidMat);
    stream.visible = false;
    stream.renderOrder = 2;
    macro.add(stream);

    // ================================================================ MICRO
    const microG: TGroup = new THREE.Group();
    microG.visible = false;
    scene.add(microG);
    const microFloor = new THREE.Mesh(
      track(new THREE.PlaneGeometry(6.4, 3.4)),
      track(new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.4, roughness: 0.2, depthWrite: false }))
    );
    microFloor.rotation.x = -Math.PI / 2;
    microFloor.position.y = MICRO_FLOOR_Y;
    microG.add(microFloor);
    const sMesh: TInstanced = new THREE.InstancedMesh(
      track(new THREE.SphereGeometry(S_R, 18, 14)),
      track(new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 })),
      S_COUNT
    );
    const hMesh: TInstanced = new THREE.InstancedMesh(
      track(new THREE.SphereGeometry(H_R, 14, 10)),
      track(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 })),
      H_COUNT
    );
    for (const m of [sMesh, hMesh]) {
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      microG.add(m);
    }
    const N = S_COUNT + H_COUNT;
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const setSpeed = (i: number, speed: number) => {
      const o = i * 3;
      const len = Math.hypot(vel[o], vel[o + 1], vel[o + 2]) || 1;
      vel[o] = (vel[o] / len) * speed;
      vel[o + 1] = (vel[o + 1] / len) * speed;
      vel[o + 2] = (vel[o + 2] / len) * speed;
    };
    const seedParticles = (tempC: number) => {
      const sp = particleSpeed(tempC);
      for (let i = 0; i < N; i++) {
        const o = i * 3;
        pos[o] = rand(-MICRO.x, MICRO.x);
        pos[o + 1] = rand(MICRO.yMin, MICRO.yMax);
        pos[o + 2] = rand(-MICRO.z, MICRO.z);
        vel[o] = rand(-1, 1);
        vel[o + 1] = rand(-1, 1);
        vel[o + 2] = rand(-1, 1);
        setSpeed(i, sp * rand(0.75, 1.25));
      }
    };
    const flashGeo = track(new THREE.SphereGeometry(0.09, 10, 8));
    const flashes = Array.from({ length: FLASH_POOL }, () => {
      const mat = track(new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0, depthWrite: false }));
      const m = new THREE.Mesh(flashGeo, mat);
      m.visible = false;
      microG.add(m);
      return { mesh: m as TMesh, mat, age: 0, active: false, effective: false };
    });
    let flashCursor = 0;
    const spawnFlash = (x: number, y: number, z: number, effective: boolean) => {
      const f = flashes[flashCursor++ % FLASH_POOL];
      f.active = true;
      f.age = 0;
      f.effective = effective;
      f.mat.color.set(effective ? 0xfbbf24 : 0x94a3b8);
      f.mesh.position.set(x, y, z);
      f.mesh.scale.setScalar(1);
      f.mesh.visible = true;
    };
    const productGeo = track(new THREE.SphereGeometry(PRODUCT_R, 10, 8));
    const products = Array.from({ length: PRODUCT_POOL }, () => {
      const mat = track(new THREE.MeshStandardMaterial({ color: 0xfcd34d, transparent: true, opacity: 0.9, roughness: 0.8 }));
      const m = new THREE.Mesh(productGeo, mat);
      m.visible = false;
      microG.add(m);
      return {
        mesh: m as TMesh,
        mat,
        active: false,
        settled: false,
        fallSpeed: 0,
        driftX: 0,
        driftZ: 0,
        settleY: MICRO_FLOOR_Y + PRODUCT_R,
      };
    });
    let productCursor = 0;
    const spawnProduct = (x: number, y: number, z: number) => {
      const p = products[productCursor++ % PRODUCT_POOL];
      p.active = true;
      p.settled = false;
      p.fallSpeed = rand(0.12, 0.22);
      p.driftX = rand(-0.08, 0.08);
      p.driftZ = rand(-0.08, 0.08);
      p.settleY = MICRO_FLOOR_Y + PRODUCT_R + rand(0, 0.025);
      p.mesh.position.set(x, y, z);
      p.mesh.scale.setScalar(rand(0.85, 1.2));
      p.mat.opacity = 0.9;
      p.mesh.visible = true;
    };

    // ---- state ----
    const stats: M3Stats = { effective: 0, ineffective: 0 };
    let statsDirty = false;
    let statsTimer = 0;
    let lastReset = shared.current.resetToken;
    let lastViewReset = shared.current.viewResetToken;
    let lastMicroTemp = shared.current.microTemp;
    seedParticles(lastMicroTemp);

    const resetDynamic = () => {
      for (const f of flashes) {
        f.active = false;
        f.mesh.visible = false;
      }
      for (const p of products) {
        p.active = false;
        p.settled = false;
        p.fallSpeed = 0;
        p.mesh.visible = false;
      }
      stats.effective = 0;
      stats.ineffective = 0;
      statsDirty = true;
    };

    // ---- camera (constrained orbit) ----
    const AZ0 = 0.38;
    const orbit = { az: AZ0, dist: 6.9, polar: 1.1, tx: -0.35, ty: 0.7, tz: 0.3, userUntil: 0, dragging: false, lastX: 0 };
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

    const liquidClear = new THREE.Color(0xdff3ff);
    const liquidCloudy = new THREE.Color(0xf3e8c4);
    const tmpColor = new THREE.Color();

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const s = shared.current;

      if (s.resetToken !== lastReset) {
        lastReset = s.resetToken;
        resetDynamic();
      }
      if (s.viewResetToken !== lastViewReset) {
        lastViewReset = s.viewResetToken;
        orbit.az = AZ0;
        orbit.userUntil = 0;
      }
      if (s.microTemp !== lastMicroTemp) {
        lastMicroTemp = s.microTemp;
        seedParticles(lastMicroTemp);
        resetDynamic();
      }

      macro.visible = !s.micro;
      microG.visible = s.micro;
      const mixtureReady = s.phase === "reacting" || s.phase === "done";
      sMesh.visible = mixtureReady;
      hMesh.visible = mixtureReady;

      // ---------- MACRO ----------
      if (!s.micro) {
        // thermometers + plate indicator
        thermoA.draw(`${s.tempA.toFixed(1)} °C`);
        thermoB.draw(`${s.tempB.toFixed(1)} °C`);
        const heating = s.phase === "heating";
        const warming = s.temperature > ROOM_T;
        plateDisplay.draw(`${Math.round(s.temperature)} °C ${heating ? (warming ? "▲" : "▼") : ""}`.trim());
        if (heating) {
          ringMat.color.set(warming ? 0xef4444 : 0x38bdf8);
          ringMat.emissive.set(warming ? 0x7f1d1d : 0x0c4a6e);
        } else if (s.phase === "ready") {
          ringMat.color.set(0x22c55e);
          ringMat.emissive.set(0x052e16);
        } else {
          ringMat.color.set(0x64748b);
          ringMat.emissive.set(0x000000);
        }

        // pouring choreography (deterministic from pourProgress)
        const q = s.phase === "pouring" ? s.pourProgress : s.phase === "idle" || s.phase === "heating" || s.phase === "ready" ? 0 : 1;
        const poured = s.phase === "reacting" || s.phase === "done";
        let rLevel = poured ? 1 : 0;
        stream.visible = false;
        const animateBeaker = (b: typeof beakerA, homeX: number, u: number, base: number) => {
          // u ∈ [0,1]: 0–0.3 move & tilt, 0.3–0.8 pour, 0.8–1 return
          const g = b.group;
          let move = 0;
          let liquidFrac = 1;
          if (u <= 0) {
            move = 0;
          } else if (u < 0.3) {
            move = easeInOut(u / 0.3);
          } else if (u < 0.8) {
            move = 1;
            const k = (u - 0.3) / 0.5;
            liquidFrac = 1 - k;
            rLevel = base + 0.5 * k;
            stream.visible = true;
          } else if (u < 1) {
            move = 1 - easeInOut((u - 0.8) / 0.2);
            liquidFrac = 0;
            rLevel = base + 0.5;
          } else {
            move = 0;
            liquidFrac = 0;
          }
          g.position.set(lerp(homeX, POUR_POS.x, move), lerp(PLATE_TOP + 0.03, POUR_POS.y, move), lerp(PLATE_Z, POUR_POS.z, move));
          g.rotation.z = POUR_TILT * move;
          const lh = Math.max(0.001, LIQ_H * liquidFrac);
          b.liquid.scale.set(1, lh, 1);
          b.liquid.position.y = lh / 2 + 0.01;
          b.liquid.visible = liquidFrac > 0.01;
          b.surface.position.y = lh + 0.012;
          b.surface.visible = liquidFrac > 0.01;
        };
        if (poured) {
          animateBeaker(beakerA, AX, 1, 0);
          animateBeaker(beakerB, BX, 1, 0.5);
          rLevel = 1;
        } else if (s.phase === "pouring") {
          const uA = clamp01(q / 0.5);
          const uB = clamp01((q - 0.5) / 0.5);
          animateBeaker(beakerA, AX, uA, 0);
          if (q >= 0.5) animateBeaker(beakerB, BX, uB, 0.5);
          else animateBeaker(beakerB, BX, 0, 0.5);
          if (uA >= 1 && uB <= 0) rLevel = 0.5;
        } else {
          animateBeaker(beakerA, AX, 0, 0);
          animateBeaker(beakerB, BX, 0, 0.5);
          rLevel = 0;
        }
        // stream geometry: from the tilted lip down to the reaction liquid surface
        const rH = R_LIQ_MAX_H * rLevel;
        if (stream.visible) {
          const lipY = POUR_POS.y - 0.14;
          const top = lipY;
          const bottom = 0.02 + rH;
          const len = Math.max(0.05, top - bottom);
          stream.scale.set(1, len, 1);
          stream.position.set(RX, bottom + len / 2, RZ);
        }
        // reaction liquid + turbidity (volumetric: material, colloid, sediment)
        const t = Math.min(1.3, Math.max(0, s.turbidity));
        const tv = clamp01(t);
        if (rLevel > 0.01) {
          rLiquid.visible = true;
          rSurface.visible = true;
          rLiquid.scale.set(1, rH, 1);
          rLiquid.position.set(RX, 0.02 + rH / 2, RZ);
          rSurface.position.set(RX, 0.02 + rH + 0.002, RZ);
          tmpColor.copy(liquidClear).lerp(liquidCloudy, tv);
          rLiquidMat.color.copy(tmpColor);
          rLiquidMat.opacity = lerp(0.35, 0.97, Math.pow(tv, 0.8));
          rLiquidMat.roughness = lerp(0.1, 0.6, tv);
        } else {
          rLiquid.visible = false;
          rSurface.visible = false;
        }
        sedimentMat.opacity = clamp01((t - 0.35) / 0.65) * 0.95;
        const visibleColloid = rLevel > 0.5 ? Math.floor(MAX_COLLOID * Math.min(1, tv * 1.15)) : 0;
        colloidMat.opacity = Math.min(1, tv * 1.4);
        for (let i = 0; i < MAX_COLLOID; i++) {
          if (i >= visibleColloid) {
            hideInstance(colloid, i);
            continue;
          }
          cP[i] += dt * 0.6;
          const rr = cR[i] * (RBEAKER_R - 0.07);
          const x = RX + Math.cos(cA[i] + Math.sin(cP[i]) * 0.05) * rr;
          const z = RZ + Math.sin(cA[i] + Math.sin(cP[i]) * 0.05) * rr;
          const y = 0.05 + cY[i] * (rH - 0.08) + Math.sin(cP[i] * 1.3) * 0.01;
          dummy.position.set(x, y, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(cS[i] * (0.6 + 0.4 * tv));
          dummy.updateMatrix();
          colloid.setMatrixAt(i, dummy.matrix);
        }
        colloid.instanceMatrix.needsUpdate = true;
      }

      // ---------- MICRO ----------
      if (s.micro && mixtureReady) {
        const speed = particleSpeed(s.microTemp);
        const pEff = effectiveChance(s.microTemp);
        for (let i = 0; i < N; i++) {
          const o = i * 3;
          // smooth random motion: gently perturb direction, keep speed
          vel[o] += rand(-1, 1) * 0.9 * dt;
          vel[o + 1] += rand(-1, 1) * 0.9 * dt;
          vel[o + 2] += rand(-1, 1) * 0.9 * dt;
          setSpeed(i, speed * (0.85 + 0.3 * ((i * 7919) % 100) / 100));
          pos[o] += vel[o] * dt;
          pos[o + 1] += vel[o + 1] * dt;
          pos[o + 2] += vel[o + 2] * dt;
          if (pos[o] < -MICRO.x || pos[o] > MICRO.x) {
            vel[o] *= -1;
            pos[o] = Math.max(-MICRO.x, Math.min(MICRO.x, pos[o]));
          }
          if (pos[o + 1] < MICRO.yMin || pos[o + 1] > MICRO.yMax) {
            vel[o + 1] *= -1;
            pos[o + 1] = Math.max(MICRO.yMin, Math.min(MICRO.yMax, pos[o + 1]));
          }
          if (pos[o + 2] < -MICRO.z || pos[o + 2] > MICRO.z) {
            vel[o + 2] *= -1;
            pos[o + 2] = Math.max(-MICRO.z, Math.min(MICRO.z, pos[o + 2]));
          }
        }
        // S₂O₃²⁻ – H⁺ encounters
        for (let i = 0; i < S_COUNT; i++) {
          const oi = i * 3;
          for (let j = S_COUNT; j < N; j++) {
            const oj = j * 3;
            const dx = pos[oj] - pos[oi];
            const dy = pos[oj + 1] - pos[oi + 1];
            const dz = pos[oj + 2] - pos[oi + 2];
            const d2 = dx * dx + dy * dy + dz * dz;
            const rr = S_R + H_R;
            if (d2 < rr * rr) {
              const d = Math.sqrt(d2) || 1e-6;
              const nx = dx / d;
              const ny = dy / d;
              const nz = dz / d;
              // separate and reflect the H⁺ along the normal
              pos[oj] = pos[oi] + nx * (rr + 0.002);
              pos[oj + 1] = pos[oi + 1] + ny * (rr + 0.002);
              pos[oj + 2] = pos[oi + 2] + nz * (rr + 0.002);
              const vdot = vel[oj] * nx + vel[oj + 1] * ny + vel[oj + 2] * nz;
              if (vdot < 0) {
                vel[oj] -= 2 * vdot * nx;
                vel[oj + 1] -= 2 * vdot * ny;
                vel[oj + 2] -= 2 * vdot * nz;
              }
              const cx = pos[oi] + nx * S_R;
              const cy = pos[oi + 1] + ny * S_R;
              const cz = pos[oi + 2] + nz * S_R;
              const effective = Math.random() < pEff;
              spawnFlash(cx, cy, cz, effective);
              if (effective) {
                stats.effective++;
                spawnProduct(cx, cy, cz);
              } else {
                stats.ineffective++;
              }
              statsDirty = true;
            }
          }
        }
        for (let i = 0; i < N; i++) {
          const o = i * 3;
          dummy.position.set(pos[o], pos[o + 1], pos[o + 2]);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          if (i < S_COUNT) sMesh.setMatrixAt(i, dummy.matrix);
          else hMesh.setMatrixAt(i - S_COUNT, dummy.matrix);
        }
        sMesh.instanceMatrix.needsUpdate = true;
        hMesh.instanceMatrix.needsUpdate = true;

        for (const f of flashes) {
          if (!f.active) continue;
          f.age += dt;
          const life = f.effective ? 0.55 : 0.35;
          if (f.age >= life) {
            f.active = false;
            f.mesh.visible = false;
            continue;
          }
          const k = f.age / life;
          f.mesh.scale.setScalar(1 + k * (f.effective ? 2.6 : 1.4));
          f.mat.opacity = (1 - k) * (f.effective ? 1 : 0.7);
        }
        for (const p of products) {
          if (!p.active) continue;
          if (!p.settled) {
            p.fallSpeed = Math.min(0.9, p.fallSpeed + 0.42 * dt);
            p.mesh.position.x += p.driftX * dt;
            p.mesh.position.y -= p.fallSpeed * dt;
            p.mesh.position.z += p.driftZ * dt;
            p.driftX *= Math.exp(-dt * 1.8);
            p.driftZ *= Math.exp(-dt * 1.8);
            if (p.mesh.position.y <= p.settleY) {
              p.mesh.position.y = p.settleY;
              p.fallSpeed = 0;
              p.driftX = 0;
              p.driftZ = 0;
              p.settled = true;
            }
          }
          p.mat.opacity = p.settled ? 1 : 0.9;
        }
        statsTimer += dt;
        if (statsDirty && statsTimer >= 0.25) {
          statsTimer = 0;
          statsDirty = false;
          onStatsRef.current?.({ ...stats });
        }
      }

      // ---------- CAMERA ----------
      const zoom = Math.min(1.6, Math.max(0.65, s.zoom || 1));
      const narrow = aspect < 1 ? 1.12 : 1;
      const want = s.micro
        ? { dist: 6.0, polar: 1.15, tx: 0, ty: 1.15, tz: 0 }
        : s.topView
          ? { dist: 3.4 * zoom, polar: 0.06, tx: RX, ty: 0.45, tz: RZ }
          : { dist: 6.9 * narrow * zoom, polar: 1.1, tx: -0.35, ty: 0.7, tz: 0.3 };
      const kc = 1 - Math.exp(-dt * 4.5);
      orbit.dist += (want.dist - orbit.dist) * kc;
      orbit.polar += (want.polar - orbit.polar) * kc;
      orbit.tx += (want.tx - orbit.tx) * kc;
      orbit.ty += (want.ty - orbit.ty) * kc;
      orbit.tz += (want.tz - orbit.tz) * kc;
      const idlePhase = s.phase === "idle" || s.phase === "done";
      if (!s.micro && !s.topView && idlePhase && now > orbit.userUntil && !orbit.dragging) {
        orbit.az += dt * 0.08;
      }
      const sp = Math.sin(orbit.polar);
      camera.position.set(
        orbit.tx + orbit.dist * sp * Math.sin(orbit.az),
        orbit.ty + orbit.dist * Math.cos(orbit.polar),
        orbit.tz + orbit.dist * sp * Math.cos(orbit.az)
      );
      camera.lookAt(orbit.tx, orbit.ty, orbit.tz);

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
    const dots = Array.from({ length: 30 }, (_, i) => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, big: i < 10 }));
    const fallbackProducts = Array.from({ length: 32 }, () => ({
      x: 0,
      y: 0,
      vy: 0,
      active: false,
      settled: false,
    }));
    let productCursor = 0;
    let productClock = 0;
    let lastReset = shared.current.resetToken;
    let raf = 0;
    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = shared.current;
      if (s.resetToken !== lastReset) {
        lastReset = s.resetToken;
        productClock = 0;
        for (const p of fallbackProducts) p.active = false;
      }
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
        const base = H * 0.8;
        const drawBeaker = (x: number, w: number, h: number, fill: string, level: number) => {
          ctx.fillStyle = fill;
          ctx.fillRect(x - w / 2 + 3, base - h * level, w - 6, h * level);
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 3;
          ctx.strokeRect(x - w / 2, base - h, w, h);
        };
        const poured = s.phase === "reacting" || s.phase === "done";
        drawBeaker(W * 0.2, 60, 90, "rgba(186,230,253,0.6)", poured ? 0 : 0.6);
        drawBeaker(W * 0.4, 60, 90, "rgba(186,230,253,0.6)", poured ? 0 : 0.6);
        // X paper
        ctx.fillStyle = "#fff";
        ctx.fillRect(W * 0.72 - 55, base - 4, 110, 12);
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(W * 0.72 - 18, base - 2);
        ctx.lineTo(W * 0.72 + 18, base + 6);
        ctx.moveTo(W * 0.72 + 18, base - 2);
        ctx.lineTo(W * 0.72 - 18, base + 6);
        ctx.stroke();
        const t = Math.min(1, s.turbidity);
        drawBeaker(W * 0.72, 80, 110, `rgba(243,232,196,${0.15 + 0.85 * t})`, poured ? 0.75 : s.phase === "pouring" ? 0.75 * s.pourProgress : 0);
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${s.tempA.toFixed(1)} °C`, W * 0.2, base - 100);
        ctx.fillText(`${s.tempB.toFixed(1)} °C`, W * 0.4, base - 100);
      } else if (s.phase === "reacting" || s.phase === "done") {
        const sp = particleSpeed(s.microTemp) * 0.12;
        for (const d of dots) {
          d.x += d.vx * sp * dt * 4;
          d.y += d.vy * sp * dt * 4;
          if (d.x < 0.02 || d.x > 0.98) d.vx *= -1;
          if (d.y < 0.05 || d.y > 0.9) d.vy *= -1;
          ctx.fillStyle = d.big ? "#2563eb" : "#ef4444";
          ctx.beginPath();
          ctx.arc(d.x * W, d.y * H, d.big ? 9 : 5, 0, Math.PI * 2);
          ctx.fill();
        }
        const formationRate = 0.7 + clamp01((s.microTemp - 10) / 50) * 1.5;
        productClock += dt * formationRate;
        while (productClock >= 1) {
          productClock -= 1;
          const p = fallbackProducts[productCursor++ % fallbackProducts.length];
          p.x = rand(0.12, 0.88);
          p.y = rand(0.12, 0.55);
          p.vy = rand(0.08, 0.14);
          p.active = true;
          p.settled = false;
        }
        for (const p of fallbackProducts) {
          if (!p.active) continue;
          if (!p.settled) {
            p.vy = Math.min(0.42, p.vy + 0.16 * dt);
            p.y += p.vy * dt;
            if (p.y >= 0.9) {
              p.y = 0.9;
              p.vy = 0;
              p.settled = true;
            }
          }
          ctx.fillStyle = "#facc15";
          ctx.strokeStyle = "#ca8a04";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x * W, p.y * H, p.settled ? 5 : 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
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
        "relative h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,#ffffff_0%,#f1f6fb_55%,#e2ebf5_100%)] " +
        (className ?? "")
      }
    >
      {micro && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 [background:radial-gradient(ellipse_at_center,rgba(255,255,255,0)_58%,rgba(226,232,240,0.85)_100%)]"
          />
          {phase !== "reacting" && phase !== "done" && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4">
              <span className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-bold text-slate-500 shadow-sm backdrop-blur">
                Larutan belum dicampurkan
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
});
