"use client";

// Module 4 macroscopic apparatus rendered with the same Three.js approach as
// Modules 1–3. Simulation timing and recorded data remain owned by M4SimStage;
// this component only visualizes its current state.

import { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Props {
  label: string;
  progress: number;
  volume: number;
  running: boolean;
  orbitEnabled?: boolean;
  className?: string;
}

type TGroup = InstanceType<typeof THREE.Group>;
type TMesh = InstanceType<typeof THREE.Mesh>;

const FLASK_X = -1.35;
const CYLINDER_X = 1.45;
const CYLINDER_BOTTOM = 0.18;
const CYLINDER_HEIGHT = 2.2;
const CYLINDER_RADIUS = 0.45;
const CYLINDER_TOP = CYLINDER_BOTTOM + CYLINDER_HEIGHT;
const TROUGH_RADIUS = 0.92;
const TROUGH_HEIGHT = 0.82;
const WATER_LEVEL = 0.62;
const SCALE_TOP = CYLINDER_TOP - 0.08;
const SCALE_HEIGHT = 1.65;
const MAX_FLASK_BUBBLES = 34;
const MAX_TUBE_BUBBLES = 12;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function catalystColor(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("mno")) return 0x1f2937;
  if (lower.includes("fecl")) return 0xf97316;
  if (lower.includes("hati") || lower.includes("katalase")) return 0x78350f;
  return 0xbfdbfe;
}

function hasCatalyst(label: string) {
  return !label.toLowerCase().includes("tanpa");
}

function makeDisplay(
  width: number,
  height: number,
  options: { font: string; foreground: string; background: string }
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  let previous = "";

  const draw = (text: string) => {
    if (!context || text === previous) return;
    previous = text;
    context.clearRect(0, 0, width, height);
    context.fillStyle = options.background;
    context.beginPath();
    if (typeof context.roundRect === "function") {
      context.roundRect(0, 0, width, height, 18);
    } else {
      context.rect(0, 0, width, height);
    }
    context.fill();
    context.fillStyle = options.foreground;
    context.font = options.font;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, width / 2, height / 2 + 2);
    texture.needsUpdate = true;
  };

  return { texture, draw };
}

function makeSoftShadow() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 5, 64, 64, 62);
    gradient.addColorStop(0, "rgba(15,23,42,0.28)");
    gradient.addColorStop(1, "rgba(15,23,42,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  return canvas;
}

function makeScaleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(255,255,255,0.8)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#0f172a";
    context.fillStyle = "#0f172a";
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.font = "bold 52px Inter, system-ui, sans-serif";
    const padding = 24;
    for (let value = 0; value <= 50; value += 2) {
      const y = padding + (value / 50) * (canvas.height - padding * 2);
      const major = value % 10 === 0;
      const length = major ? 48 : 24;
      context.lineWidth = major ? 6 : 3;
      context.beginPath();
      context.moveTo(canvas.width - length, y);
      context.lineTo(canvas.width, y);
      context.stroke();
      if (major) context.fillText(String(value), canvas.width - length - 10, y);
    }
  }
  return canvas;
}

