"use client";

// Module 1 — 3D scene (Three.js).
//
// Macroscopic view : test tube with a fixed volume of HCl, a Mg ribbon that is
//                    dropped in and shrinks, and H₂ bubbles whose count and
//                    speed follow the HCl concentration.
// "Perbesar" view  : submicroscopic model — H⁺ ions (and spectator Cl⁻) moving
//                    above a Mg surface; collisions with the surface are marked
//                    as effective (yellow) or ineffective (grey) and counted.
//
// Mobile-first: no shadow maps, instanced bubbles/ions, capped pixel ratio,
// render loop paused when the stage is off-screen or the tab is hidden, and a
// horizontal-drag rotation that never blocks vertical page scrolling
// (canvas uses touch-action: pan-y). Falls back to a 2D canvas without WebGL.

import {
  memo,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import * as THREE from "three";

export interface M1SimShared {
  concentration: number; // M (0.5–3.0)
  maxConcentration: number;
  progress: number; // 0..1 — fraction of Mg consumed
  inserted: boolean; // Mg has been dropped into the tube
  reacting: boolean; // inserted && progress < 1
  finished: boolean; // progress >= 1
  micro: boolean; // "Perbesar" mode active
  resetToken: number; // bump to clear bubbles, flashes and counters
}

export interface CollisionStats {
  effective: number;
  ineffective: number;
}

interface Props {
  shared: MutableRefObject<M1SimShared>;
  micro: boolean;
  onStats?: (stats: CollisionStats) => void;
  className?: string;
}

// ---- geometry constants (scene units) ----
const TUBE_R = 0.55;
const TUBE_H = 3.2; // from y=0 (bottom of straight wall) to y=3.2 (rim)
const LIQ_R = 0.5;
const LIQUID_TOP = 1.45;
const RIBBON_H = 1.3;
const RIBBON_REST_Y = 0.2;
const RIBBON_DROP_Y = 3.15;
const INSERT_SEC = 0.7;

const MAX_BUBBLES = 240;
const MAX_IONS = 40;
const FLASH_POOL = 24;
const H2_POOL = 14;
const MG_COLS = 7;
const MG_ROWS = 4;
const MG_COUNT = MG_COLS * MG_ROWS;
const MICRO_FLOOR = 0.32; // y where ions meet the Mg surface
const MICRO = { x: 2.0, yMin: MICRO_FLOOR + 0.06, yMax: 2.9, z: 1.2 };
const P_EFFECTIVE = 0.42;

type TObject = InstanceType<typeof THREE.Object3D>;
type TMesh = InstanceType<typeof THREE.Mesh>;
type TInstanced = InstanceType<typeof THREE.InstancedMesh>;
type TMaterial = InstanceType<typeof THREE.Material>;

function rand(a = 0, b = 1) {
  return a + Math.random() * (b - a);
}
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
}
function ionCount(c: number) {
  return Math.min(MAX_IONS, Math.max(4, Math.round(6 + 9 * c)));
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
const MG_REMOVAL_ORDER: number[] = (() => {
  const random = mulberry32(0x5fd319a1);
  const idx = Array.from({ length: MG_COUNT }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
})();

export default memo(function M1Scene3D({ shared, micro, onStats, className }: Props) {
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
    canvas.style.touchAction = "pan-y"; // vertical page scroll stays native
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "Simulasi 3D reaksi pita magnesium dengan larutan HCl; geser mendatar untuk memutar"
    );
    host.appendChild(canvas);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(o: T): T => {
      disposables.push(o);
      return o;
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);

    // ---- lights ----
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfdbfe, 2.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(4, 7, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x93c5fd, 0.9);
    fill.position.set(-5, 2, -3);
    scene.add(fill);

    // ================================================================ MACRO
    const macro = new THREE.Group();
    scene.add(macro);

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
    const tubeWall = new THREE.Mesh(
      track(new THREE.CylinderGeometry(TUBE_R, TUBE_R, TUBE_H, 48, 1, true)),
      glassMat
    );
    tubeWall.position.y = TUBE_H / 2;
    tubeWall.renderOrder = 4;
    macro.add(tubeWall);
    const tubeBottom = new THREE.Mesh(
      track(new THREE.SphereGeometry(TUBE_R, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)),
      glassMat
    );
    tubeBottom.renderOrder = 4;
    macro.add(tubeBottom);
    const rim = new THREE.Mesh(
      track(new THREE.TorusGeometry(TUBE_R, 0.035, 12, 64)),
      track(
        new THREE.MeshPhysicalMaterial({
          color: 0xe0f2fe,
          transparent: true,
          opacity: 0.7,
          roughness: 0.1,
          clearcoat: 1,
        })
      )
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = TUBE_H;
    macro.add(rim);

    // liquid (constant volume; colourless HCl gets a faint tint for legibility)
    const liquidMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.42,
        roughness: 0.12,
        depthWrite: false,
      })
    );
    const liquidBody = new THREE.Mesh(
      track(new THREE.CylinderGeometry(LIQ_R, LIQ_R, LIQUID_TOP, 40, 1, false)),
      liquidMat
    );
    liquidBody.position.y = LIQUID_TOP / 2;
    liquidBody.renderOrder = 1;
    macro.add(liquidBody);
    const liquidBottom = new THREE.Mesh(
      track(new THREE.SphereGeometry(LIQ_R, 36, 18, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)),
      liquidMat
    );
    liquidBottom.renderOrder = 1;
    macro.add(liquidBottom);
    const surface = new THREE.Mesh(
      track(new THREE.CircleGeometry(LIQ_R, 40)),
      track(
        new THREE.MeshPhysicalMaterial({
          color: 0xe0f2fe,
          transparent: true,
          opacity: 0.55,
          roughness: 0.05,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      )
    );
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = LIQUID_TOP;
    surface.renderOrder = 2;
    macro.add(surface);

    // stand: base, rod, clamp ring
    const standMat = track(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.3 }));
    const base = new THREE.Mesh(track(new THREE.CylinderGeometry(1.05, 1.15, 0.12, 48)), standMat);
    base.position.set(0.55, -TUBE_R - 0.32, 0);
    macro.add(base);
    const rod = new THREE.Mesh(track(new THREE.CylinderGeometry(0.05, 0.05, 4.4, 16)), standMat);
    rod.position.set(1.35, 1.35, 0);
    macro.add(rod);
    const arm = new THREE.Mesh(track(new THREE.BoxGeometry(0.75, 0.07, 0.07)), standMat);
    arm.position.set(0.98, 2.35, 0);
    macro.add(arm);
    const clamp = new THREE.Mesh(track(new THREE.TorusGeometry(TUBE_R + 0.06, 0.045, 10, 48)), standMat);
    clamp.rotation.x = Math.PI / 2;
    clamp.position.y = 2.35;
    macro.add(clamp);
    // soft fake shadow under the tube
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext("2d");
    if (sctx) {
      const g = sctx.createRadialGradient(64, 64, 4, 64, 64, 62);
      g.addColorStop(0, "rgba(15,23,42,0.35)");
      g.addColorStop(1, "rgba(15,23,42,0)");
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = track(new THREE.CanvasTexture(shadowCanvas));
    const shadow = new THREE.Mesh(
      track(new THREE.PlaneGeometry(2.6, 2.6)),
      track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }))
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0.55, -TUBE_R - 0.25, 0);
    macro.add(shadow);

    // Mg ribbon
    const ribbonMat = track(new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.32 }));
    const ribbon = new THREE.Mesh(track(new THREE.BoxGeometry(0.13, RIBBON_H, 0.032)), ribbonMat);
    ribbon.rotation.set(0.12, 0.35, 0.26);
    ribbon.position.set(0.1, RIBBON_DROP_Y, 0.05);
    ribbon.visible = false;
    macro.add(ribbon);

    // H₂ bubbles (instanced)
    const bubbleMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        roughness: 0.08,
        clearcoat: 1,
        depthWrite: false,
      })
    );
    const bubbles: TInstanced = new THREE.InstancedMesh(
      track(new THREE.SphereGeometry(1, 8, 6)),
      bubbleMat,
      MAX_BUBBLES
    );
    bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    bubbles.frustumCulled = false;
    bubbles.renderOrder = 3;
    macro.add(bubbles);
    const bAlive = new Uint8Array(MAX_BUBBLES);
    const bX = new Float32Array(MAX_BUBBLES);
    const bY = new Float32Array(MAX_BUBBLES);
    const bZ = new Float32Array(MAX_BUBBLES);
    const bVy = new Float32Array(MAX_BUBBLES);
    const bR = new Float32Array(MAX_BUBBLES);
    const bPhase = new Float32Array(MAX_BUBBLES);
    const dummy: TObject = new THREE.Object3D();
    const hideInstance = (mesh: TInstanced, i: number) => {
      dummy.position.set(0, -50, 0);
      dummy.scale.setScalar(0.0001);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    };
    for (let i = 0; i < MAX_BUBBLES; i++) hideInstance(bubbles, i);
    bubbles.instanceMatrix.needsUpdate = true;

    // ================================================================ MICRO
    const microG = new THREE.Group();
    microG.visible = false;
    scene.add(microG);

    // faint glass floor + Mg slab
    const floor = new THREE.Mesh(
      track(new THREE.PlaneGeometry(6.4, 3.6)),
      track(new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.35, roughness: 0.2, depthWrite: false }))
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.62;
    microG.add(floor);
    const slabBase = new THREE.Mesh(
      track(new THREE.BoxGeometry(MG_COLS * 0.55 + 0.35, 0.34, MG_ROWS * 0.55 + 0.35)),
      track(new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.4 }))
    );
    slabBase.position.y = -0.32;
    microG.add(slabBase);
    const atomGeo = track(new THREE.SphereGeometry(0.26, 18, 14));
    const atomMat = track(new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.3 }));
    const atoms: TMesh[] = [];
    for (let i = 0; i < MG_COUNT; i++) {
      const col = i % MG_COLS;
      const row = Math.floor(i / MG_COLS);
      const m = new THREE.Mesh(atomGeo, atomMat);
      m.position.set((col - (MG_COLS - 1) / 2) * 0.55, 0.06, (row - (MG_ROWS - 1) / 2) * 0.55);
      microG.add(m);
      atoms.push(m);
    }

    // ions (instanced): H⁺ red, Cl⁻ cyan (spectator)
    const hMesh: TInstanced = new THREE.InstancedMesh(
      track(new THREE.SphereGeometry(0.11, 14, 10)),
      track(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.05 })),
      MAX_IONS
    );
    const clMesh: TInstanced = new THREE.InstancedMesh(
      track(new THREE.SphereGeometry(0.15, 14, 10)),
      track(new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.4, metalness: 0.05 })),
      MAX_IONS
    );
    for (const m of [hMesh, clMesh]) {
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      microG.add(m);
    }
    const ionPos = new Float32Array(MAX_IONS * 2 * 3);
    const ionVel = new Float32Array(MAX_IONS * 2 * 3);
    let ionActive = 0;
    const seedIon = (i: number, fromTop = false) => {
      const o = i * 3;
      ionPos[o] = rand(-MICRO.x, MICRO.x);
      ionPos[o + 1] = fromTop ? rand(MICRO.yMax - 0.5, MICRO.yMax) : rand(MICRO.yMin, MICRO.yMax);
      ionPos[o + 2] = rand(-MICRO.z, MICRO.z);
      const speed = rand(1.35, 2.1); // constant temperature → same speed range
      const th = rand(0, Math.PI * 2);
      const ph = rand(-1, 1);
      const horiz = Math.sqrt(1 - ph * ph);
      ionVel[o] = Math.cos(th) * horiz * speed;
      ionVel[o + 1] = (fromTop ? -Math.abs(ph) - 0.2 : ph) * speed;
      ionVel[o + 2] = Math.sin(th) * horiz * speed;
    };
    const reseedIons = (c: number) => {
      ionActive = ionCount(c);
      for (let i = 0; i < MAX_IONS * 2; i++) seedIon(i);
    };

    // collision flashes (pool)
    const flashGeo = track(new THREE.RingGeometry(0.1, 0.19, 28));
    const flashes = Array.from({ length: FLASH_POOL }, () => {
      const mat = track(new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      const m = new THREE.Mesh(flashGeo, mat);
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      microG.add(m);
      return { mesh: m as TMesh, mat, age: 0, active: false, effective: false };
    });
    let flashCursor = 0;
    const spawnFlash = (x: number, z: number, effective: boolean) => {
      const f = flashes[flashCursor++ % FLASH_POOL];
      f.active = true;
      f.age = 0;
      f.effective = effective;
      f.mat.color.set(effective ? 0xfbbf24 : 0x94a3b8);
      f.mesh.position.set(x, MICRO_FLOOR + 0.02, z);
      f.mesh.visible = true;
    };

    // H₂ molecules (pool)
    const h2Geo = track(new THREE.SphereGeometry(0.085, 12, 10));
    const h2Mat = track(new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.3 }));
    const bondGeo = track(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8));
    const h2s = Array.from({ length: H2_POOL }, () => {
      const g = new THREE.Group();
      const a = new THREE.Mesh(h2Geo, h2Mat);
      a.position.x = -0.1;
      const b = new THREE.Mesh(h2Geo, h2Mat);
      b.position.x = 0.1;
      const bond = new THREE.Mesh(bondGeo, h2Mat);
      bond.rotation.z = Math.PI / 2;
      g.add(a, b, bond);
      g.visible = false;
      microG.add(g);
      return { group: g as TObject, active: false, vy: 1.2, drift: 0, spin: 0 };
    });
    let h2Cursor = 0;
    const spawnH2 = (x: number, z: number) => {
      const h = h2s[h2Cursor++ % H2_POOL];
      h.active = true;
      h.group.visible = true;
      h.group.position.set(x, MICRO_FLOOR + 0.15, z);
      h.group.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
      h.vy = rand(1.0, 1.5);
      h.drift = rand(-0.35, 0.35);
      h.spin = rand(-2, 2);
    };

    // ---- state ----
    const stats: CollisionStats = { effective: 0, ineffective: 0 };
    let statsDirty = false;
    let statsTimer = 0;
    let lastReset = shared.current.resetToken;
    let lastConc = shared.current.concentration;
    let insertStart = -1;
    let spawnAcc = 0;
    reseedIons(lastConc);

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
      for (const h of h2s) {
        h.active = false;
        h.group.visible = false;
      }
      stats.effective = 0;
      stats.ineffective = 0;
      statsDirty = true;
      insertStart = -1;
      spawnAcc = 0;
      reseedIons(shared.current.concentration);
    };

    // ---- camera orbit (horizontal drag; vertical gestures scroll the page) ----
    const orbit = { az: 0.42, dist: 7.5, polar: 1.42, ty: 1.3, userUntil: 0, dragging: false, lastX: 0 };
    const onDown = (e: PointerEvent) => {
      orbit.dragging = true;
      orbit.lastX = e.clientX;
      orbit.userUntil = performance.now() + 4000;
    };
    const onMove = (e: PointerEvent) => {
      if (!orbit.dragging) return;
      const dx = e.clientX - orbit.lastX;
      orbit.lastX = e.clientX;
      orbit.az += dx * 0.007;
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

    // ---- sizing ----
    let aspect = 1;
    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      aspect = w / h;
      camera.aspect = aspect;
      camera.fov = aspect < 1 ? 40 : 33;
      camera.updateProjectionMatrix();
      gl.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    // ---- visibility gating ----
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

    // ---- frame update ----
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const s = shared.current;

      if (s.resetToken !== lastReset) {
        lastReset = s.resetToken;
        resetDynamic();
      }
      if (s.concentration !== lastConc) {
        lastConc = s.concentration;
        reseedIons(lastConc);
      }
      const c = s.concentration;

      macro.visible = !s.micro;
      microG.visible = s.micro;

      // ---------- MACRO ----------
      if (!s.micro) {
        // ribbon insertion + shrinking
        if (s.inserted) {
          if (insertStart < 0) insertStart = now;
          const k = easeOutCubic((now - insertStart) / 1000 / INSERT_SEC);
          const p = s.progress;
          ribbon.visible = !s.finished;
          ribbon.position.y = RIBBON_DROP_Y + (RIBBON_REST_Y - 0.28 * p - RIBBON_DROP_Y) * k;
          ribbon.scale.set(1 - 0.55 * p, Math.max(0.03, 1 - 0.93 * p), 1 - 0.55 * p);
        } else {
          insertStart = -1;
          ribbon.visible = false;
        }
        // bubbles
        const settled = s.inserted && insertStart > 0 && now - insertStart >= INSERT_SEC * 1000;
        if (s.reacting && settled) {
          spawnAcc += (5 + 16 * c) * dt;
          while (spawnAcc >= 1) {
            spawnAcc -= 1;
            let slot = -1;
            for (let i = 0; i < MAX_BUBBLES; i++) {
              if (!bAlive[i]) {
                slot = i;
                break;
              }
            }
            if (slot < 0) break;
            const p = s.progress;
            const h = RIBBON_H * (1 - 0.93 * p);
            const cy = RIBBON_REST_Y - 0.28 * p;
            const t = Math.random();
            bAlive[slot] = 1;
            bX[slot] = ribbon.position.x + (t - 0.5) * h * Math.sin(0.26) + rand(-0.09, 0.09);
            bY[slot] = cy + (t - 0.5) * h * Math.cos(0.26);
            bZ[slot] = ribbon.position.z + rand(-0.09, 0.09);
            bR[slot] = 0.022 + rand(0, 0.03) + 0.008 * c;
            bVy[slot] = 0.5 + 0.22 * c + rand(0, 0.35);
            bPhase[slot] = rand(0, Math.PI * 2);
          }
        }
        let anyBubble = false;
        for (let i = 0; i < MAX_BUBBLES; i++) {
          if (!bAlive[i]) continue;
          anyBubble = true;
          bY[i] += bVy[i] * dt;
          bPhase[i] += dt * 6;
          const wobble = Math.sin(bPhase[i]) * 0.01;
          const rMax = LIQ_R - bR[i] - 0.02;
          const x = Math.max(-rMax, Math.min(rMax, bX[i] + wobble));
          if (bY[i] + bR[i] >= LIQUID_TOP) {
            bAlive[i] = 0;
            hideInstance(bubbles, i);
            continue;
          }
          dummy.position.set(x, bY[i], bZ[i]);
          dummy.scale.setScalar(bR[i]);
          dummy.updateMatrix();
          bubbles.setMatrixAt(i, dummy.matrix);
        }
        if (anyBubble || spawnAcc > 0) bubbles.instanceMatrix.needsUpdate = true;
      }

      // ---------- MICRO ----------
      if (s.micro) {
        const slabActive = s.inserted && !s.finished;
        slabBase.visible = slabActive;
        const removed = slabActive ? Math.floor(s.progress * MG_COUNT) : MG_COUNT;
        for (let i = 0; i < MG_COUNT; i++) atoms[MG_REMOVAL_ORDER[i]].visible = slabActive && i >= removed;
        const floorY = slabActive ? MICRO.yMin : -0.45;

        for (let i = 0; i < MAX_IONS * 2; i++) {
          const isH = i < MAX_IONS;
          const idx = isH ? i : i - MAX_IONS;
          const mesh = isH ? hMesh : clMesh;
          if (idx >= ionActive) {
            hideInstance(mesh, idx);
            continue;
          }
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
          if (ionPos[o + 1] < floorY) {
            if (isH && slabActive) {
              const effective = Math.random() < P_EFFECTIVE;
              spawnFlash(ionPos[o], ionPos[o + 2], effective);
              if (effective) {
                stats.effective++;
                spawnH2(ionPos[o], ionPos[o + 2]);
                seedIon(i, true); // consumed H⁺ replaced (HCl in excess)
              } else {
                stats.ineffective++;
                ionVel[o + 1] = Math.abs(ionVel[o + 1]);
                ionPos[o + 1] = floorY;
              }
              statsDirty = true;
            } else {
              ionVel[o + 1] = Math.abs(ionVel[o + 1]);
              ionPos[o + 1] = floorY;
            }
          }
          dummy.position.set(ionPos[o], ionPos[o + 1], ionPos[o + 2]);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          mesh.setMatrixAt(idx, dummy.matrix);
        }
        hMesh.instanceMatrix.needsUpdate = true;
        clMesh.instanceMatrix.needsUpdate = true;

        for (const f of flashes) {
          if (!f.active) continue;
          f.age += dt;
          const life = f.effective ? 0.6 : 0.4;
          if (f.age >= life) {
            f.active = false;
            f.mesh.visible = false;
            continue;
          }
          const k = f.age / life;
          const sc = (f.effective ? 0.9 : 0.6) + k * (f.effective ? 4.2 : 2.2);
          f.mesh.scale.setScalar(sc);
          f.mat.opacity = (1 - k) * (f.effective ? 1 : 0.75);
        }
        for (const h of h2s) {
          if (!h.active) continue;
          h.group.position.y += h.vy * dt;
          h.group.position.x += h.drift * dt;
          h.group.rotation.y += h.spin * dt;
          if (h.group.position.y > MICRO.yMax + 0.3) {
            h.active = false;
            h.group.visible = false;
          }
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
        ? { dist: 6.3, polar: 1.15, ty: 0.95 }
        : { dist: 7.5, polar: 1.42, ty: 1.3 };
      const narrow = aspect < 1 ? 1.1 : 1;
      const k = 1 - Math.exp(-dt * 5);
      orbit.dist += (want.dist * narrow - orbit.dist) * k;
      orbit.polar += (want.polar - orbit.polar) * k;
      orbit.ty += (want.ty - orbit.ty) * k;
      if (!s.micro && !s.reacting && now > orbit.userUntil && !orbit.dragging) {
        orbit.az += dt * 0.12; // gentle idle rotation
      }
      const sp = Math.sin(orbit.polar);
      camera.position.set(
        orbit.dist * sp * Math.sin(orbit.az),
        orbit.ty + orbit.dist * Math.cos(orbit.polar),
        orbit.dist * sp * Math.cos(orbit.az)
      );
      camera.lookAt(0, orbit.ty, 0);

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

    const bubbles: Array<{ x: number; y: number; r: number; vy: number }> = [];
    const ions: Array<{ x: number; y: number; vx: number; vy: number }> = [];
    let ionsFor = -1;
    // roundRect is missing on some older mobile browsers — degrade to rect.
    const roundedPath = (x: number, y: number, w: number, h: number, radii: number[]) => {
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, radii);
      else ctx.rect(x, y, w, h);
    };
    let raf = 0;
    let last = performance.now();
    let lastReset = shared.current.resetToken;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = shared.current;
      if (s.resetToken !== lastReset) {
        lastReset = s.resetToken;
        bubbles.length = 0;
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
        const tw = Math.min(W * 0.32, 120);
        const th = H * 0.72;
        const tx = W / 2 - tw / 2;
        const ty = H * 0.12;
        const liquidTop = ty + th * 0.42;
        ctx.fillStyle = "rgba(186,230,253,0.55)";
        roundedPath(tx, liquidTop, tw, ty + th - liquidTop, [0, 0, tw / 2, tw / 2]);
        ctx.fill();
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 3;
        roundedPath(tx, ty, tw, th, [4, 4, tw / 2, tw / 2]);
        ctx.stroke();
        if (s.inserted && !s.finished) {
          const p = s.progress;
          const rh = th * 0.38 * (1 - 0.93 * p);
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(W / 2 - 5 * (1 - 0.5 * p), ty + th - 30 - rh, 10 * (1 - 0.5 * p), rh);
          for (let n = 0; n < (2 + s.concentration * 6) * dt * 10; n++) {
            if (Math.random() < 0.6)
              bubbles.push({ x: W / 2 + (Math.random() - 0.5) * 24, y: ty + th - 30 - Math.random() * rh, r: 1.5 + Math.random() * 3, vy: 40 + s.concentration * 20 });
          }
        }
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i];
          b.y -= b.vy * dt;
          if (b.y < liquidTop) {
            bubbles.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const n = ionCount(s.concentration);
        if (ionsFor !== n) {
          ionsFor = n;
          ions.length = 0;
          for (let i = 0; i < n; i++)
            ions.push({ x: Math.random() * W, y: Math.random() * H * 0.7, vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.5) * 160 });
        }
        const floorY = H * 0.78;
        const slab = s.inserted && !s.finished;
        if (slab) {
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(W * 0.1, floorY, W * 0.8, 18);
        }
        for (const ion of ions) {
          ion.x += ion.vx * dt;
          ion.y += ion.vy * dt;
          if (ion.x < 6 || ion.x > W - 6) ion.vx *= -1;
          if (ion.y < 6) ion.vy = Math.abs(ion.vy);
          if (ion.y > floorY - 6) {
            ion.vy = -Math.abs(ion.vy);
            if (slab) {
              ctx.strokeStyle = Math.random() < P_EFFECTIVE ? "#f59e0b" : "#94a3b8";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(ion.x, floorY, 9, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(ion.x, ion.y, 5, 0, Math.PI * 2);
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
