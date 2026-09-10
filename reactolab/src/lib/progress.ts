import { MODULES, TOTAL_MODULES, getModuleDef } from "./module-defs";
import type { ModuleProgress, SectionProgress, StudentProgress } from "./types";

/** Fresh progress skeleton: Module 0 unlocked, the rest locked. */
export function buildProgressSkeleton(): StudentProgress {
  const modules: Record<string, ModuleProgress> = {};
  for (const def of MODULES) {
    const sections: Record<string, SectionProgress> = {};
    for (const s of def.sections) sections[s.id] = { status: "locked" };
    modules[String(def.id)] = {
      status: def.id === 0 ? "unlocked" : "locked",
      currentSection: null,
      completionPercent: 0,
      sections,
    };
  }
  return {
    currentModule: 0,
    currentSection: null,
    overallPercent: 0,
    lastActivityAt: Date.now(),
    modules,
  };
}

export function moduleCompletionPercent(mod: ModuleProgress, moduleId: number): number {
  const def = getModuleDef(moduleId);
  if (!def) return 0;
  const total = def.sections.length;
  const done = def.sections.filter(
    (s) => mod.sections?.[s.id]?.status === "completed"
  ).length;
  return Math.round((done / total) * 100);
}

export function overallPercent(progress: StudentProgress): number {
  let sum = 0;
  for (let i = 0; i < TOTAL_MODULES; i++) {
    const mod = progress.modules?.[String(i)];
    if (!mod) continue;
    sum += mod.status === "completed" ? 100 : moduleCompletionPercent(mod, i);
  }
  return Math.round(sum / TOTAL_MODULES);
}

/** Where should "Lanjutkan Pembelajaran" send the student? (PR-LEARN-SAVE-003) */
export function resumeTarget(progress: StudentProgress | null): {
  moduleId: number;
  label: string;
} | null {
  if (!progress) return { moduleId: 0, label: "Mulai Pembelajaran" };
  // 1) last in-progress module
  for (let i = 0; i < TOTAL_MODULES; i++) {
    const mod = progress.modules?.[String(i)];
    if (mod?.status === "in_progress")
      return { moduleId: i, label: "Lanjutkan Pembelajaran" };
  }
  // 2) first unlocked & not completed
  for (let i = 0; i < TOTAL_MODULES; i++) {
    const mod = progress.modules?.[String(i)];
    if (mod && mod.status === "unlocked")
      return {
        moduleId: i,
        label: progress.lastSavedAt ? "Lanjutkan Pembelajaran" : "Mulai Pembelajaran",
      };
  }
  // 3) everything completed
  const allDone = MODULES.every(
    (m) => progress.modules?.[String(m.id)]?.status === "completed"
  );
  if (allDone) return null;
  return { moduleId: 0, label: "Mulai Pembelajaran" };
}

export const MODULE_STATUS_LABEL: Record<string, string> = {
  locked: "Terkunci",
  unlocked: "Tersedia",
  in_progress: "Sedang Dikerjakan",
  completed: "Selesai",
};

export const SECTION_STATUS_LABEL: Record<string, string> = {
  locked: "Terkunci",
  active: "Aktif",
  completed: "Selesai",
};
