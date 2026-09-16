"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type TGroup = InstanceType<typeof THREE.Group>;
type TVector3 = InstanceType<typeof THREE.Vector3>;
type TObject3D = InstanceType<typeof THREE.Object3D>;
type TMaterial = InstanceType<typeof THREE.Material>;

interface ParticleRig {
  group: TGroup;
  velocity: TVector3;
  kind: 0 | 1;
}

export default function CollisionTheoryAnimation({
  energy,
  orientation,
  effective,
}: {
  energy: number;
  orientation: number;
  effective: boolean;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef({ energy, orientation, effective });
  const [webglFailed, setWebglFailed] = useState(false);
  controlsRef.current = { energy, orientation, effective };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: InstanceType<typeof THREE.WebGLRenderer>;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x071a38, 1);
    renderer.domElement.className = "block h-full w-full";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071a38);
    scene.fog = new THREE.Fog(0x071a38, 8, 13);

    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 30);
    camera.position.set(0, 0.45, 7.1);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);
    const blueLight = new THREE.PointLight(0x60a5fa, 2.2, 8);
    blueLight.position.set(-3, 1.5, 2.5);
    scene.add(blueLight);
    const amberLight = new THREE.PointLight(0xfbbf24, 1.8, 8);
    amberLight.position.set(3, -0.5, 1.5);
    scene.add(amberLight);

    const sphereGeometry = new THREE.SphereGeometry(1, 22, 16);
    const siteGeometry = new THREE.SphereGeometry(1, 14, 10);
    const blueMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.24,
      metalness: 0.12,
      emissive: 0x172554,
      emissiveIntensity: 0.35,
    });
    const amberMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.27,
      metalness: 0.1,
      emissive: 0x78350f,
      emissiveIntensity: 0.28,
    });
    const siteMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.18,
      emissive: 0xffffff,
      emissiveIntensity: 0.42,
    });
    const productMaterial = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.2,
      metalness: 0.12,
      emissive: 0x14532d,
      emissiveIntensity: 0.8,
    });

    const roomGeometry = new THREE.BoxGeometry(7.2, 3.8, 3.6);
    const roomEdges = new THREE.EdgesGeometry(roomGeometry);
    const roomMaterial = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.2,
    });
    scene.add(new THREE.LineSegments(roomEdges, roomMaterial));

    const grid = new THREE.GridHelper(7.2, 12, 0x3b82f6, 0x1e3a5f);
    grid.position.y = -1.9;
    scene.add(grid);

    const particleLayer = new THREE.Group();
    scene.add(particleLayer);

    const createParticle = (
      kind: 0 | 1,
      radius: number,
      showReactiveSite = true
    ) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        sphereGeometry,
        kind === 0 ? blueMaterial : amberMaterial
      );
      body.scale.setScalar(radius);
      group.add(body);

      if (showReactiveSite) {
        const reactiveSite = new THREE.Mesh(siteGeometry, siteMaterial);
        reactiveSite.scale.setScalar(radius * 0.28);
        reactiveSite.position.x = kind === 0 ? radius : -radius;
        group.add(reactiveSite);
      }
      return group;
    };

    const particles: ParticleRig[] = Array.from({ length: 24 }, (_, index) => {
      const kind = (index % 2) as 0 | 1;
      const group = createParticle(kind, 0.105 + Math.random() * 0.035, false);
      group.position.set(
        THREE.MathUtils.randFloatSpread(6.2),
        THREE.MathUtils.randFloatSpread(3.1),
        THREE.MathUtils.randFloatSpread(2.7)
      );
      particleLayer.add(group);
      const velocity = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(1)
      )
        .normalize()
        .multiplyScalar(0.5 + Math.random() * 0.45);
      return { group, velocity, kind };
    });

    const focusLayer = new THREE.Group();
    focusLayer.position.z = 0.75;
    scene.add(focusLayer);
    const focusA = createParticle(0, 0.34);
    const focusB = createParticle(1, 0.34);
    focusLayer.add(focusA, focusB);

    const product = new THREE.Mesh(sphereGeometry, productMaterial);
    product.scale.setScalar(0.46);
    product.visible = false;
    focusLayer.add(product);

    const pulseGeometry = new THREE.TorusGeometry(1, 0.055, 10, 44);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const collisionPulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    collisionPulse.visible = false;
    focusLayer.add(collisionPulse);

    const bounds = { x: 3.35, y: 1.72, z: 1.55 };
    const clock = new THREE.Clock();
    let elapsed = 0;
    let frame = 0;

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const animate = () => {
      const dt = Math.min(0.04, clock.getDelta());
      const controls = controlsRef.current;
      const speedFactor = 0.45 + controls.energy / 75;
      const orientationAngle = THREE.MathUtils.degToRad(controls.orientation);
      elapsed += dt * (0.62 + controls.energy / 115);

      for (const particle of particles) {
        particle.group.position.addScaledVector(particle.velocity, dt * speedFactor);
        if (Math.abs(particle.group.position.x) >= bounds.x) particle.velocity.x *= -1;
        if (Math.abs(particle.group.position.y) >= bounds.y) particle.velocity.y *= -1;
        if (Math.abs(particle.group.position.z) >= bounds.z) particle.velocity.z *= -1;
        particle.group.position.x = THREE.MathUtils.clamp(
          particle.group.position.x,
          -bounds.x,
          bounds.x
        );
        particle.group.position.y = THREE.MathUtils.clamp(
          particle.group.position.y,
          -bounds.y,
          bounds.y
        );
        particle.group.position.z = THREE.MathUtils.clamp(
          particle.group.position.z,
          -bounds.z,
          bounds.z
        );
      }

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const first = particles[i];
          const second = particles[j];
          if (first.kind === second.kind) continue;
          const distance = first.group.position.distanceToSquared(second.group.position);
          if (distance < 0.055) {
            const difference = new THREE.Vector3().subVectors(
              second.group.position,
              first.group.position
            );
            const relative = new THREE.Vector3().subVectors(
              second.velocity,
              first.velocity
            );
            if (difference.dot(relative) < 0) {
              const previous = first.velocity.clone();
              first.velocity.copy(second.velocity);
              second.velocity.copy(previous);
            }
          }
        }
      }

      const cycle = (elapsed % 3.2) / 3.2;
      const separation = 0.34 + Math.abs(cycle - 0.5) * 5.3;
      // The white reactive sites on this main pair are controlled exclusively
      // by the orientation slider. Keeping the other axes at zero prevents a
      // decorative spin from contradicting the displayed orientation status.
      focusA.rotation.set(0, 0, 0);
      focusB.rotation.set(0, 0, orientationAngle);
      if (controls.effective && cycle >= 0.5) {
        focusA.visible = false;
        focusB.visible = false;
        product.visible = true;
        const mergeProgress = Math.min(1, (cycle - 0.5) / 0.08);
        product.scale.setScalar(0.34 + mergeProgress * 0.18);
        product.rotation.y += dt * 1.2;
        product.rotation.x += dt * 0.45;
      } else {
        focusA.visible = true;
        focusB.visible = true;
        product.visible = false;
        focusA.position.set(-separation, 0, 0);
        focusB.position.set(separation, 0, 0);
      }

      const collisionDistance = Math.abs(cycle - 0.5);
      if (collisionDistance < 0.07) {
        const strength = 1 - collisionDistance / 0.07;
        collisionPulse.visible = true;
        collisionPulse.scale.setScalar(0.42 + (1 - strength) * 0.75);
        pulseMaterial.color.setHex(controls.effective ? 0x22c55e : 0xef4444);
        pulseMaterial.opacity = strength * 0.95;
      } else {
        collisionPulse.visible = false;
      }

      particleLayer.rotation.y += dt * 0.025;
      camera.position.x = Math.sin(elapsed * 0.11) * 0.32;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      const geometries = new Set<InstanceType<typeof THREE.BufferGeometry>>();
      const materials = new Set<InstanceType<typeof THREE.Material>>();
      scene.traverse((object: TObject3D) => {
        const renderable = object as InstanceType<typeof THREE.Mesh>;
        if (renderable.geometry) geometries.add(renderable.geometry);
        if (Array.isArray(renderable.material)) {
          renderable.material.forEach((material: TMaterial) => materials.add(material));
        } else if (renderable.material) {
          materials.add(renderable.material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      roomGeometry.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  if (webglFailed) {
    return (
      <div className="grid h-full place-items-center bg-slate-900 px-6 text-center text-sm font-semibold text-slate-200">
        Visualisasi 3D memerlukan WebGL. Aktifkan akselerasi grafis pada browser lalu
        muat ulang halaman.
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="relative h-full w-full overflow-hidden"
      role="img"
      aria-label={`Animasi 3D partikel bertumbukan: ${effective ? "tumbukan efektif dan dua partikel menyatu menjadi produk" : "tumbukan tidak efektif dan kedua partikel memantul"}, energi ${energy} kilojoule per mol, penyimpangan orientasi ${orientation} derajat`}
    >
      <div
        className={`pointer-events-none absolute left-3 top-3 z-10 rounded-full border px-3 py-1.5 text-[11px] font-black shadow-lg backdrop-blur ${
          effective
            ? "border-green-300/70 bg-green-950/80 text-green-200"
            : "border-red-300/70 bg-red-950/80 text-red-200"
        }`}
      >
        {effective
          ? "● Efektif · partikel menyatu"
          : "● Tidak efektif · partikel memantul"}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/75 px-3 py-1 text-[10px] font-bold text-slate-200 backdrop-blur">
        Biru + kuning → <span className="text-green-300">produk hijau</span>
      </div>
    </div>
  );
}