function FallbackApparatus({
  label,
  progress,
  volume,
}: Pick<Props, "label" | "progress" | "volume">) {
  const waterTop = 88 + clamp01(progress) * 156;
  return (
    <svg
      viewBox="0 0 800 350"
      className="h-full w-full"
      role="img"
      aria-label={`Alat penguraian hidrogen peroksida kondisi ${label}`}
    >
      <defs>
        <linearGradient id="m4-fallback-liquid" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#dbeafe" stopOpacity=".75" />
          <stop offset="1" stopColor="#60a5fa" stopOpacity=".5" />
        </linearGradient>
      </defs>
      <rect width="800" height="350" fill="#f8fafc" />
      <path d="M0 302H800V350H0Z" fill="#cbd5e1" />
      <path
        d="M265 75v52l-70 126q-12 28 21 34h145q33-6 21-34l-70-126V75Z"
        fill="white"
        fillOpacity=".72"
        stroke="#64748b"
        strokeWidth="5"
      />
      <path
        d="M216 243q72-22 145 0l20 34q-5 10-22 11H218q-18-2-22-12Z"
        fill="url(#m4-fallback-liquid)"
      />
      <path
        d="M316 76 C430 60 455 105 530 270"
        fill="none"
        stroke="#64748b"
        strokeWidth="7"
      />
      <rect x="458" y="238" width="212" height="75" rx="16" fill="#e0f2fe" fillOpacity=".55" stroke="#64748b" strokeWidth="4" />
      <rect x="463" y="247" width="202" height="61" rx="12" fill="#7dd3fc" fillOpacity=".52" />
      <rect
        x="500"
        y="78"
        width="126"
        height="206"
        rx="4"
        fill="white"
        fillOpacity=".72"
        stroke="#64748b"
        strokeWidth="4"
      />
      <path d={`M504 ${waterTop}h118v${252 - waterTop}H504Z`} fill="#7dd3fc" opacity=".68" />
      <path d="M500 78h126" stroke="#64748b" strokeWidth="5" />
      <text x="563" y="310" textAnchor="middle" fill="#334155" fontSize="12" fontWeight="800">
        Gelas ukur terbalik dalam bak air
      </text>
      <text x="288" y="319" textAnchor="middle" fill="#334155" fontSize="13" fontWeight="900">
        H₂O₂ + {label}
      </text>
      <rect x="650" y="96" width="112" height="55" rx="12" fill="#0f172a" />
      <text x="706" y="118" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="800">
        VOLUME O₂
      </text>
      <text x="706" y="141" textAnchor="middle" fill="white" fontSize="21" fontWeight="900">
        {volume.toFixed(1)} mL
      </text>
    </svg>
  );
}

