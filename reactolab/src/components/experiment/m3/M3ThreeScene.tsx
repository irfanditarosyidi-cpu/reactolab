"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type CameraView = "bebas" | "perspektif" | "atas" | "depan" | "belakang" | "samping" | "bawah";

interface M3ThreeSceneProps {
  temperature: number;
  progress: number;
  simTime: number;
  running: boolean;
}

function deterministic(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export default function M3ThreeScene({
  temperature,
  progress,
  simTime,
  running,
}: M3ThreeSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<InstanceType<typeof THREE.PerspectiveCamera> | null>(null);
  const controlsRef = useRef<InstanceType<typeof OrbitControls> | null>(null);
  const liquidRef = useRef<InstanceType<typeof THREE.MeshPhysicalMaterial> | null>(null);
  const surfaceRef = useRef<InstanceType<typeof THREE.MeshPhysicalMaterial> | null>(null);
  const sulfurRef = useRef<InstanceType<typeof THREE.PointsMaterial> | null>(null);
  const sulfurGroupRef = useRef<InstanceType<typeof THREE.Points> | null>(null);
  const timeRef = useRef(simTime);
  const [view, setView] = useState<CameraView>("perspektif");

  timeRef.current = simTime;

  useEffect(() => {
    const safeProgress = Math.max(0, Math.min(1, progress));
    if (liquidRef.current) {
      liquidRef.current.opacity = 0.18 + safeProgress * 0.76;
      liquidRef.current.color.setRGB(
        0.92 + safeProgress * 0.06,
        0.95 - safeProgress * 0.12,
        0.83 - safeProgress * 0.45,
      );
      liquidRef.current.roughness = 0.08 + safeProgress * 0.58;
    }
    if (surfaceRef.current) {
      surfaceRef.current.opacity = 0.15 + safeProgress * 0.68;
      surfaceRef.current.color.set(safeProgress > 0.55 ? "#f4d24d" : "#eefcff");
    }
    if (sulfurRef.current) sulfurRef.current.opacity = safeProgress * 0.72;
  }, [progress]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e8f2f4");
    scene.fog = new THREE.Fog("#e8f2f4", 11, 20);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 50);
    camera.position.set(5.4, 4.7, 6.6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = "block h-full w-full touch-none";
    renderer.domElement.setAttribute("aria-label", "Adegan Three.js alat percobaan tanda X yang dapat diputar ke segala arah");
    renderer.domElement.setAttribute("role", "img");
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.15, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 4.4;
    controls.maxDistance = 12;
    controls.minPolarAngle = 0.02;
    controls.maxPolarAngle = Math.PI - 0.02;
    controls.rotateSpeed = 0.72;
    controls.zoomSpeed = 0.8;
    controls.addEventListener("start", () => setView("bebas"));
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight("#ffffff", "#765233", 2.25));
    const keyLight = new THREE.DirectionalLight("#ffffff", 3.1);
    keyLight.position.set(5, 9, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight("#a5f3fc", 1.15);
    fillLight.position.set(-5, 4, -3);
    scene.add(fillLight);

    const bench = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 22),
      new THREE.MeshStandardMaterial({ color: "#b88958", roughness: 0.86, side: THREE.FrontSide }),
    );
    bench.rotation.x = -Math.PI / 2;
    bench.position.y = -0.2;
    bench.receiveShadow = true;
    scene.add(bench);

    const cardCanvas = document.createElement("canvas");
    cardCanvas.width = 768;
    cardCanvas.height = 768;
    const cardContext = cardCanvas.getContext("2d");
    if (cardContext) {
      cardContext.fillStyle = "#ffffff";
      cardContext.fillRect(0, 0, 768, 768);
      cardContext.strokeStyle = "#111827";
      cardContext.lineWidth = 92;
      cardContext.lineCap = "round";
      cardContext.beginPath();
      cardContext.moveTo(180, 180);
      cardContext.lineTo(588, 588);
      cardContext.moveTo(588, 180);
      cardContext.lineTo(180, 588);
      cardContext.stroke();
      cardContext.fillStyle = "#64748b";
      cardContext.font = "bold 42px Arial";
      cardContext.textAlign = "center";
      cardContext.fillText("TANDA X", 384, 700);
    }
    const cardTexture = new THREE.CanvasTexture(cardCanvas);
    cardTexture.colorSpace = THREE.SRGBColorSpace;
    cardTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const card = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.06, 4.6),
      [
        new THREE.MeshStandardMaterial({ color: "#e2e8f0" }),
        new THREE.MeshStandardMaterial({ color: "#e2e8f0" }),
        new THREE.MeshStandardMaterial({ map: cardTexture, roughness: 0.78 }),
        new THREE.MeshStandardMaterial({ color: "#f1f5f9" }),
        new THREE.MeshStandardMaterial({ color: "#e2e8f0" }),
        new THREE.MeshStandardMaterial({ color: "#e2e8f0" }),
      ],
    );
    card.position.y = -0.1;
    card.receiveShadow = true;
    scene.add(card);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: "#dff7ff",
      transparent: true,
      opacity: 0.22,
      transmission: 0.72,
      roughness: 0.04,
      thickness: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beakerWall = new THREE.Mesh(
      new THREE.CylinderGeometry(1.72, 1.55, 2.75, 64, 1, true),
      glassMaterial,
    );
    beakerWall.position.y = 1.31;
    beakerWall.castShadow = true;
    scene.add(beakerWall);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.72, 0.045, 12, 72),
      new THREE.MeshPhysicalMaterial({ color: "#dff7ff", transparent: true, opacity: 0.58, transmission: 0.55, roughness: 0.05 }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 2.69;
    scene.add(rim);

    const bottom = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.55, 0.07, 64),
      glassMaterial,
    );
    bottom.position.y = -0.04;
    scene.add(bottom);

    const liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: "#edf4d4",
      transparent: true,
      opacity: 0.18,
      roughness: 0.08,
      transmission: 0.05,
      thickness: 0.5,
      depthWrite: true,
    });
    liquidRef.current = liquidMaterial;
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.43, 1.72, 64), liquidMaterial);
    liquid.position.y = 0.83;
    scene.add(liquid);

    const surfaceMaterial = new THREE.MeshPhysicalMaterial({
      color: "#eefcff",
      transparent: true,
      opacity: 0.15,
      roughness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    surfaceRef.current = surfaceMaterial;
    const liquidSurface = new THREE.Mesh(new THREE.CircleGeometry(1.5, 64), surfaceMaterial);
    liquidSurface.rotation.x = -Math.PI / 2;
    liquidSurface.position.y = 1.7;
    scene.add(liquidSurface);

    const sulfurPositions = new Float32Array(900 * 3);
    for (let index = 0; index < 900; index += 1) {
      const radius = Math.sqrt(deterministic(index, 3)) * 1.38;
      const angle = deterministic(index, 7) * Math.PI * 2;
      sulfurPositions[index * 3] = Math.cos(angle) * radius;
      sulfurPositions[index * 3 + 1] = 0.06 + deterministic(index, 11) * 1.56;
      sulfurPositions[index * 3 + 2] = Math.sin(angle) * radius;
    }
    const sulfurGeometry = new THREE.BufferGeometry();
    sulfurGeometry.setAttribute("position", new THREE.BufferAttribute(sulfurPositions, 3));
    const sulfurMaterial = new THREE.PointsMaterial({
      color: "#d9a900",
      size: 0.034,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    sulfurRef.current = sulfurMaterial;
    const sulfur = new THREE.Points(sulfurGeometry, sulfurMaterial);
    sulfurGroupRef.current = sulfur;
    scene.add(sulfur);

    const thermometer = new THREE.Group();
    const probe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 3.1, 16),
      new THREE.MeshStandardMaterial({ color: "#64748b", metalness: 0.72, roughness: 0.25 }),
    );
    probe.rotation.z = -0.25;
    probe.position.set(1.25, 2.13, 0.25);
    thermometer.add(probe);
    const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 18), new THREE.MeshStandardMaterial({ color: "#ef4444" }));
    sensor.position.set(0.88, 0.63, 0.25);
    thermometer.add(sensor);
    scene.add(thermometer);

    const cylinderGroup = new THREE.Group();
    const cylinderGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 1.8, 32, 1, true),
      glassMaterial,
    );
    cylinderGlass.position.y = 0.72;
    cylinderGroup.add(cylinderGlass);
    const acid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.37, 0.37, 0.9, 32),
      new THREE.MeshPhysicalMaterial({ color: "#dbeafe", transparent: true, opacity: 0.48, roughness: 0.1 }),
    );
    acid.position.y = 0.28;
    cylinderGroup.add(acid);
    cylinderGroup.position.set(-3, 0.05, 0.3);
    scene.add(cylinderGroup);

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frame = 0;
    const animate = () => {
      controls.update();
      if (sulfurGroupRef.current) sulfurGroupRef.current.rotation.y = timeRef.current * 0.025;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      scene.traverse((object: InstanceType<typeof THREE.Object3D>) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material: InstanceType<typeof THREE.Material>) => material.dispose());
        }
      });
      cardTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      cameraRef.current = null;
      controlsRef.current = null;
      liquidRef.current = null;
      surfaceRef.current = null;
      sulfurRef.current = null;
      sulfurGroupRef.current = null;
    };
  }, []);

  const setCameraView = (next: CameraView) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls || next === "bebas") return;
    const positions: Record<Exclude<CameraView, "bebas">, [number, number, number]> = {
      perspektif: [5.4, 4.7, 6.6],
      atas: [0.01, 9.2, 0.01],
      depan: [0, 2.8, 8.2],
      belakang: [0, 2.8, -8.2],
      samping: [8.2, 2.8, 0],
      bawah: [0.01, -6.6, 0.01],
    };
    camera.position.set(...positions[next]);
    controls.target.set(0, 1.12, 0);
    controls.update();
    setView(next);
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-100">
      <div ref={hostRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-white/70 bg-slate-950/72 px-2.5 py-2 text-white shadow-lg backdrop-blur-md">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sky-200">Three.js · Suhu tetap</p>
        <p className="font-mono text-sm font-black">{temperature.toFixed(1)} °C</p>
        <p className="mt-0.5 text-[8px] text-slate-300">{running ? "reaksi berlangsung" : "geser objek untuk melihat"}</p>
      </div>

      <label className="absolute right-3 top-3 flex items-center gap-1.5 rounded-xl border border-white/70 bg-white/90 px-2 py-1.5 text-[9px] font-bold text-slate-700 shadow-lg backdrop-blur-md">
        Sudut
        <select
          value={view}
          onChange={(event) => {
            const next = event.target.value as CameraView;
            if (next !== "bebas") setCameraView(next);
          }}
          className="min-h-8 rounded-lg border border-slate-200 bg-white px-1.5 text-[10px] font-black text-sky-700 outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Pilih sudut pandang tiga dimensi"
        >
          <option value="bebas">Bebas</option>
          <option value="perspektif">Perspektif</option>
          <option value="atas">Atas</option>
          <option value="depan">Depan</option>
          <option value="belakang">Belakang</option>
          <option value="samping">Samping</option>
          <option value="bawah">Bawah</option>
        </select>
      </label>

      <div className="pointer-events-none absolute bottom-16 right-3 rounded-full border border-white/70 bg-white/85 px-2.5 py-1 text-[8px] font-bold text-slate-600 shadow backdrop-blur-sm sm:text-[9px]">
        1 jari: putar · cubit: zoom
      </div>
    </div>
  );
}
