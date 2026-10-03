import { MODULES, getModuleDef } from "./module-defs";
import type { ModuleProgress, SectionProgress, StudentProgress } from "./types";

export const CLOSING_MODULE_ID = 6;
export const DISCUSSION_MODULE_ID = 5;
export const CLOSING_PREREQUISITE_IDS = [1, 2, 3, 4, 5] as const;

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

/** Fresh editable state for a module selected through Settings → Reset. */
export function resetModuleProgress(
  moduleId: number,
  attemptId?: string
): ModuleProgress {
  const def = getModuleDef(moduleId);
  if (!def) throw new Error("module-not-found");
  const sections: Record<string, SectionProgress> = {};
  for (const section of def.sections) {
    sections[section.id] = { status: "locked" };
  }
  return {
    status: "unlocked",
    currentSection: null,
    completionPercent: 0,
    sections,
    ...(moduleId === DISCUSSION_MODULE_ID && attemptId ? { attemptId } : {}),
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
  const storedModules = progress.modules ?? {};
  const hasLegacySevenModuleFlow = Boolean(storedModules["7"]);
  const migratedModules = hasLegacySevenModuleFlow
    ? {
        ...storedModules,
        // Konfirmasi Materi was removed from the student flow. The former
        // Forum (M6) and Closing (M7) now occupy M5 and M6.
        5: storedModules["6"] ?? skeleton.modules["5"],
        6: storedModules["7"] ?? skeleton.modules["6"],
      }
    : storedModules;
  const modules = { ...skeleton.modules, ...migratedModules };
  delete modules["0"];
  delete modules["7"];

  const firstModule = modules["1"];
  if (firstModule?.status === "locked") {
    modules["1"] = { ...firstModule, status: "unlocked" };
  }

  // Migrate the former stage-based forum structure to the case-based flow.
  // Existing public CER/comments remain in their own database collections.
  const discussionModule = modules[String(DISCUSSION_MODULE_ID)];
  const hasLegacyDiscussion =
    discussionModule && !discussionModule.sections?.sectionCases;
  if (hasLegacyDiscussion) {
    const completed = discussionModule.status === "completed";
    const inProgress = discussionModule.status === "in_progress";
    const introCompleted =
      discussionModule.sections?.section1?.status === "completed";
    const activeSection = !introCompleted ? "section1" : "sectionCases";
    modules[String(DISCUSSION_MODULE_ID)] = {
      ...discussionModule,
      currentSection: completed || !inProgress ? null : activeSection,
      completionPercent: completed ? 100 : introCompleted ? 33 : 0,
      sections: {
        section1: completed || introCompleted
          ? {
              status: "completed",
              completedAt: discussionModule.sections?.section1?.completedAt,
            }
          : inProgress
            ? { status: "active", startedAt: discussionModule.startedAt }
            : { status: "locked" },
        sectionCases: completed
          ? { status: "completed", completedAt: discussionModule.completedAt }
          : introCompleted
            ? { status: "active", startedAt: Date.now() }
            : { status: "locked" },
        sectionConclusion: completed
          ? { status: "completed", completedAt: discussionModule.completedAt }
          : { status: "locked" },
      },
    };
  }

  // Removing the old student confirmation module must not leave the forum
  // locked for learners who had already completed the four inquiry modules.
  const inquiryModulesComplete = [1, 2, 3, 4].every(
    (moduleId) => modules[String(moduleId)]?.status === "completed"
  );
  if (
    inquiryModulesComplete &&
    modules[String(DISCUSSION_MODULE_ID)]?.status === "locked"
  ) {
    modules[String(DISCUSSION_MODULE_ID)] = {
      ...modules[String(DISCUSSION_MODULE_ID)],
      status: "unlocked",
    };
  }

  // The closing module is only valid while every prerequisite remains complete.
  const normalizedForPrerequisites = { ...progress, modules };
  if (!closingPrerequisitesComplete(normalizedForPrerequisites)) {
    modules[String(CLOSING_MODULE_ID)] = lockedModuleProgress(CLOSING_MODULE_ID);
  } else if (modules[String(CLOSING_MODULE_ID)]?.status === "locked") {
    modules[String(CLOSING_MODULE_ID)] = {
      ...modules[String(CLOSING_MODULE_ID)],
      status: "unlocked",
    };
  }

  const currentModule = hasLegacySevenModuleFlow
    ? progress.currentModule >= 6
      ? progress.currentModule - 1
      : progress.currentModule === 5
        ? DISCUSSION_MODULE_ID
        : progress.currentModule
    : progress.currentModule;
  const migratedCurrentSection = hasLegacySevenModuleFlow
    ? currentModule >= DISCUSSION_MODULE_ID
      ? modules[String(currentModule)]?.currentSection ?? null
      : progress.currentSection ?? null
    : currentModule === DISCUSSION_MODULE_ID && hasLegacyDiscussion
      ? modules[String(DISCUSSION_MODULE_ID)].currentSection
      : progress.currentSection ?? null;

  const normalized: StudentProgress = {
    ...progress,
    currentModule:
      currentModule === 0 ? 1 : (currentModule ?? 1),
    currentSection: progress.currentModule === 0 ? null : migratedCurrentSection,
    modules,
  };
  normalized.overallPercent = overallPercent(normalized);
  const courseComplete = MODULES.every(
    (module) => modules[String(module.id)]?.status === "completed"
  );
  normalized.courseCompletedAt = courseComplete
    ? (progress.courseCompletedAt ?? progress.lastSavedAt ?? progress.lastActivityAt)
    : null;
  return normalized;
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