export default memo(function M4Scene3D({
  label,
  progress,
  volume,
  running,
  orbitEnabled = true,
  className,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ label, progress, volume, running });
  const orbitEnabledRef = useRef(orbitEnabled);
  const [fallback, setFallback] = useState(false);
  stateRef.current = { label, progress, volume, running };
  orbitEnabledRef.current = orbitEnabled;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: InstanceType<typeof THREE.WebGLRenderer>;
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

    const smallScreen = window.innerWidth < 640;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, smallScreen ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.className = "block h-full w-full select-none";
    canvas.style.touchAction = "pan-y";
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "Laboratorium virtual 3D penguraian hidrogen peroksida dan pengukuran gas oksigen"
    );
    host.appendChild(canvas);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(resource: T): T => {
      disposables.push(resource);
      return resource;
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 1.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(3.5, 7, 5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xbfdbfe, 0.9);
    fillLight.position.set(-5, 3, -4);
    scene.add(fillLight);

    const apparatus: TGroup = new THREE.Group();
    scene.add(apparatus);

    const benchMaterial = track(
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.92 })
    );
    const bench = new THREE.Mesh(track(new THREE.BoxGeometry(8.5, 0.16, 4.1)), benchMaterial);
    bench.position.set(0, -0.08, 0.2);
    apparatus.add(bench);

    const shadowTexture = track(new THREE.CanvasTexture(makeSoftShadow()));
    const shadowMaterial = track(
      new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })
    );
    const shadowGeometry = track(new THREE.PlaneGeometry(1, 1));
    const addShadow = (x: number, z: number, size: number) => {
      const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(x, 0.005, z);
      shadow.scale.set(size, size, 1);
      apparatus.add(shadow);
    };
    addShadow(FLASK_X, 0.15, 3.0);
    addShadow(CYLINDER_X, 0.05, 2.2);

    const glassMaterial = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xdbeafe,
        transparent: true,
        opacity: 0.22,
        roughness: 0.05,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    const rimMaterial = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.78,
        roughness: 0.08,
        clearcoat: 1,
      })
    );
    const liquidMaterial = track(
      new THREE.MeshPhysicalMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.5,
        roughness: 0.15,
        depthWrite: false,
      })
    );

    // Erlenmeyer flask and liquid.
    const flaskProfile = [
      new THREE.Vector2(0.52, 0),
      new THREE.Vector2(0.64, 0.12),
      new THREE.Vector2(0.66, 0.28),
      new THREE.Vector2(0.43, 1.05),
      new THREE.Vector2(0.2, 1.5),
      new THREE.Vector2(0.2, 1.93),
    ];
    const flask = new THREE.Mesh(track(new THREE.LatheGeometry(flaskProfile, 48)), glassMaterial);
    flask.position.set(FLASK_X, 0.05, 0.1);
    flask.renderOrder = 5;
    apparatus.add(flask);
    const flaskRim = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.205, 0.025, 10, 48)),
      rimMaterial
    );
    flaskRim.rotation.x = Math.PI / 2;
    flaskRim.position.set(FLASK_X, 1.98, 0.1);
    apparatus.add(flaskRim);
    const flaskLiquid = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.4, 0.57, 0.7, 40)),
      liquidMaterial
    );
    flaskLiquid.position.set(FLASK_X, 0.42, 0.1);
    flaskLiquid.renderOrder = 1;
    apparatus.add(flaskLiquid);
    const liquidSurface = new THREE.Mesh(
      track(new THREE.CircleGeometry(0.4, 40)),
      track(
        new THREE.MeshPhysicalMaterial({
          color: 0xdbeafe,
          transparent: true,
          opacity: 0.72,
          roughness: 0.05,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      )
    );
    liquidSurface.rotation.x = -Math.PI / 2;
    liquidSurface.position.set(FLASK_X, 0.775, 0.1);
    liquidSurface.renderOrder = 2;
    apparatus.add(liquidSurface);

    const stopperMaterial = track(
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55 })
    );
    const stopper = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.23, 0.2, 0.22, 28)),
      stopperMaterial
    );
    stopper.position.set(FLASK_X, 1.92, 0.1);
    apparatus.add(stopper);

    // Catalyst grains retain their identity/color while the selected condition changes.
    const catalystMaterial = track(
      new THREE.MeshStandardMaterial({ color: catalystColor(stateRef.current.label), roughness: 0.75 })
    );
    const catalystGeometry = track(new THREE.IcosahedronGeometry(0.055, 1));
    const catalystMesh = new THREE.InstancedMesh(catalystGeometry, catalystMaterial, 20);
    const catalystDummy = new THREE.Object3D();
    for (let index = 0; index < 20; index++) {
      const angle = index * 2.31;
      const radius = 0.1 + (index % 5) * 0.055;
      catalystDummy.position.set(
        FLASK_X + Math.cos(angle) * radius,
        0.12 + (index % 3) * 0.035,
        0.1 + Math.sin(angle) * radius
      );
      catalystDummy.rotation.set(index * 0.2, angle, index * 0.13);
      catalystDummy.scale.setScalar(0.75 + (index % 4) * 0.12);
      catalystDummy.updateMatrix();
      catalystMesh.setMatrixAt(index, catalystDummy.matrix);
    }
    catalystMesh.instanceMatrix.needsUpdate = true;
    catalystMesh.frustumCulled = false;
    apparatus.add(catalystMesh);

    // Foam and bubbles inside the flask.
    const bubbleGeometry = track(new THREE.SphereGeometry(1, 12, 9));
    const bubbleMaterial = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.82,
        roughness: 0.05,
        transmission: 0.15,
        depthWrite: false,
      })
    );
    const flaskBubbles = Array.from({ length: MAX_FLASK_BUBBLES }, (_, index) => {
      const mesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      const seed = (index * 0.61803398875) % 1;
      mesh.visible = false;
      mesh.renderOrder = 3;
      apparatus.add(mesh);
      return {
        mesh: mesh as TMesh,
        seed,
        angle: index * 2.17,
        speed: 0.13 + (index % 7) * 0.018,
        radius: 0.018 + (index % 4) * 0.009,
      };
    });
    const foam = Array.from({ length: 28 }, (_, index) => {
      const mesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      const angle = index * 2.399;
      const radius = Math.sqrt((index + 1) / 28) * 0.36;
      mesh.position.set(
        FLASK_X + Math.cos(angle) * radius,
        0.78 + (index % 4) * 0.025,
        0.1 + Math.sin(angle) * radius
      );
      mesh.scale.setScalar(0.025 + (index % 5) * 0.008);
      mesh.visible = false;
      mesh.renderOrder = 4;
      apparatus.add(mesh);
      return mesh as TMesh;
    });

    // Delivery tube from flask to the bottom of the gas measuring cylinder.
    const tubeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(FLASK_X, 2.03, 0.1),
      new THREE.Vector3(-0.85, 2.32, 0.08),
      new THREE.Vector3(0.05, 2.35, 0.04),
      new THREE.Vector3(0.8, 2.18, 0.02),
      new THREE.Vector3(CYLINDER_X, 1.8, 0),
      new THREE.Vector3(CYLINDER_X, 0.32, 0),
    ]);
    const tube = new THREE.Mesh(
      track(new THREE.TubeGeometry(tubeCurve, 72, 0.048, 10, false)),
      track(
        new THREE.MeshPhysicalMaterial({
          color: 0xcbd5e1,
          transparent: true,
          opacity: 0.88,
          roughness: 0.2,
          clearcoat: 0.5,
        })
      )
    );
    apparatus.add(tube);
    const tubeBubbles = Array.from({ length: MAX_TUBE_BUBBLES }, (_, index) => {
      const mesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      mesh.scale.setScalar(0.035 + (index % 3) * 0.008);
      mesh.visible = false;
      mesh.renderOrder = 4;
      apparatus.add(mesh);
      return { mesh: mesh as TMesh, phase: index / MAX_TUBE_BUBBLES };
    });

    // Water trough and inverted measuring cylinder. O₂ entering from below
    // displaces the water column downward, matching the apparatus in Module 2.
    const waterMaterial = track(
      new THREE.MeshPhysicalMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.5,
        roughness: 0.1,
        depthWrite: false,
      })
    );
    const waterSurfaceMaterial = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.68,
        roughness: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    const trough = new THREE.Mesh(
      track(
        new THREE.CylinderGeometry(
          TROUGH_RADIUS,
          TROUGH_RADIUS * 0.94,
          TROUGH_HEIGHT,
          48,
          1,
          true
        )
      ),
      glassMaterial
    );
    trough.position.set(CYLINDER_X, TROUGH_HEIGHT / 2, 0);
    trough.renderOrder = 4;
    apparatus.add(trough);
    const troughBottom = new THREE.Mesh(
      track(new THREE.CircleGeometry(TROUGH_RADIUS * 0.94, 48)),
      glassMaterial
    );
    troughBottom.rotation.x = -Math.PI / 2;
    troughBottom.position.set(CYLINDER_X, 0.002, 0);
    apparatus.add(troughBottom);
    const troughWater = new THREE.Mesh(
      track(
        new THREE.CylinderGeometry(
          TROUGH_RADIUS - 0.05,
          TROUGH_RADIUS * 0.94 - 0.04,
          WATER_LEVEL,
          40
        )
      ),
      waterMaterial
    );
    troughWater.position.set(CYLINDER_X, WATER_LEVEL / 2, 0);
    troughWater.renderOrder = 1;
    apparatus.add(troughWater);
    const troughSurface = new THREE.Mesh(
      track(
        new THREE.RingGeometry(
          CYLINDER_RADIUS + 0.015,
          TROUGH_RADIUS - 0.05,
          48
        )
      ),
      waterSurfaceMaterial
    );
    troughSurface.rotation.x = -Math.PI / 2;
    troughSurface.position.set(CYLINDER_X, WATER_LEVEL + 0.003, 0);
    troughSurface.renderOrder = 2;
    apparatus.add(troughSurface);

    const cylinder = new THREE.Mesh(
      track(
        new THREE.CylinderGeometry(
          CYLINDER_RADIUS,
          CYLINDER_RADIUS,
          CYLINDER_HEIGHT,
          40,
          1,
          true
        )
      ),
      glassMaterial
    );
    cylinder.position.set(CYLINDER_X, CYLINDER_BOTTOM + CYLINDER_HEIGHT / 2, 0);
    cylinder.renderOrder = 5;
    apparatus.add(cylinder);
    const cylinderClosedTop = new THREE.Mesh(
      track(new THREE.CircleGeometry(CYLINDER_RADIUS, 40)),
      glassMaterial
    );
    cylinderClosedTop.rotation.x = -Math.PI / 2;
    cylinderClosedTop.position.set(CYLINDER_X, CYLINDER_TOP, 0);
    cylinderClosedTop.renderOrder = 5;
    apparatus.add(cylinderClosedTop);
    const cylinderRim = new THREE.Mesh(
      track(new THREE.TorusGeometry(CYLINDER_RADIUS, 0.025, 10, 48)),
      rimMaterial
    );
    cylinderRim.rotation.x = Math.PI / 2;
    cylinderRim.position.set(CYLINDER_X, CYLINDER_BOTTOM, 0);
    apparatus.add(cylinderRim);
    const cylinderWater = new THREE.Mesh(
      track(
        new THREE.CylinderGeometry(
          CYLINDER_RADIUS - 0.035,
          CYLINDER_RADIUS - 0.035,
          1,
          36
        )
      ),
      waterMaterial
    );
    cylinderWater.renderOrder = 1;
    apparatus.add(cylinderWater);
    const cylinderWaterSurface = new THREE.Mesh(
      track(new THREE.CircleGeometry(CYLINDER_RADIUS - 0.035, 36)),
      waterSurfaceMaterial
    );
    cylinderWaterSurface.rotation.x = -Math.PI / 2;
    cylinderWaterSurface.renderOrder = 2;
    apparatus.add(cylinderWaterSurface);

    const scaleTexture = track(new THREE.CanvasTexture(makeScaleTexture()));
    scaleTexture.colorSpace = THREE.SRGBColorSpace;
    scaleTexture.anisotropy = 4;
    const scaleStrip = new THREE.Mesh(
      track(new THREE.PlaneGeometry(0.3, SCALE_HEIGHT)),
      track(
        new THREE.MeshBasicMaterial({
          map: scaleTexture,
          transparent: true,
          depthWrite: false,
        })
      )
    );
    scaleStrip.position.set(
      CYLINDER_X - 0.04,
      SCALE_TOP - SCALE_HEIGHT / 2,
      CYLINDER_RADIUS + 0.012
    );
    scaleStrip.renderOrder = 7;
    apparatus.add(scaleStrip);

    const standRod = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.045, 0.045, 3.25, 14)),
      stopperMaterial
    );
    standRod.position.set(CYLINDER_X + 0.95, 1.55, -0.62);
    apparatus.add(standRod);
    const standBase = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.5, 0.56, 0.1, 32)),
      stopperMaterial
    );
    standBase.position.set(CYLINDER_X + 0.95, 0.05, -0.62);
    apparatus.add(standBase);
    const clampArm = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.07, 0.07, 0.75)),
      stopperMaterial
    );
    clampArm.position.set(CYLINDER_X + 0.48, 1.82, -0.3);
    clampArm.rotation.y = -0.9;
    apparatus.add(clampArm);
    const clamp = new THREE.Mesh(
      track(new THREE.TorusGeometry(CYLINDER_RADIUS + 0.06, 0.04, 10, 48)),
      stopperMaterial
    );
    clamp.rotation.x = Math.PI / 2;
    clamp.position.set(CYLINDER_X, 1.82, 0);
    apparatus.add(clamp);

    const cylinderBubbles = Array.from({ length: 10 }, (_, index) => {
      const mesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      mesh.scale.setScalar(0.035 + (index % 3) * 0.01);
      mesh.visible = false;
      mesh.renderOrder = 4;
      apparatus.add(mesh);
      return {
        mesh: mesh as TMesh,
        phase: index / 10,
        angle: index * 2.21,
      };
    });

    const volumeDisplay = makeDisplay(360, 140, {
      font: "bold 46px ui-monospace, Menlo, monospace",
      foreground: "#e0f2fe",
      background: "#0f172a",
    });
    track(volumeDisplay.texture);
    const volumeScreen = new THREE.Mesh(
      track(new THREE.PlaneGeometry(1.0, 0.39)),
      track(
        new THREE.MeshBasicMaterial({
          map: volumeDisplay.texture,
          transparent: true,
          depthWrite: false,
        })
      )
    );
    volumeScreen.position.set(2.4, 1.78, 0.48);
    volumeScreen.renderOrder = 8;
    apparatus.add(volumeScreen);

    const conditionDisplay = makeDisplay(480, 96, {
      font: "bold 34px Inter, system-ui, sans-serif",
      foreground: "#1e293b",
      background: "rgba(255,255,255,0.94)",
    });
    track(conditionDisplay.texture);
    const conditionScreen = new THREE.Mesh(
      track(new THREE.PlaneGeometry(1.55, 0.31)),
      track(
        new THREE.MeshBasicMaterial({
          map: conditionDisplay.texture,
          transparent: true,
          depthWrite: false,
        })
      )
    );
    conditionScreen.position.set(FLASK_X, 0.2, 0.83);
    conditionScreen.renderOrder = 8;
    apparatus.add(conditionScreen);

    let currentLabel = "";
    const orbit = {
      azimuth: 0.28,
      distance: 7.1,
      polar: 1.22,
      targetX: 0,
      targetY: 1.05,
      targetZ: 0.1,
      dragging: false,
      lastX: 0,
      userUntil: 0,
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!orbitEnabledRef.current) return;
      orbit.dragging = true;
      orbit.lastX = event.clientX;
      orbit.userUntil = performance.now() + 4000;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!orbitEnabledRef.current || !orbit.dragging) return;
      orbit.azimuth += (event.clientX - orbit.lastX) * 0.007;
      orbit.lastX = event.clientX;
      orbit.userUntil = performance.now() + 4000;
    };
    const onPointerUp = () => {
      orbit.dragging = false;
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    const onContextLost = (event: Event) => event.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    let aspect = 1;
    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      aspect = width / height;
      camera.aspect = aspect;
      camera.fov = aspect < 1 ? 43 : 34;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let onScreen = true;
    let pageVisible = document.visibilityState !== "hidden";
    let animationFrame = 0;
    let loopRunning = false;
    let lastTime = performance.now();
    let visualTime = 0;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        syncLoop();
      },
      { threshold: 0.02 }
    );
    intersectionObserver.observe(host);
    const onVisibilityChange = () => {
      pageVisible = document.visibilityState !== "hidden";
      syncLoop();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const tick = (now: number) => {
      const delta = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;
      const state = stateRef.current;
      const normalizedProgress = clamp01(state.progress);
      if (state.running) visualTime += delta;

      if (state.label !== currentLabel) {
        currentLabel = state.label;
        conditionDisplay.draw(`H₂O₂ + ${state.label || "Kondisi"}`);
        catalystMaterial.color.set(catalystColor(state.label));
      }
      catalystMesh.visible = hasCatalyst(state.label);
      volumeDisplay.draw(`O₂ ${state.volume.toFixed(1)} mL`);

      const reactionStrength = state.running
        ? 0.3 + normalizedProgress * 0.7
        : normalizedProgress > 0
          ? 0.18
          : 0;
      const visibleFlaskBubbles = Math.floor(MAX_FLASK_BUBBLES * reactionStrength);
      for (let index = 0; index < flaskBubbles.length; index++) {
        const bubble = flaskBubbles[index];
        bubble.mesh.visible = index < visibleFlaskBubbles;
        if (!bubble.mesh.visible) continue;
        const rise = (bubble.seed + visualTime * bubble.speed) % 1;
        const y = 0.22 + rise * 1.15;
        const availableRadius = Math.max(0.16, 0.51 - Math.max(0, y - 0.75) * 0.28);
        const radial = availableRadius * (0.2 + ((index * 17) % 70) / 100);
        bubble.mesh.position.set(
          FLASK_X + Math.cos(bubble.angle) * radial,
          y,
          0.1 + Math.sin(bubble.angle) * radial
        );
        const pulse = 0.85 + Math.sin(visualTime * 4 + index) * 0.12;
        bubble.mesh.scale.setScalar(bubble.radius * pulse);
      }

      const visibleFoam = Math.floor(foam.length * Math.min(1, reactionStrength * 1.25));
      for (let index = 0; index < foam.length; index++) {
        foam[index].visible = index < visibleFoam;
        if (foam[index].visible && state.running) {
          foam[index].position.y =
            0.78 + (index % 4) * 0.025 + Math.sin(visualTime * 2.8 + index) * 0.008;
        }
      }

      const visibleTubeBubbles = state.running
        ? MAX_TUBE_BUBBLES
        : normalizedProgress > 0 && normalizedProgress < 1
          ? 3
          : 0;
      for (let index = 0; index < tubeBubbles.length; index++) {
        const bubble = tubeBubbles[index];
        bubble.mesh.visible = index < visibleTubeBubbles;
        if (!bubble.mesh.visible) continue;
        const pathPosition = (bubble.phase + visualTime * 0.18) % 1;
        bubble.mesh.position.copy(tubeCurve.getPointAt(pathPosition));
      }

      const displacedGasHeight = normalizedProgress * SCALE_HEIGHT;
      const waterTop = Math.max(
        WATER_LEVEL + 0.015,
        SCALE_TOP - displacedGasHeight
      );
      const cylinderWaterHeight = Math.max(0.01, waterTop - WATER_LEVEL);
      cylinderWater.scale.set(1, cylinderWaterHeight, 1);
      cylinderWater.position.set(
        CYLINDER_X,
        WATER_LEVEL + cylinderWaterHeight / 2,
        0
      );
      cylinderWaterSurface.position.set(CYLINDER_X, waterTop, 0);

      const visibleCylinderBubbles = state.running ? cylinderBubbles.length : 0;
      for (let index = 0; index < cylinderBubbles.length; index++) {
        const bubble = cylinderBubbles[index];
        bubble.mesh.visible =
          index < visibleCylinderBubbles && waterTop > WATER_LEVEL + 0.08;
        if (!bubble.mesh.visible) continue;
        const rise = (bubble.phase + visualTime * 0.42) % 1;
        const availableHeight = Math.max(0.05, waterTop - WATER_LEVEL - 0.06);
        const radial = 0.06 + (index % 4) * 0.045;
        bubble.mesh.position.set(
          CYLINDER_X + Math.cos(bubble.angle) * radial,
          WATER_LEVEL + 0.03 + rise * availableHeight,
          Math.sin(bubble.angle) * radial
        );
      }

      if (now > orbit.userUntil && !orbit.dragging) {
        orbit.azimuth += delta * 0.055;
      }
      const narrowMultiplier = aspect < 1 ? 1.18 : 1;
      const distance = orbit.distance * narrowMultiplier;
      const sinPolar = Math.sin(orbit.polar);
      camera.position.set(
        orbit.targetX + distance * sinPolar * Math.sin(orbit.azimuth),
        orbit.targetY + distance * Math.cos(orbit.polar),
        orbit.targetZ + distance * sinPolar * Math.cos(orbit.azimuth)
      );
      camera.lookAt(orbit.targetX, orbit.targetY, orbit.targetZ);
      volumeScreen.quaternion.copy(camera.quaternion);
      conditionScreen.quaternion.copy(camera.quaternion);

      renderer.render(scene, camera);
      if (loopRunning) animationFrame = requestAnimationFrame(tick);
    };

    const syncLoop = () => {
      const shouldRun = onScreen && pageVisible;
      if (shouldRun && !loopRunning) {
        loopRunning = true;
        lastTime = performance.now();
        animationFrame = requestAnimationFrame(tick);
      } else if (!shouldRun && loopRunning) {
        loopRunning = false;
        cancelAnimationFrame(animationFrame);
      }
    };
    syncLoop();

    return () => {
      loopRunning = false;
      cancelAnimationFrame(animationFrame);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      disposables.forEach((resource) => resource.dispose());
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={
        "relative h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,#ffffff_0%,#f1f6fb_55%,#e2ebf5_100%)] " +
        (className ?? "")
      }
    >
      {fallback && (
        <FallbackApparatus label={label} progress={progress} volume={volume} />
      )}
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full border border-white/80 bg-white/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 shadow-sm backdrop-blur sm:left-4 sm:top-4">
        Pengukuran volume gas O₂
      </div>
    </div>
  );
});
