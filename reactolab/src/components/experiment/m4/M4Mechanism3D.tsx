"use client";

import { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type MechanismMode = "tanpa" | "mno2" | "fecl3" | "katalase";

interface Props {
  mode: MechanismMode;
  progress: number;
  playing: boolean;
  reducedMotion: boolean;
  className?: string;
}

type TGroup = InstanceType<typeof THREE.Group>;
type TMesh = InstanceType<typeof THREE.Mesh>;
type TMaterial = InstanceType<typeof THREE.MeshStandardMaterial>;
type TVector3 = InstanceType<typeof THREE.Vector3>;

type MoleculeRig = {
  group: TGroup;
  leftO: TMesh;
  rightO: TMesh;
  leftH: TMesh;
  rightH: TMesh;
  ooBond: TMesh;
  leftBond: TMesh;
  rightBond: TMesh;
};

type ReactionRig = {
  group: TGroup;
  hydrogens: [TMesh, TMesh, TMesh, TMesh];
  oxygens: [TMesh, TMesh, TMesh, TMesh];
  bonds: [TMesh, TMesh, TMesh, TMesh, TMesh, TMesh];
};

type ReactionPath = {
  startA: TVector3;
  startB: TVector3;
  targetA: TVector3;
  targetB: TVector3;
  productOrigin: TVector3;
  angleA: number;
  angleB: number;
};

const MODE_LABELS: Record<MechanismMode, string> = {
  tanpa: "Tanpa katalis",
  mno2: "Katalis MnO₂",
  fecl3: "Katalis FeCl₃ dalam larutan",
  katalase: "Enzim katalase dari ekstrak hati",
};

const MODE_ACCENTS: Record<MechanismMode, number> = {
  tanpa: 0x64748b,
  mno2: 0x2563eb,
  fecl3: 0xd97706,
  katalase: 0x059669,
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

const between = (progress: number, start: number, end: number) =>
  smooth((progress - start) / (end - start));

function FallbackScene({ mode, progress }: Pick<Props, "mode" | "progress">) {
  const approach = between(progress, 0.02, 0.45);
  const product = between(progress, 0.56, 0.74);
  const accent = `#${MODE_ACCENTS[mode].toString(16).padStart(6, "0")}`;

  return (
    <div className="relative grid h-full min-h-[340px] place-items-center overflow-hidden bg-gradient-to-b from-white to-sky-50">
      <svg viewBox="0 0 720 430" className="h-full w-full" role="img" aria-label={`Visualisasi cadangan ${MODE_LABELS[mode]}`}>
        <defs>
          <radialGradient id="fallback-o"><stop stopColor="#fda4af"/><stop offset="1" stopColor="#b91c1c"/></radialGradient>
          <radialGradient id="fallback-h"><stop stopColor="#fff"/><stop offset="1" stopColor="#94a3b8"/></radialGradient>
        </defs>
        <rect width="720" height="430" fill="#f0f9ff" />
        {Array.from({ length: 18 }, (_, index) => (
          <circle key={index} cx={24 + (index * 91) % 680} cy={35 + (index * 57) % 355} r={2 + index % 3} fill={accent} opacity=".12" />
        ))}
        <g transform={`translate(${150 + approach * 190} 205)`} opacity={1 - product}>
          <line x1="-42" y1="-10" x2="-18" y2="0" stroke="#94a3b8" strokeWidth="7"/><line x1="-12" x2="12" stroke="#fecaca" strokeWidth="7"/><line x1="18" x2="42" y2="-10" stroke="#94a3b8" strokeWidth="7"/>
          <circle cx="-48" cy="-13" r="11" fill="url(#fallback-h)"/><circle cx="-18" r="19" fill="url(#fallback-o)"/><circle cx="18" r="19" fill="url(#fallback-o)"/><circle cx="48" cy="-13" r="11" fill="url(#fallback-h)"/>
        </g>
        <g transform={`translate(${570 - approach * 190} 230) rotate(180)`} opacity={1 - product}>
          <line x1="-42" y1="-10" x2="-18" y2="0" stroke="#94a3b8" strokeWidth="7"/><line x1="-12" x2="12" stroke="#fecaca" strokeWidth="7"/><line x1="18" x2="42" y2="-10" stroke="#94a3b8" strokeWidth="7"/>
          <circle cx="-48" cy="-13" r="11" fill="url(#fallback-h)"/><circle cx="-18" r="19" fill="url(#fallback-o)"/><circle cx="18" r="19" fill="url(#fallback-o)"/><circle cx="48" cy="-13" r="11" fill="url(#fallback-h)"/>
        </g>
        <g opacity={product} transform={`translate(360 ${230 - product * 90})`}>
          <circle cx="-45" r="21" fill="url(#fallback-o)"/><circle cx="45" r="21" fill="url(#fallback-o)"/><circle cx="0" cy="-35" r="21" fill="url(#fallback-o)"/>
          <text x="0" y="50" textAnchor="middle" fill={accent} fontSize="14" fontWeight="900">2 H₂O + O₂</text>
        </g>
      </svg>
      <p className="absolute bottom-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold text-slate-500 shadow-sm">
        WebGL tidak tersedia · menampilkan visualisasi ringan
      </p>
    </div>
  );
}

export default memo(function M4Mechanism3D({
  mode,
  progress,
  playing,
  reducedMotion,
  className,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ mode, progress, playing, reducedMotion });
  const [fallback, setFallback] = useState(false);
  stateRef.current = { mode, progress, playing, reducedMotion };

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
      setFallback(true);
      return;
    }

    const compact = window.innerWidth < 640;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.35 : 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0xf4f8fc, 1);

    const canvas = renderer.domElement;
    canvas.className = "block h-full w-full select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500";
    canvas.style.touchAction = "pan-y";
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `Scene 3D mekanisme penguraian H₂O₂: ${MODE_LABELS[stateRef.current.mode]}. Gunakan tombol panah untuk memutar dan tombol tambah atau kurang untuk memperbesar.`);
    host.appendChild(canvas);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(resource: T): T => {
      disposables.push(resource);
      return resource;
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f8fc);
    scene.fog = new THREE.Fog(0xf4f8fc, 7.5, 12);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb6ca, 2.3));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.25);
    rimLight.position.set(-4, 2, -4);
    scene.add(rimLight);
    const warmLight = new THREE.PointLight(0xfef3c7, 0.65, 10);
    warmLight.position.set(1.5, 2.5, 3);
    scene.add(warmLight);

    const root = new THREE.Group();
    scene.add(root);

    const sphereGeometry = track(new THREE.SphereGeometry(1, compact ? 14 : 20, compact ? 10 : 15));
    const bondGeometry = track(new THREE.CylinderGeometry(1, 1, 1, 12));
    const lowPolyGeometry = track(new THREE.IcosahedronGeometry(1, 1));
    const tinyGeometry = track(new THREE.SphereGeometry(1, 9, 7));

    const makeMaterial = (color: number, options?: { roughness?: number; metalness?: number; transparent?: boolean; opacity?: number; emissive?: number }) =>
      track(new THREE.MeshStandardMaterial({
        color,
        roughness: options?.roughness ?? 0.38,
        metalness: options?.metalness ?? 0,
        transparent: options?.transparent ?? false,
        opacity: options?.opacity ?? 1,
        emissive: options?.emissive ?? 0x000000,
        emissiveIntensity: options?.emissive ? 0.22 : 0,
      }));

    const hydrogenMaterial = makeMaterial(0xe2e8f0, { roughness: 0.24 });
    const oxygenMaterial = makeMaterial(0xef4444, { roughness: 0.3, emissive: 0x450a0a });
    const bondMaterial = makeMaterial(0xcbd5e1, { roughness: 0.28 });
    const weakBondMaterial = makeMaterial(0xf59e0b, { roughness: 0.32, emissive: 0x78350f });
    const waterMaterial = makeMaterial(0x38bdf8, { transparent: true, opacity: 0.09, roughness: 0.14 });
    const mnMaterial = makeMaterial(0x2563eb, { roughness: 0.26, emissive: 0x172554 });
    const surfaceDark = makeMaterial(0x1e293b, { roughness: 0.88 });
    const surfaceMid = makeMaterial(0x475569, { roughness: 0.82 });
    const surfaceLight = makeMaterial(0x64748b, { roughness: 0.76 });
    const ironAmbient = makeMaterial(0xf59e0b, { roughness: 0.27, emissive: 0x78350f });
    const proteinMaterials = [
      makeMaterial(0x059669, { roughness: 0.54 }),
      makeMaterial(0x10b981, { roughness: 0.46 }),
      makeMaterial(0x047857, { roughness: 0.58 }),
    ];
    const activePocketMaterial = makeMaterial(0xfbbf24, { roughness: 0.22, emissive: 0x92400e });

    const makeSphere = (parent: TGroup, material: TMaterial, radius: number) => {
      const mesh = new THREE.Mesh(sphereGeometry, material);
      mesh.scale.setScalar(radius);
      parent.add(mesh);
      return mesh;
    };

    const setBond = (bond: TMesh, start: TVector3, end: TVector3, radius: number) => {
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      bond.position.copy(start).add(end).multiplyScalar(0.5);
      bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      bond.scale.set(radius, length, radius);
    };

    const makeBond = (parent: TGroup, material: TMaterial, start: TVector3, end: TVector3, radius = 0.045) => {
      const mesh = new THREE.Mesh(bondGeometry, material);
      setBond(mesh, start, end, radius);
      parent.add(mesh);
      return mesh;
    };

    const createH2O2 = (parent: TGroup, scale = 1): MoleculeRig => {
      const group = new THREE.Group();
      group.scale.setScalar(scale);
      parent.add(group);
      const leftO = makeSphere(group, oxygenMaterial, 0.2);
      const rightO = makeSphere(group, oxygenMaterial, 0.2);
      const leftH = makeSphere(group, hydrogenMaterial, 0.115);
      const rightH = makeSphere(group, hydrogenMaterial, 0.115);
      leftO.position.set(-0.18, 0, 0);
      rightO.position.set(0.18, 0, 0);
      leftH.position.set(-0.46, 0.13, 0);
      rightH.position.set(0.46, 0.13, 0);
      const ooBond = makeBond(group, bondMaterial, new THREE.Vector3(-0.18, 0, 0), new THREE.Vector3(0.18, 0, 0), 0.055);
      const leftBond = makeBond(group, bondMaterial, new THREE.Vector3(-0.46, 0.13, 0), new THREE.Vector3(-0.18, 0, 0), 0.048);
      const rightBond = makeBond(group, bondMaterial, new THREE.Vector3(0.18, 0, 0), new THREE.Vector3(0.46, 0.13, 0), 0.048);
      return { group, leftO, rightO, leftH, rightH, ooBond, leftBond, rightBond };
    };

    const createReactionRig = (parent: TGroup, scale = 0.9): ReactionRig => {
      const group = new THREE.Group();
      group.scale.setScalar(scale);
      parent.add(group);
      const hydrogens = [
        makeSphere(group, hydrogenMaterial, 0.115),
        makeSphere(group, hydrogenMaterial, 0.115),
        makeSphere(group, hydrogenMaterial, 0.115),
        makeSphere(group, hydrogenMaterial, 0.115),
      ] as [TMesh, TMesh, TMesh, TMesh];
      const oxygens = [
        makeSphere(group, oxygenMaterial, 0.2),
        makeSphere(group, oxygenMaterial, 0.2),
        makeSphere(group, oxygenMaterial, 0.2),
        makeSphere(group, oxygenMaterial, 0.2),
      ] as [TMesh, TMesh, TMesh, TMesh];
      const zero = new THREE.Vector3();
      const bonds = Array.from({ length: 6 }, () =>
        makeBond(group, bondMaterial, zero, new THREE.Vector3(0.01, 0, 0), 0.048),
      ) as [TMesh, TMesh, TMesh, TMesh, TMesh, TMesh];
      return { group, hydrogens, oxygens, bonds };
    };

    const updateReactionRig = (
      reaction: ReactionRig,
      progressValue: number,
      path: ReactionPath,
    ) => {
      const approach = between(progressValue, 0.02, 0.38);
      const activation = between(progressValue, 0.34, 0.58);
      const rearrange = between(progressValue, 0.52, 0.76);
      const release = between(progressValue, 0.68, 0.97);
      const oxygenGap = 0.18 + activation * (1 - rearrange) * 0.12;
      const hydrogenGap = 0.46 + activation * (1 - rearrange) * 0.05;

      const centerA = path.startA.clone().lerp(path.targetA, approach);
      const centerB = path.startB.clone().lerp(path.targetB, approach);
      const rotateOffset = (x: number, y: number, angle: number) =>
        new THREE.Vector3(
          x * Math.cos(angle) - y * Math.sin(angle),
          x * Math.sin(angle) + y * Math.cos(angle),
          0,
        );
      const atMolecule = (
        center: TVector3,
        angle: number,
        x: number,
        y: number,
      ) => center.clone().add(rotateOffset(x, y, angle));

      // The same eight atoms remain present throughout the whole reaction.
      const reactantPositions = [
        atMolecule(centerA, path.angleA, -hydrogenGap, 0.13),
        atMolecule(centerA, path.angleA, hydrogenGap, 0.13),
        atMolecule(centerB, path.angleB, -hydrogenGap, 0.13),
        atMolecule(centerB, path.angleB, hydrogenGap, 0.13),
        atMolecule(centerA, path.angleA, -oxygenGap, 0),
        atMolecule(centerA, path.angleA, oxygenGap, 0),
        atMolecule(centerB, path.angleB, -oxygenGap, 0),
        atMolecule(centerB, path.angleB, oxygenGap, 0),
      ];

      const origin = path.productOrigin;
      const waterSpread = 0.48 + release * 0.72;
      const waterRise = 0.05 + release * 0.42;
      const oxygenRise = 0.42 + release * 1.05;
      const productPositions = [
        origin.clone().add(new THREE.Vector3(-waterSpread - 0.25, waterRise + 0.15, 0.13)),
        origin.clone().add(new THREE.Vector3(-waterSpread + 0.25, waterRise + 0.15, 0.13)),
        origin.clone().add(new THREE.Vector3(waterSpread - 0.25, waterRise + 0.15, -0.13)),
        origin.clone().add(new THREE.Vector3(waterSpread + 0.25, waterRise + 0.15, -0.13)),
        origin.clone().add(new THREE.Vector3(-waterSpread, waterRise, 0.13)),
        origin.clone().add(new THREE.Vector3(-0.18, oxygenRise, 0)),
        origin.clone().add(new THREE.Vector3(waterSpread, waterRise, -0.13)),
        origin.clone().add(new THREE.Vector3(0.18, oxygenRise, 0)),
      ];

      const atomPositions = reactantPositions.map((position, index) =>
        position.clone().lerp(productPositions[index], rearrange),
      );
      reaction.hydrogens.forEach((atom, index) =>
        atom.position.copy(atomPositions[index]),
      );
      reaction.oxygens.forEach((atom, index) =>
        atom.position.copy(atomPositions[index + 4]),
      );

      const [h1, h2, h3, h4] = reaction.hydrogens.map(
        (atom) => atom.position,
      );
      const [o1, o2, o3, o4] = reaction.oxygens.map(
        (atom) => atom.position,
      );

      // H1–O1 and H3–O3 survive continuously and become the first O–H
      // bonds of the two water molecules.
      setBond(reaction.bonds[0], h1, o1, 0.048);
      setBond(reaction.bonds[3], h3, o3, 0.048);
      reaction.bonds[0].material = bondMaterial;
      reaction.bonds[3].material = bondMaterial;

      const beforeRewire = rearrange < 0.5;
      const rewireStrength = smooth(Math.abs(rearrange - 0.5) * 2);
      const rewireRadius = 0.048 * rewireStrength;
      const setRewiredBond = (
        bond: TMesh,
        reactantStart: TVector3,
        reactantEnd: TVector3,
        productStart: TVector3,
        productEnd: TVector3,
        productDouble = false,
      ) => {
        const start = beforeRewire ? reactantStart : productStart;
        const end = beforeRewire ? reactantEnd : productEnd;
        bond.visible = rewireRadius > 0.004;
        if (bond.visible) setBond(bond, start, end, rewireRadius);
        bond.material =
          beforeRewire && activation > 0.18
            ? weakBondMaterial
            : productDouble
              ? bondMaterial
              : bondMaterial;
      };

      // O–O bonds first lengthen and disappear. The same bond meshes then
      // reform as the second O–H bonds and the double bond in O2.
      setRewiredBond(reaction.bonds[1], o1, o2, h2, o1);
      setRewiredBond(
        reaction.bonds[2],
        o2,
        h2,
        o2.clone().add(new THREE.Vector3(0, 0.045, 0)),
        o4.clone().add(new THREE.Vector3(0, 0.045, 0)),
        true,
      );
      setRewiredBond(reaction.bonds[4], o3, o4, h4, o3);
      setRewiredBond(
        reaction.bonds[5],
        o4,
        h4,
        o2.clone().add(new THREE.Vector3(0, -0.045, 0)),
        o4.clone().add(new THREE.Vector3(0, -0.045, 0)),
        true,
      );
    };

    const modeGroups: Record<MechanismMode, TGroup> = {
      tanpa: new THREE.Group(),
      mno2: new THREE.Group(),
      fecl3: new THREE.Group(),
      katalase: new THREE.Group(),
    };
    Object.values(modeGroups).forEach((group) => root.add(group));

    // A translucent volume and suspended specks establish the solution in 3D.
    const solutionVolume = new THREE.Mesh(track(new THREE.BoxGeometry(5.2, 3.5, 2.7)), waterMaterial);
    solutionVolume.position.y = 0.05;
    root.add(solutionVolume);
    const speckMaterial = makeMaterial(MODE_ACCENTS[stateRef.current.mode], { transparent: true, opacity: 0.28, roughness: 0.4 });
    const specks = Array.from({ length: 28 }, (_, index) => {
      const mesh = new THREE.Mesh(tinyGeometry, speckMaterial);
      mesh.scale.setScalar(0.018 + (index % 4) * 0.008);
      mesh.position.set(
        -2.35 + ((index * 79) % 470) / 100,
        -1.35 + ((index * 53) % 270) / 100,
        -1.12 + ((index * 41) % 220) / 100,
      );
      root.add(mesh);
      return { mesh, baseY: mesh.position.y, phase: index * 0.73 };
    });

    // No-catalyst scene: free molecules and an infrequent energetic collision.
    const noGroup = modeGroups.tanpa;
    const noBackground = [
      [-1.75, 1.05, -0.7, 0.38],
      [1.75, 1.12, -0.6, 0.35],
      [-1.8, -0.85, 0.55, 0.34],
      [1.75, -0.92, 0.62, 0.37],
      [0, 1.25, -0.9, 0.3],
    ].map(([x, y, z, scale], index) => {
      const molecule = createH2O2(noGroup, scale);
      molecule.group.position.set(x, y, z);
      molecule.group.rotation.set(index * 0.22, index * 0.47, index * 0.31);
      return { molecule, baseY: y, phase: index * 1.31 };
    });
    const noReaction = createReactionRig(noGroup, 0.9);
    const noPath: ReactionPath = {
      startA: new THREE.Vector3(-1.62, 0.16, 0.18),
      startB: new THREE.Vector3(1.62, -0.16, -0.12),
      targetA: new THREE.Vector3(-0.42, 0.1, 0.1),
      targetB: new THREE.Vector3(0.42, -0.1, -0.08),
      productOrigin: new THREE.Vector3(0, 0, 0.03),
      angleA: 0.2,
      angleB: Math.PI - 0.18,
    };
    const collisionRing = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.47, 0.025, 9, 36)),
      weakBondMaterial,
    );
    collisionRing.visible = false;
    noGroup.add(collisionRing);

    // MnO2 scene: a genuinely uneven solid surface with pores and active sites.
    const mnGroup = modeGroups.mno2;
    const mineralBase = new THREE.Mesh(track(new THREE.BoxGeometry(4.8, 0.55, 2.8)), surfaceDark);
    mineralBase.position.y = -1.35;
    mnGroup.add(mineralBase);
    const rocks = Array.from({ length: 38 }, (_, index) => {
      const mesh = new THREE.Mesh(lowPolyGeometry, index % 3 === 0 ? surfaceLight : index % 2 === 0 ? surfaceMid : surfaceDark);
      const column = index % 10;
      const row = Math.floor(index / 10);
      mesh.position.set(-2.15 + column * 0.48 + (row % 2) * 0.11, -1.02 + (index % 4) * 0.035, -1.02 + row * 0.62);
      mesh.scale.set(0.3 + (index % 4) * 0.045, 0.2 + (index % 5) * 0.035, 0.3 + (index % 3) * 0.05);
      mesh.rotation.set(index * 0.41, index * 0.73, index * 0.29);
      mnGroup.add(mesh);
      return mesh;
    });
    const poreMaterial = makeMaterial(0x020617, { roughness: 1 });
    Array.from({ length: 8 }, (_, index) => {
      const pore = new THREE.Mesh(track(new THREE.TorusGeometry(0.13 + (index % 3) * 0.025, 0.035, 8, 20)), poreMaterial);
      pore.rotation.x = Math.PI / 2;
      pore.position.set(-1.75 + (index % 4) * 1.15, -0.82, -0.72 + Math.floor(index / 4) * 1.28);
      pore.scale.y = 0.7;
      mnGroup.add(pore);
      return pore;
    });
    const mnSites = [-0.72, 0, 0.78].map((x, index) => {
      const material = index === 1 ? makeMaterial(0x2563eb, { roughness: 0.24, emissive: 0x172554 }) : mnMaterial;
      const site = makeSphere(mnGroup, material, index === 1 ? 0.25 : 0.19);
      site.position.set(x, -0.74 + (index % 2) * 0.06, 0.18 - index * 0.1);
      return { site, material };
    });
    const mnReaction = createReactionRig(mnGroup, 0.84);
    const mnPath: ReactionPath = {
      startA: new THREE.Vector3(-0.82, 1.35, 0.25),
      startB: new THREE.Vector3(0.86, 1.5, -0.12),
      targetA: new THREE.Vector3(-0.4, -0.38, 0.14),
      targetB: new THREE.Vector3(0.4, -0.34, -0.08),
      productOrigin: new THREE.Vector3(0, -0.38, 0.08),
      angleA: -0.12,
      angleB: Math.PI + 0.1,
    };
    const mnNext = createH2O2(mnGroup, 0.5);
    mnNext.group.visible = false;

    // FeCl3 scene: discrete iron species suspended throughout a homogeneous solution.
    const feGroup = modeGroups.fecl3;
    const ambientIron = [
      [-1.9, 1.02, -0.55, 0.17],
      [1.82, 1.0, -0.68, 0.15],
      [-1.85, -0.9, 0.65, 0.16],
      [1.9, -0.82, 0.58, 0.18],
    ].map(([x, y, z, radius], index) => {
      const ion = makeSphere(feGroup, ironAmbient, radius);
      ion.position.set(x, y, z);
      return { ion, baseY: y, phase: index * 1.43 };
    });
    const centralFeMaterial = makeMaterial(0xf59e0b, { roughness: 0.24, emissive: 0x78350f });
    const centralFe = makeSphere(feGroup, centralFeMaterial, 0.36);
    const feHalo = new THREE.Mesh(track(new THREE.TorusGeometry(0.48, 0.025, 10, 40)), ironAmbient);
    feHalo.rotation.x = Math.PI / 2;
    feGroup.add(feHalo);
    const feReaction = createReactionRig(feGroup, 0.82);
    const fePath: ReactionPath = {
      startA: new THREE.Vector3(-1.65, 0.22, 0.12),
      startB: new THREE.Vector3(1.65, -0.28, -0.15),
      targetA: new THREE.Vector3(-0.48, 0.13, 0.08),
      targetB: new THREE.Vector3(0.48, -0.13, -0.08),
      productOrigin: new THREE.Vector3(0, 0, 0.04),
      angleA: 0.16,
      angleB: Math.PI - 0.16,
    };
    const electron = makeSphere(feGroup, activePocketMaterial, 0.08);
    electron.visible = false;

    // Catalase scene: low-poly protein lobes surrounding a distinct active pocket.
    const enzymeGroup = new THREE.Group();
    enzymeGroup.position.x = -0.45;
    const proteinLayout = [
      [-0.75, 0.72, 0.05, 0.63], [-0.18, 0.9, -0.08, 0.58], [0.3, 0.7, 0.02, 0.52],
      [-0.95, 0.12, -0.1, 0.7], [-0.42, 0.25, 0.18, 0.66], [0.12, 0.25, -0.12, 0.5],
      [-0.86, -0.55, 0.06, 0.64], [-0.25, -0.72, -0.08, 0.7], [0.35, -0.56, 0.02, 0.54],
      [-0.24, 0.08, -0.48, 0.55], [-0.4, 0.05, 0.5, 0.52],
    ] as const;
    proteinLayout.forEach(([x, y, z, scale], index) => {
      const lobe = new THREE.Mesh(lowPolyGeometry, proteinMaterials[index % proteinMaterials.length]);
      lobe.position.set(x, y, z);
      lobe.scale.set(scale, scale * (0.86 + (index % 3) * 0.08), scale * 0.82);
      lobe.rotation.set(index * 0.29, index * 0.53, index * 0.37);
      enzymeGroup.add(lobe);
    });
    const pocketRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.34, 0.065, 12, 42)), activePocketMaterial);
    pocketRing.position.set(0.42, 0.06, 0.56);
    enzymeGroup.add(pocketRing);
    const pocketCore = makeSphere(enzymeGroup, activePocketMaterial, 0.13);
    pocketCore.position.set(0.42, 0.06, 0.42);
    modeGroups.katalase.add(enzymeGroup);
    const enzymeReaction = createReactionRig(modeGroups.katalase, 0.72);
    const enzymePath: ReactionPath = {
      startA: new THREE.Vector3(1.82, 0.28, 0.48),
      startB: new THREE.Vector3(1.92, -0.38, 0.28),
      targetA: new THREE.Vector3(0.18, 0.16, 0.48),
      targetB: new THREE.Vector3(0.28, -0.18, 0.36),
      productOrigin: new THREE.Vector3(0.08, 0.08, 0.5),
      angleA: -0.12,
      angleB: Math.PI + 0.1,
    };
    const enzymeNext = createH2O2(modeGroups.katalase, 0.48);
    enzymeNext.group.visible = false;

    const floorMaterial = makeMaterial(0xdbe6ef, { roughness: 0.95, transparent: true, opacity: 0.5 });
    const floor = new THREE.Mesh(track(new THREE.CircleGeometry(3.5, 48)), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.64;
    root.add(floor);

    const orbit = {
      azimuth: 0.25,
      polar: 1.24,
      distance: 6.25,
      dragging: false,
      lastX: 0,
      lastY: 0,
      userUntil: 0,
    };

    const onPointerDown = (event: PointerEvent) => {
      orbit.dragging = true;
      orbit.lastX = event.clientX;
      orbit.lastY = event.clientY;
      orbit.userUntil = performance.now() + 5000;
      canvas.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!orbit.dragging) return;
      orbit.azimuth += (event.clientX - orbit.lastX) * 0.007;
      orbit.polar = Math.min(1.62, Math.max(0.72, orbit.polar + (event.clientY - orbit.lastY) * 0.005));
      orbit.lastX = event.clientX;
      orbit.lastY = event.clientY;
      orbit.userUntil = performance.now() + 5000;
    };
    const onPointerUp = (event: PointerEvent) => {
      orbit.dragging = false;
      if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture?.(event.pointerId);
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      orbit.distance = Math.min(8.2, Math.max(4.25, orbit.distance + event.deltaY * 0.004));
      orbit.userUntil = performance.now() + 5000;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      let handled = true;
      if (event.key === "ArrowLeft") orbit.azimuth -= 0.13;
      else if (event.key === "ArrowRight") orbit.azimuth += 0.13;
      else if (event.key === "ArrowUp") orbit.polar = Math.max(0.72, orbit.polar - 0.1);
      else if (event.key === "ArrowDown") orbit.polar = Math.min(1.62, orbit.polar + 0.1);
      else if (event.key === "+" || event.key === "=") orbit.distance = Math.max(4.25, orbit.distance - 0.35);
      else if (event.key === "-" || event.key === "_") orbit.distance = Math.min(8.2, orbit.distance + 0.35);
      else handled = false;
      if (handled) {
        event.preventDefault();
        orbit.userUntil = performance.now() + 5000;
      }
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("keydown", onKeyDown);
    const onContextLost = (event: Event) => {
      event.preventDefault();
      setFallback(true);
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    let aspect = 1;
    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      aspect = width / height;
      camera.aspect = aspect;
      camera.fov = aspect < 1.15 ? 46 : 38;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let currentMode: MechanismMode | null = null;
    let onScreen = true;
    let pageVisible = document.visibilityState !== "hidden";
    let frame = 0;
    let loopRunning = false;
    let previousTime = performance.now();
    let previousRender = 0;
    let visualTime = 0;

    const baseScale = new THREE.Vector3(1, 1, 1);
    const blueColor = new THREE.Color(0x2563eb);
    const greenColor = new THREE.Color(0x10b981);
    const amberColor = new THREE.Color(0xf59e0b);
    const purpleColor = new THREE.Color(0x8b5cf6);

    const updateNoCatalyst = (p: number, time: number) => {
      const activation = between(p, 0.38, 0.6);
      updateReactionRig(noReaction, p, noPath);
      collisionRing.visible = activation > 0.04 && p < 0.72;
      collisionRing.position.set(0, 0.02, 0.05);
      collisionRing.scale.setScalar(0.7 + activation * 0.55);
      collisionRing.rotation.y = time * 0.35;
      noBackground.forEach(({ molecule, baseY, phase }, index) => {
        molecule.group.position.y = baseY + Math.sin(time * 0.55 + phase) * 0.07;
        molecule.group.rotation.y += stateRef.current.playing && !stateRef.current.reducedMotion ? 0.002 + index * 0.00015 : 0;
      });
    };

    const updateMn = (p: number, time: number) => {
      const activation = between(p, 0.38, 0.61);
      const regeneration = between(p, 0.78, 0.98);
      const changed = activation * (1 - regeneration);
      updateReactionRig(mnReaction, p, mnPath);
      mnSites[1].material.color.copy(blueColor).lerp(greenColor, changed);
      mnSites[1].site.scale.setScalar(0.25 * (1 + Math.sin(time * 4) * 0.035 * changed));
      mnNext.group.visible = regeneration > 0.02;
      mnNext.group.position.set(3.15 - regeneration * 1.15, 1.08, -0.3);
      mnNext.group.rotation.y = -0.4;
      mnNext.group.scale.setScalar(0.5);
      rocks.forEach((rock, index) => {
        if (index % 7 === 0) rock.rotation.y += stateRef.current.playing && !stateRef.current.reducedMotion ? 0.0004 : 0;
      });
    };

    const updateFe = (p: number, time: number) => {
      const activation = between(p, 0.35, 0.6);
      const regeneration = between(p, 0.78, 0.98);
      const reduced = activation * (1 - regeneration);
      updateReactionRig(feReaction, p, fePath);
      centralFeMaterial.color.copy(amberColor).lerp(purpleColor, reduced);
      centralFe.scale.setScalar(0.36 * (1 + reduced * 0.11));
      feHalo.rotation.z = time * 0.28;
      feHalo.material = reduced > 0.45 ? weakBondMaterial : ironAmbient;
      electron.visible = reduced > 0.12;
      const angle = p * Math.PI * 2.4;
      electron.position.set(Math.cos(angle) * 0.56, 0.15 + Math.sin(angle) * 0.3, Math.sin(angle * 0.7) * 0.28);
      ambientIron.forEach(({ ion, baseY, phase }, index) => {
        ion.position.y = baseY + Math.sin(time * 0.72 + phase) * 0.08;
        ion.rotation.y += stateRef.current.playing && !stateRef.current.reducedMotion ? 0.003 + index * 0.0002 : 0;
      });
    };

    const updateCatalase = (p: number, time: number) => {
      const binding = between(p, 0.22, 0.45);
      const activation = between(p, 0.4, 0.62);
      const regeneration = between(p, 0.78, 0.98);
      const bound = binding * (1 - regeneration);
      updateReactionRig(enzymeReaction, p, enzymePath);
      const pulse = 1 + bound * 0.025 + (!stateRef.current.reducedMotion ? Math.sin(time * 2.2) * 0.006 : 0);
      enzymeGroup.scale.copy(baseScale).multiplyScalar(pulse);
      enzymeGroup.rotation.y = -0.16 + bound * 0.05;
      pocketCore.scale.setScalar(0.13 * (1 + activation * 0.28));
      enzymeNext.group.visible = regeneration > 0.02;
      enzymeNext.group.position.set(3.1 - regeneration * 1.1, 1.08, -0.2);
      enzymeNext.group.scale.setScalar(0.48);
      enzymeNext.group.rotation.y = -0.3;
    };

    const renderFrame = (now: number) => {
      const state = stateRef.current;
      const frameInterval = state.reducedMotion ? 1000 / 18 : 1000 / 30;
      if (now - previousRender < frameInterval) {
        if (loopRunning) frame = requestAnimationFrame(renderFrame);
        return;
      }
      const delta = Math.min(0.05, Math.max(0, (now - previousTime) / 1000));
      previousTime = now;
      previousRender = now;
      if (state.playing && !state.reducedMotion) visualTime += delta;

      if (state.mode !== currentMode) {
        currentMode = state.mode;
        Object.entries(modeGroups).forEach(([key, group]) => {
          group.visible = key === state.mode;
        });
        speckMaterial.color.setHex(MODE_ACCENTS[state.mode]);
        canvas.setAttribute("aria-label", `Scene 3D mekanisme penguraian H₂O₂: ${MODE_LABELS[state.mode]}. Gunakan tombol panah untuk memutar dan tombol tambah atau kurang untuk memperbesar.`);
      }

      const p = clamp01(state.progress);
      if (state.mode === "tanpa") updateNoCatalyst(p, visualTime);
      else if (state.mode === "mno2") updateMn(p, visualTime);
      else if (state.mode === "fecl3") updateFe(p, visualTime);
      else updateCatalase(p, visualTime);

      specks.forEach(({ mesh, baseY, phase }) => {
        mesh.position.y = baseY + (!state.reducedMotion ? Math.sin(visualTime * 0.55 + phase) * 0.045 : 0);
      });

      if (state.playing && !state.reducedMotion && now > orbit.userUntil && !orbit.dragging) {
        orbit.azimuth += delta * 0.055;
      }
      const responsiveDistance = orbit.distance * (aspect < 1.1 ? 1.12 : 1);
      const sinPolar = Math.sin(orbit.polar);
      camera.position.set(
        responsiveDistance * sinPolar * Math.sin(orbit.azimuth),
        responsiveDistance * Math.cos(orbit.polar) + 0.05,
        responsiveDistance * sinPolar * Math.cos(orbit.azimuth),
      );
      camera.lookAt(0, -0.05, 0);
      renderer.render(scene, camera);
      if (loopRunning) frame = requestAnimationFrame(renderFrame);
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        syncLoop();
      },
      { threshold: 0.02 },
    );
    intersectionObserver.observe(host);

    const onVisibilityChange = () => {
      pageVisible = document.visibilityState !== "hidden";
      syncLoop();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    function syncLoop() {
      const shouldRun = onScreen && pageVisible;
      if (shouldRun && !loopRunning) {
        loopRunning = true;
        previousTime = performance.now();
        previousRender = 0;
        frame = requestAnimationFrame(renderFrame);
      } else if (!shouldRun && loopRunning) {
        loopRunning = false;
        cancelAnimationFrame(frame);
      }
    }
    syncLoop();

    return () => {
      loopRunning = false;
      cancelAnimationFrame(frame);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      disposables.forEach((resource) => resource.dispose());
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`relative h-full min-h-[350px] w-full overflow-hidden bg-slate-50 sm:min-h-[430px] lg:min-h-[480px] ${className ?? ""}`}
    >
      {fallback && <FallbackScene mode={mode} progress={progress} />}
      {!fallback && (
        <>
          <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full border border-white/90 bg-white/85 px-3 py-1.5 text-[9px] font-bold text-slate-500 shadow-sm backdrop-blur sm:text-[10px]">
            Seret untuk memutar · scroll untuk zoom
          </div>
          <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-blue-100 bg-white/85 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-blue-600 shadow-sm backdrop-blur">
            3D interaktif
          </div>
        </>
      )}
    </div>
  );
});
