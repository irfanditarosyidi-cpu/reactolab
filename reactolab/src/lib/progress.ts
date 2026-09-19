import { MODULES, getModuleDef } from "./module-defs";
import type { ModuleProgress, SectionProgress, StudentProgress } from "./types";

export const CLOSING_MODULE_ID = 7;
export const CLOSING_PREREQUISITE_IDS = [1, 2, 3, 4, 5, 6] as const;

export function closingPrerequisitesComplete(progress: StudentProgress): boolean {
  return CLOSING_PREREQUISITE_IDS.every(
    (moduleId) => progress.modules?.[String(moduleId)]?.status === "completed"
  );
}

export function lockedModuleProgress(moduleId: number): ModuleProgress {
  const def = getModuleDef(moduleId);
  const sections: Record<string, SectionProgress> = {};
  for (const section of def?.sections ?? []) {
    sections[section.id] = { status: "locked" };
  }
  return {
    status: "locked",
    currentSection: null,
    completionPercent: 0,
    sections,
  };
}

/** Fresh progress skeleton: Module 1 unlocked, the rest locked. */
export function buildProgressSkeleton(): StudentProgress {
  const modules: Record<string, ModuleProgress> = {};
  const firstModuleId = MODULES[0]?.id ?? 1;
  for (const def of MODULES) {
    const sections: Record<string, SectionProgress> = {};
    for (const s of def.sections) sections[s.id] = { status: "locked" };
    modules[String(def.id)] = {
      status: def.id === firstModuleId ? "unlocked" : "locked",
      currentSection: null,
      completionPercent: 0,
      sections,
    };
  }
  return {
    currentModule: firstModuleId,
    currentSection: null,
    overallPercent: 0,
    lastActivityAt: Date.now(),
    modules,
  };
}

/** Remove legacy Module 0 data and make Module 1 the entry point. */
export function normalizeProgress(progress: StudentProgress): StudentProgress {
  const skeleton = buildProgressSkeleton();
  const modules = { ...skeleton.modules, ...(progress.modules ?? {}) };
  delete modules["0"];

  const firstModule = modules["1"];
  if (firstModule?.status === "locked") {
    modules["1"] = { ...firstModule, status: "unlocked" };
  }

  // Migrate the former stage-based Module 6 structure to the case-based flow.
  // Existing public CER/comments remain in their own database collections.
  const module6 = modules["6"];
  const hasLegacyModule6 = module6 && !module6.sections?.sectionCases;
  if (hasLegacyModule6) {
    const completed = module6.status === "completed";
    const inProgress = module6.status === "in_progress";
    const introCompleted = module6.sections?.section1?.status === "completed";
    const activeSection = !introCompleted ? "section1" : "sectionCases";
    modules["6"] = {
      ...module6,
      currentSection: completed || !inProgress ? null : activeSection,
      completionPercent: completed ? 100 : introCompleted ? 33 : 0,
      sections: {
        section1: completed || introCompleted
          ? { status: "completed", completedAt: module6.sections?.section1?.completedAt }
          : inProgress
            ? { status: "active", startedAt: module6.startedAt }
            : { status: "locked" },
        sectionCases: completed
          ? { status: "completed", completedAt: module6.completedAt }
          : introCompleted
            ? { status: "active", startedAt: Date.now() }
            : { status: "locked" },
        sectionConclusion: completed
          ? { status: "completed", completedAt: module6.completedAt }
          : { status: "locked" },
      },
    };
  }

  // Module 7 is only valid while every prerequisite module remains complete.
  const normalizedForPrerequisites = { ...progress, modules };
  if (!closingPrerequisitesComplete(normalizedForPrerequisites)) {
    modules[String(CLOSING_MODULE_ID)] = lockedModuleProgress(CLOSING_MODULE_ID);
  } else if (modules[String(CLOSING_MODULE_ID)]?.status === "locked") {
    modules[String(CLOSING_MODULE_ID)] = {
      ...modules[String(CLOSING_MODULE_ID)],
      status: "unlocked",
    };
  }

  const migratedCurrentSection =
    progress.currentModule === 6 && hasLegacyModule6
      ? modules["6"].currentSection
      : progress.currentSection === undefined
        ? null
        : progress.currentSection;

  return {
    ...progress,
    currentModule:
      progress.currentModule === 0 ? 1 : (progress.currentModule ?? 1),
    currentSection: progress.currentModule === 0 ? null : migratedCurrentSection,
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
  for (const def of MODULES) {
    const mod = progress.modules?.[String(def.id)];
    if (!mod) continue;
    sum += mod.status === "completed" ? 100 : moduleCompletionPercent(mod, def.id);
  }
  return Math.round(sum / MODULES.length);
}

/** Where should "Lanjutkan Pembelajaran" send the student? (PR-LEARN-SAVE-003) */
export function resumeTarget(progress: StudentProgress | null): {
  moduleId: number;
  label: string;
} | null {
  const firstModuleId = MODULES[0]?.id ?? 1;
  if (!progress) return { moduleId: firstModuleId, label: "Mulai Pembelajaran" };
  // 1) last in-progress module
  for (const def of MODULES) {
    const mod = progress.modules?.[String(def.id)];
    if (mod?.status === "in_progress")
      return { moduleId: def.id, label: "Lanjutkan Pembelajaran" };
  }
  // 2) first unlocked & not completed
  for (const def of MODULES) {
    const mod = progress.modules?.[String(def.id)];
    if (mod && mod.status === "unlocked")
      return {
        moduleId: def.id,
        label: progress.lastSavedAt ? "Lanjutkan Pembelajaran" : "Mulai Pembelajaran",
      };
  }
  // 3) everything completed
  const allDone = MODULES.every(
    (m) => progress.modules?.[String(m.id)]?.status === "completed"
  );
  if (allDone) return null;
  return { moduleId: firstModuleId, label: "Mulai Pembelajaran" };
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
