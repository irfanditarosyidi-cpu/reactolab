"use client";

import { useEffect, useId, useRef, useState } from "react";
import * as THREE from "three";

type TGroup = InstanceType<typeof THREE.Group>;
type TMesh = InstanceType<typeof THREE.Mesh>;
type TVector3 = InstanceType<typeof THREE.Vector3>;
type TMaterial = InstanceType<typeof THREE.Material>;

type Particle = {
  group: TGroup;
  velocity: TVector3;
  kind: 0 | 1;
  radius: number;
  cooldown: number;
};

type Flash = {
  mesh: TMesh;
  age: number;
};

type ReactionLab3DProps = {
  className?: string;
};

const PARTICLE_COLORS = [0x38bdf8, 0xfbbf24] as const;
const FLASH_POOL_SIZE = 7;

/**
 * A lightweight, self-contained Three.js scene for the public landing page.
 * The scene deliberately avoids external models and textures so it can load
 * immediately, even on slower classroom connections.
 */
export default function ReactionLab3D({ className = "" }: ReactionLab3DProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const temperatureRef = useRef(72);
  const instructionId = useId();
  const sliderId = useId();
  const [temperature, setTemperature] = useState(72);
  const [collisionCount, setCollisionCount] = useState(0);
  const [webglFailed, setWebglFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  temperatureRef.current = temperature;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const compactScreenQuery = window.matchMedia("(max-width: 720px)");
    const shouldReduceMotion = reducedMotionQuery.matches;
    const isMobile = coarsePointerQuery.matches || compactScreenQuery.matches;
    setReducedMotion(shouldReduceMotion);

    let renderer: InstanceType<typeof THREE.WebGLRenderer>;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        alpha: true,
        powerPreference: isMobile ? "default" : "high-performance",
      });
      if (!renderer.getContext()) throw new Error("WebGL context is unavailable");
    } catch {
      setWebglFailed(true);
      setReady(true);
      return;
    }

    let disposed = false;
    let animationFrame = 0;
    let isVisible = true;
    let pageVisible = !document.hidden;
    let dragging = false;
    let activePointerId: number | null = null;
    let previousPointerX = 0;
    let previousPointerY = 0;
    let targetRotationX = -0.12;
    let targetRotationY = -0.34;
    let effectiveCollisions = 0;
    let lastCommittedCollisionCount = 0;
    let lastCounterCommit = 0;

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0x020617, 0);
    renderer.domElement.className = "block h-full w-full select-none";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07152b, 0.075);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
    camera.position.set(0, 0.2, isMobile ? 8.4 : 7.4);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.HemisphereLight(0xdff6ff, 0x08132c, 2.15);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(3.5, 4.5, 6);
    scene.add(keyLight);

    const cyanLight = new THREE.PointLight(0x38bdf8, 12, 7, 2);
    cyanLight.position.set(-3, 1.5, 2.6);
    scene.add(cyanLight);

    const amberLight = new THREE.PointLight(0xf59e0b, 9, 6, 2);
    amberLight.position.set(2.8, -1, 2.2);
    scene.add(amberLight);

    const reactor = new THREE.Group();
    reactor.rotation.set(targetRotationX, targetRotationY, 0.02);
    scene.add(reactor);

    const trackedGeometries: Array<{ dispose: () => void }> = [];
    const trackedMaterials: TMaterial[] = [];
    const trackGeometry = <T extends { dispose: () => void }>(geometry: T): T => {
      trackedGeometries.push(geometry);
      return geometry;
    };
    const trackMaterial = <T extends TMaterial>(material: T): T => {
      trackedMaterials.push(material);
      return material;
    };

    // Glass chamber: a subtle solid shell plus crisp illuminated edges.
    const chamberGeometry = trackGeometry(new THREE.BoxGeometry(5.8, 3, 2.5, 2, 2, 2));
    const chamberMaterial = trackMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0x8bdcff,
        transparent: true,
        opacity: 0.075,
        roughness: 0.08,
        metalness: 0.05,
        transmission: isMobile ? 0 : 0.34,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    const glassChamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
    reactor.add(glassChamber);

    const chamberEdgesGeometry = trackGeometry(new THREE.EdgesGeometry(chamberGeometry));
    const chamberEdgesMaterial = trackMaterial(
      new THREE.LineBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.46,
      })
    );
    const chamberEdges = new THREE.LineSegments(
      chamberEdgesGeometry,
      chamberEdgesMaterial
    );
    reactor.add(chamberEdges);

    // Slim rails make the box read as a real reaction vessel rather than a grid.
    const railGeometry = trackGeometry(new THREE.CylinderGeometry(0.025, 0.025, 5.72, 8));
    const railMaterial = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xbbeaff,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.65,
        roughness: 0.22,
        metalness: 0.7,
      })
    );
    [-1.46, 1.46].forEach((y) => {
      [-1.2, 1.2].forEach((z) => {
        const rail = new THREE.Mesh(railGeometry, railMaterial);
        rail.rotation.z = Math.PI / 2;
        rail.position.set(0, y, z);
        reactor.add(rail);
      });
    });

    const moleculeLayer = new THREE.Group();
    reactor.add(moleculeLayer);

    const bodyGeometry = trackGeometry(
      new THREE.SphereGeometry(1, isMobile ? 12 : 18, isMobile ? 9 : 14)
    );
    const siteGeometry = trackGeometry(
      new THREE.SphereGeometry(1, isMobile ? 8 : 12, isMobile ? 6 : 9)
    );
    const bodyMaterials = PARTICLE_COLORS.map((color, index) =>
      trackMaterial(
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.2,
          metalness: 0.12,
          emissive: index === 0 ? 0x075985 : 0x78350f,
          emissiveIntensity: 0.48,
        })
      )
    );
    const siteMaterial = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: 0xffffff,
        emissiveIntensity: 0.7,
        roughness: 0.13,
      })
    );

    const particleCount = shouldReduceMotion ? 12 : isMobile ? 18 : 30;
    const particles: Particle[] = Array.from({ length: particleCount }, (_, index) => {
      const kind = (index % 2) as 0 | 1;
      const radius = isMobile
        ? THREE.MathUtils.randFloat(0.115, 0.15)
        : THREE.MathUtils.randFloat(0.105, 0.145);
      const group = new THREE.Group();

      const body = new THREE.Mesh(bodyGeometry, bodyMaterials[kind]);
      body.scale.setScalar(radius);
      group.add(body);

      const reactiveSite = new THREE.Mesh(siteGeometry, siteMaterial);
      reactiveSite.scale.setScalar(radius * 0.31);
      reactiveSite.position.x = kind === 0 ? radius * 0.84 : -radius * 0.84;
      group.add(reactiveSite);

      group.position.set(
        THREE.MathUtils.randFloatSpread(5.1),
        THREE.MathUtils.randFloatSpread(2.45),
        THREE.MathUtils.randFloatSpread(1.9)
      );
      group.rotation.set(
        THREE.MathUtils.randFloatSpread(Math.PI),
        THREE.MathUtils.randFloatSpread(Math.PI),
        THREE.MathUtils.randFloatSpread(Math.PI)
      );
      moleculeLayer.add(group);

      const velocity = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(1)
      )
        .normalize()
        .multiplyScalar(THREE.MathUtils.randFloat(0.72, 1.18));

      return { group, velocity, kind, radius, cooldown: Math.random() * 0.3 };
    });

    // A small reusable pool prevents allocations each time particles collide.
    const flashGeometry = trackGeometry(new THREE.RingGeometry(0.13, 0.2, 24));
    const flashes: Flash[] = Array.from({ length: FLASH_POOL_SIZE }, () => {
      const material = trackMaterial(
        new THREE.MeshBasicMaterial({
          color: 0x86efac,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        })
      );
      const mesh = new THREE.Mesh(flashGeometry, material);
      mesh.visible = false;
      reactor.add(mesh);
      return { mesh, age: 1 };
    });
    let nextFlash = 0;

    // Sparse background dust gives depth while remaining cheap on mobile GPUs.
    const dustCount = isMobile ? 42 : 78;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let index = 0; index < dustCount; index += 1) {
      dustPositions[index * 3] = THREE.MathUtils.randFloatSpread(12);
      dustPositions[index * 3 + 1] = THREE.MathUtils.randFloatSpread(7);
      dustPositions[index * 3 + 2] = THREE.MathUtils.randFloat(-3.5, -0.5);
    }
    const dustGeometry = trackGeometry(new THREE.BufferGeometry());
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = trackMaterial(
      new THREE.PointsMaterial({
        color: 0x7dd3fc,
        size: isMobile ? 0.025 : 0.032,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    const bounds = { x: 2.68, y: 1.34, z: 1.08 };
    const deltaVector = new THREE.Vector3();
    const relativeVelocity = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const midpoint = new THREE.Vector3();
    const clock = new THREE.Clock();

    const triggerFlash = (position: TVector3) => {
      const flash = flashes[nextFlash];
      nextFlash = (nextFlash + 1) % flashes.length;
      flash.mesh.position.copy(position);
      flash.mesh.scale.setScalar(0.7);
      flash.mesh.visible = true;
      flash.age = 0;
      const flashMaterial = flash.mesh.material as InstanceType<
        typeof THREE.MeshBasicMaterial
      >;
      flashMaterial.opacity = 1;
    };

    const resolveParticleCollision = (first: Particle, second: Particle) => {
      deltaVector.subVectors(second.group.position, first.group.position);
      const distanceSquared = deltaVector.lengthSq();
      const minimumDistance = first.radius + second.radius + 0.035;
      if (distanceSquared > minimumDistance * minimumDistance || distanceSquared < 0.00001) {
        return;
      }

      normal.copy(deltaVector).normalize();
      relativeVelocity.subVectors(first.velocity, second.velocity);
      const closingSpeed = relativeVelocity.dot(normal);
      if (closingSpeed <= 0) return;

      // Equal-mass elastic response along the collision normal.
      first.velocity.addScaledVector(normal, -closingSpeed);
      second.velocity.addScaledVector(normal, closingSpeed);

      const overlap = minimumDistance - Math.sqrt(distanceSquared);
      first.group.position.addScaledVector(normal, -overlap * 0.51);
      second.group.position.addScaledVector(normal, overlap * 0.51);

      if (first.cooldown > 0 || second.cooldown > 0 || first.kind === second.kind) return;

      const energy = (temperatureRef.current - 25) / 95;
      const effectiveness = 0.2 + energy * 0.48;
      if (closingSpeed > 0.34 && Math.random() < effectiveness) {
        midpoint.addVectors(first.group.position, second.group.position).multiplyScalar(0.5);
        triggerFlash(midpoint);
        effectiveCollisions += 1;
        first.cooldown = 0.38;
        second.cooldown = 0.38;
      }
    };

    const renderScene = () => renderer.render(scene, camera);

    const update = (delta: number, elapsed: number) => {
      const energy = (temperatureRef.current - 25) / 95;
      const speed = 0.42 + energy * 1.25;

      particles.forEach((particle) => {
        particle.cooldown = Math.max(0, particle.cooldown - delta);
        particle.group.position.addScaledVector(particle.velocity, delta * speed);
        particle.group.rotation.x += delta * (0.34 + energy * 0.75);
        particle.group.rotation.y += delta * (particle.kind === 0 ? 0.48 : -0.48);

        if (Math.abs(particle.group.position.x) >= bounds.x) {
          particle.velocity.x *= -1;
          particle.group.position.x = THREE.MathUtils.clamp(
            particle.group.position.x,
            -bounds.x,
            bounds.x
          );
        }
        if (Math.abs(particle.group.position.y) >= bounds.y) {
          particle.velocity.y *= -1;
          particle.group.position.y = THREE.MathUtils.clamp(
            particle.group.position.y,
            -bounds.y,
            bounds.y
          );
        }
        if (Math.abs(particle.group.position.z) >= bounds.z) {
          particle.velocity.z *= -1;
          particle.group.position.z = THREE.MathUtils.clamp(
            particle.group.position.z,
            -bounds.z,
            bounds.z
          );
        }
      });

      for (let firstIndex = 0; firstIndex < particles.length; firstIndex += 1) {
        for (
          let secondIndex = firstIndex + 1;
          secondIndex < particles.length;
          secondIndex += 1
        ) {
          resolveParticleCollision(particles[firstIndex], particles[secondIndex]);
        }
      }

      flashes.forEach((flash) => {
        if (!flash.mesh.visible) return;
        flash.age += delta * 2.7;
        if (flash.age >= 1) {
          flash.mesh.visible = false;
          return;
        }
        flash.mesh.quaternion.copy(camera.quaternion);
        flash.mesh.scale.setScalar(0.65 + flash.age * 3.4);
        const material = flash.mesh.material as InstanceType<
          typeof THREE.MeshBasicMaterial
        >;
        material.opacity = Math.pow(1 - flash.age, 1.6);
      });

      if (!dragging) targetRotationY += delta * 0.055;
      reactor.rotation.x += (targetRotationX - reactor.rotation.x) * 0.075;
      reactor.rotation.y += (targetRotationY - reactor.rotation.y) * 0.075;
      reactor.rotation.z = Math.sin(elapsed * 0.38) * 0.018;
      dust.rotation.y = elapsed * 0.012;
    };

    const animate = () => {
      if (disposed || animationFrame || shouldReduceMotion || !isVisible || !pageVisible) {
        return;
      }
      clock.start();
      const frame = () => {
        if (disposed || shouldReduceMotion || !isVisible || !pageVisible) {
          animationFrame = 0;
          clock.stop();
          return;
        }
        animationFrame = window.requestAnimationFrame(frame);
        const delta = Math.min(clock.getDelta(), 0.04);
        const elapsed = clock.elapsedTime;
        update(delta, elapsed);
        renderScene();
        if (
          effectiveCollisions !== lastCommittedCollisionCount &&
          elapsed - lastCounterCommit > 0.24
        ) {
          lastCounterCommit = elapsed;
          lastCommittedCollisionCount = effectiveCollisions;
          setCollisionCount(effectiveCollisions);
        }
      };
      animationFrame = window.requestAnimationFrame(frame);
    };

    const pause = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      clock.stop();
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      pause();
      setWebglFailed(true);
    };

    const resize = () => {
      if (disposed) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderScene();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = true;
      activePointerId = event.pointerId;
      previousPointerX = event.clientX;
      previousPointerY = event.clientY;
      host.setPointerCapture(event.pointerId);
      host.classList.add("is-dragging");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      const movementX = event.clientX - previousPointerX;
      const movementY = event.clientY - previousPointerY;
      previousPointerX = event.clientX;
      previousPointerY = event.clientY;
      targetRotationY += movementX * 0.008;
      targetRotationX = THREE.MathUtils.clamp(
        targetRotationX + movementY * 0.006,
        -0.72,
        0.58
      );
      if (shouldReduceMotion) {
        reactor.rotation.set(targetRotationX, targetRotationY, 0);
        renderScene();
      }
    };

    const endPointerDrag = (event: PointerEvent) => {
      if (event.pointerId !== activePointerId) return;
      dragging = false;
      activePointerId = null;
      host.classList.remove("is-dragging");
      if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const rotationStep = 0.13;
      if (event.key === "ArrowLeft") targetRotationY -= rotationStep;
      else if (event.key === "ArrowRight") targetRotationY += rotationStep;
      else if (event.key === "ArrowUp") {
        targetRotationX = Math.max(-0.72, targetRotationX - rotationStep);
      } else if (event.key === "ArrowDown") {
        targetRotationX = Math.min(0.58, targetRotationX + rotationStep);
      } else {
        return;
      }
      event.preventDefault();
      if (shouldReduceMotion) {
        reactor.rotation.set(targetRotationX, targetRotationY, 0);
        renderScene();
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting && entry.intersectionRatio > 0;
        if (isVisible && pageVisible) animate();
        else pause();
      },
      { threshold: 0.02, rootMargin: "120px" }
    );
    intersectionObserver.observe(host);

    const onVisibilityChange = () => {
      pageVisible = !document.hidden;
      if (pageVisible && isVisible) animate();
      else pause();
    };

    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerup", endPointerDrag);
    host.addEventListener("pointercancel", endPointerDrag);
    host.addEventListener("keydown", onKeyDown);
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    document.addEventListener("visibilitychange", onVisibilityChange);

    resize();
    if (shouldReduceMotion) renderScene();
    else animate();
    setReady(true);

    return () => {
      disposed = true;
      pause();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerup", endPointerDrag);
      host.removeEventListener("pointercancel", endPointerDrag);
      host.removeEventListener("keydown", onKeyDown);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      trackedGeometries.forEach((geometry) => geometry.dispose());
      trackedMaterials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, []);

  const temperatureProgress = ((temperature - 25) / 95) * 100;

  return (
    <section
      className={`reaction-lab-demo relative isolate min-h-[430px] w-full overflow-hidden rounded-[2rem] border border-white/15 bg-[#06142d] shadow-[0_32px_90px_-36px_rgba(14,165,233,0.7)] sm:min-h-[500px] ${className}`}
      aria-label="Simulasi interaktif tiga dimensi tumbukan partikel"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(56,189,248,0.24),transparent_30%),radial-gradient(circle_at_85%_75%,rgba(245,158,11,0.15),transparent_28%),linear-gradient(145deg,#071a38_0%,#020617_74%)]" />
      <div className="pointer-events-none absolute -left-24 top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-4 h-52 w-52 rounded-full bg-amber-400/10 blur-3xl" />

      {webglFailed ? (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="reaction-fallback-chamber absolute left-1/2 top-[47%] h-[42%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-cyan-200/35 bg-cyan-300/[0.04] shadow-[inset_0_0_45px_rgba(56,189,248,0.08),0_0_35px_rgba(14,165,233,0.12)]">
            {Array.from({ length: 14 }, (_, index) => (
              <span
                key={index}
                className={`reaction-fallback-particle absolute h-3 w-3 rounded-full shadow-[0_0_13px_currentColor] ${
                  index % 2 === 0 ? "bg-sky-400 text-sky-400" : "bg-amber-400 text-amber-400"
                }`}
                style={
                  {
                    left: `${9 + ((index * 29) % 80)}%`,
                    top: `${12 + ((index * 37) % 72)}%`,
                    animationDelay: `${-(index % 7) * 0.31}s`,
                    animationDuration: `${2.8 + (index % 5) * 0.38}s`,
                    "--fallback-x": `${index % 3 === 0 ? 38 : -32}px`,
                    "--fallback-y": `${index % 4 === 0 ? -22 : 27}px`,
                  } as React.CSSProperties
                }
              />
            ))}
            <span className="reaction-fallback-flash absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-300" />
          </div>
        </div>
      ) : (
        <div
          ref={hostRef}
          className="reaction-canvas absolute inset-0 cursor-grab touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300"
          role="group"
          tabIndex={0}
          aria-describedby={instructionId}
          aria-label="Model ruang reaksi. Seret untuk memutar atau gunakan tombol panah pada papan ketik."
        />
      )}

      {!ready && !webglFailed && (
        <div className="absolute inset-0 grid place-items-center" role="status">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/55 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
            Menyiapkan laboratorium 3D
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-6">
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-3.5 py-2.5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-200 sm:text-xs">
            <span className="relative flex h-2.5 w-2.5">
              {!reducedMotion && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
              )}
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            Simulasi 3D
          </div>
          <p className="mt-1 text-[11px] text-slate-300 sm:text-xs">
            Ruang tumbukan molekuler
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3.5 py-2.5 text-right shadow-xl backdrop-blur-xl">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-200 sm:text-[10px]">
            Tumbukan efektif
          </p>
          <p
            className="mt-0.5 text-xl font-black tabular-nums text-white sm:text-2xl"
            aria-label={`${collisionCount} tumbukan efektif`}
          >
            {webglFailed ? "Visual" : collisionCount.toLocaleString("id-ID")}
            {!webglFailed && <span className="ml-1 text-xs font-semibold text-emerald-300">x</span>}
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
        <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-[1.35rem] border border-white/10 bg-slate-950/65 p-3.5 shadow-2xl backdrop-blur-xl sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <label
                htmlFor={sliderId}
                className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-slate-300 sm:text-xs"
              >
                Suhu &amp; intensitas partikel
              </label>
              <p className="mt-0.5 text-[10px] text-slate-400 sm:text-[11px]">
                Naikkan suhu untuk mempercepat gerak partikel
              </p>
            </div>
            <output
              htmlFor={sliderId}
              className="shrink-0 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm font-black tabular-nums text-cyan-100"
            >
              {temperature}°C
            </output>
          </div>

          <input
            id={sliderId}
            className="reaction-temperature-slider h-2 w-full cursor-pointer rounded-full"
            type="range"
            min={25}
            max={120}
            step={1}
            value={temperature}
            aria-label="Suhu simulasi dalam derajat Celsius"
            aria-describedby={instructionId}
            onChange={(event) => setTemperature(Number(event.target.value))}
            style={{
              background: `linear-gradient(90deg, #38bdf8 0%, #34d399 ${Math.max(
                18,
                temperatureProgress * 0.66
              )}%, #fbbf24 ${temperatureProgress}%, rgba(148,163,184,.22) ${temperatureProgress}%)`,
            }}
          />

          <div className="flex items-center justify-between gap-4 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-500 sm:text-[10px]">
            <span>25°C · lambat</span>
            <span>120°C · cepat</span>
          </div>
        </div>

        <p
          id={instructionId}
          className="pointer-events-none mx-auto mt-2.5 max-w-xl text-center text-[10px] font-medium text-slate-400 sm:text-[11px]"
        >
          {webglFailed
            ? "Mode visual ringan aktif karena WebGL tidak tersedia."
            : reducedMotion
              ? "Gerakan otomatis dimatikan mengikuti preferensi perangkat. Seret model untuk memutarnya."
              : "Seret ruang reaksi untuk melihat dari berbagai sudut · kilatan hijau menandai tumbukan efektif"}
        </p>
      </div>

      <style jsx global>{`
        .reaction-lab-demo .reaction-canvas.is-dragging {
          cursor: grabbing;
        }
        .reaction-lab-demo .reaction-temperature-slider {
          appearance: none;
          -webkit-appearance: none;
          outline: none;
        }
        .reaction-lab-demo .reaction-temperature-slider::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border: 3px solid #e0f2fe;
          border-radius: 9999px;
          background: #0ea5e9;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.18), 0 4px 12px rgba(2, 6, 23, 0.5);
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .reaction-lab-demo .reaction-temperature-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border: 3px solid #e0f2fe;
          border-radius: 9999px;
          background: #0ea5e9;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.18), 0 4px 12px rgba(2, 6, 23, 0.5);
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .reaction-lab-demo .reaction-temperature-slider:hover::-webkit-slider-thumb,
        .reaction-lab-demo .reaction-temperature-slider:focus-visible::-webkit-slider-thumb {
          transform: scale(1.1);
          box-shadow: 0 0 0 6px rgba(14, 165, 233, 0.23), 0 4px 14px rgba(2, 6, 23, 0.55);
        }
        .reaction-lab-demo .reaction-temperature-slider:focus-visible {
          box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.38);
        }
        @keyframes reaction-fallback-float {
          0%, 100% { transform: translate3d(0, 0, 0) scale(0.82); }
          50% { transform: translate3d(var(--fallback-x), var(--fallback-y), 0) scale(1.12); }
        }
        @keyframes reaction-fallback-pulse {
          0%, 58%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.25); }
          66% { opacity: 1; }
          82% { opacity: 0; transform: translate(-50%, -50%) scale(2.8); }
        }
        .reaction-lab-demo .reaction-fallback-particle {
          animation: reaction-fallback-float 3.4s ease-in-out infinite;
        }
        .reaction-lab-demo .reaction-fallback-flash {
          animation: reaction-fallback-pulse 3.4s ease-out infinite;
          box-shadow: 0 0 28px rgba(110, 231, 183, 0.88);
        }
        @media (prefers-reduced-motion: reduce) {
          .reaction-lab-demo .reaction-fallback-particle,
          .reaction-lab-demo .reaction-fallback-flash {
            animation: none;
          }
          .reaction-lab-demo .reaction-fallback-flash {
            opacity: 0.7;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </section>
  );
}
