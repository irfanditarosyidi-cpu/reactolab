"use client";

// ===== Single-Page Module Engine (PRD §10, §15, §29) =====
// One module = one page. Sections unlock sequentially. Drafts autosave as
// checkpoints (PR-LEARN-SAVE-001) without marking sections complete.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { get, ref, set, update } from "firebase/database";
import { db } from "@/lib/firebase/client";
import { P } from "@/lib/paths";
import {
  MODULES,
  getModuleDef,
  sectionIds,
  type ModuleDef,
} from "@/lib/module-defs";
import {
  buildProgressSkeleton,
  moduleCompletionPercent,
  normalizeProgress,
  overallPercent,
} from "@/lib/progress";
import { useAuth } from "@/lib/auth-context";
import type {
  ExperimentRun,
  ModuleProgress,
  OrientationMedia,
  SaveState,
  StudentProgress,
} from "@/lib/types";

export type DraftMap = Record<string, Record<string, unknown>>;

export interface EngineCtx {
  moduleId: number;
  def: ModuleDef;
  classId: string;
  uid: string;
  studentName: string;
  progress: StudentProgress;
  modProgress: ModuleProgress;
  drafts: DraftMap;
  runs: Record<string, ExperimentRun>;
  orientationMedia: OrientationMedia | null;
  saveState: SaveState;
  readOnlyAcademic: boolean;
  updateDraft: (sectionId: string, patch: Record<string, unknown>) => void;
  flushNow: () => Promise<boolean>;
  retrySave: () => void;
  completeSection: (
    sectionId: string,
    finalPatch?: Record<string, unknown>
  ) => Promise<void>;
  recordRun: (run: ExperimentRun) => Promise<void>;
  resetExperiment: () => Promise<void>;
  saveAndExit: () => Promise<void>;
  goToModule: (id: number) => void;
  exitToDashboard: () => Promise<void>;
}

const Ctx = createContext<EngineCtx | null>(null);

export function useEngine(): EngineCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useEngine must be used inside the module engine");
  return c;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function safeKey(s: string): string {
  return s.replace(/[.#$/[\]]/g, "_");
}

interface LoadedState {
  progress: StudentProgress;
  drafts: DraftMap;
  runs: Record<string, ExperimentRun>;
  orientationMedia: OrientationMedia | null;
}

export function ModuleEngineProvider({
  moduleId,
  children,
  renderLocked,
  renderLoading,
  renderNoClass,
}: {
  moduleId: number;
  children: React.ReactNode;
  renderLocked: (def: ModuleDef) => React.ReactNode;
  renderLoading: React.ReactNode;
  renderNoClass: React.ReactNode;
}) {
  const def = getModuleDef(moduleId)!;
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [state, setState] = useState<LoadedState | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [locked, setLocked] = useState(false);

  const classId = profile?.activeClassId ?? null;
  const uid = user?.uid ?? null;

  const pendingRef = useRef<Record<string, unknown>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<LoadedState | null>(null);
  stateRef.current = state;

  // ---------- initial load ----------
  useEffect(() => {
    if (loading || !uid) return;
    if (!classId) return; // handled by renderNoClass below
    let cancelled = false;

    (async () => {
      const progressSnap = await get(ref(db, P.progress(classId, uid)));
      const storedProgress: StudentProgress = progressSnap.exists()
        ? (progressSnap.val() as StudentProgress)
        : buildProgressSkeleton();
      let progress = normalizeProgress(storedProgress);
      if (
        !progressSnap.exists() ||
        JSON.stringify(progress) !== JSON.stringify(storedProgress)
      ) {
        await set(ref(db, P.progress(classId, uid)), progress);
      }

      const mod = progress.modules[String(moduleId)];
      if (mod.status === "locked") {
        if (!cancelled) setLocked(true);
        return;
      }

      const [respSnap, runsSnap, orientationMediaSnap] = await Promise.all([
        get(ref(db, P.moduleResponses(classId, uid, moduleId))),
        get(ref(db, P.expRuns(classId, uid, moduleId))),
        get(ref(db, P.orientationMedia(classId, moduleId))),
      ]);
      const drafts: DraftMap = respSnap.exists()
        ? (respSnap.val() as DraftMap)
        : {};
      const runs: Record<string, ExperimentRun> = runsSnap.exists()
        ? (runsSnap.val() as Record<string, ExperimentRun>)
        : {};
      const orientationMedia = orientationMediaSnap.exists()
        ? (orientationMediaSnap.val() as OrientationMedia)
        : null;

      // opening transitions (unlocked → in_progress, PR-STU-DASH-003)
      const now = Date.now();
      const p = clone(progress);
      const m = p.modules[String(moduleId)];
      if (m.status === "unlocked") {
        m.status = "in_progress";
        m.startedAt = now;
        m.currentSection = "section1";
        const first = m.sections?.section1;
        if (!first || first.status === "locked") {
          m.sections = { ...m.sections, section1: { status: "active", startedAt: now } };
        }
      }
      m.lastOpenedAt = now;
      m.currentSection = m.currentSection ?? null;
      p.currentModule = moduleId;
      p.currentSection = m.currentSection;
      p.lastActivityAt = now;
      await set(ref(db, P.progress(classId, uid)), p);

      if (!cancelled) {
        setState({ progress: p, drafts, runs, orientationMedia });
        // Resume scroll: jump to the active section (PR-LEARN-SAVE-003)
        const target = m.currentSection;
        if (target) {
          setTimeout(() => {
            document
              .getElementById(`sec-${target}`)
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 450);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, uid, classId, moduleId]);

  // ---------- checkpoint saver ----------
  const flushNow = useCallback(async (): Promise<boolean> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const batch = pendingRef.current;
    if (!classId || !uid || Object.keys(batch).length === 0) {
      setSaveState((s) => (s === "saving" ? "saved" : s));
      return true;
    }
    pendingRef.current = {};
    const base = P.progress(classId, uid);
    batch[`${base}/lastSavedAt`] = Date.now();
    batch[`${base}/lastActivityAt`] = Date.now();
    try {
      await update(ref(db), batch);
      setSaveState("saved");
      return true;
    } catch {
      // keep data for retry (PR-LEARN-SAVE-006)
      pendingRef.current = { ...batch, ...pendingRef.current };
      setSaveState("error");
      return false;
    }
  }, [classId, uid]);

  const queue = useCallback(
    (updates: Record<string, unknown>) => {
      Object.assign(pendingRef.current, updates);
      setSaveState("saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flushNow();
      }, 900);
    },
    [flushNow]
  );

  // flush when the tab goes to background; never rely on unload alone
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flushNow();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      void flushNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flushNow]);

  const updateDraft = useCallback(
    (sectionId: string, patch: Record<string, unknown>) => {
      if (!classId || !uid) return;
      setState((prev) => {
        if (!prev) return prev;
        const nextSection = { ...(prev.drafts[sectionId] ?? {}), ...patch };
        const drafts = { ...prev.drafts, [sectionId]: nextSection };
        queue({
          [P.sectionResponse(classId, uid, moduleId, sectionId)]: nextSection,
        });
        return { ...prev, drafts };
      });
    },
    [classId, uid, moduleId, queue]
  );

  // ---------- section completion & sequential unlock (PRD §10.3) ----------
  const completeSection = useCallback(
    async (sectionId: string, finalPatch?: Record<string, unknown>) => {
      const st = stateRef.current;
      if (!st || !classId || !uid) return;
      const now = Date.now();
      const ids = sectionIds(def);
      const idx = ids.indexOf(sectionId);
      const nextId = idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null;

      const drafts: DraftMap = finalPatch
        ? {
            ...st.drafts,
            [sectionId]: { ...(st.drafts[sectionId] ?? {}), ...finalPatch },
          }
        : st.drafts;

      const p = clone(st.progress);
      const m = p.modules[String(moduleId)];
      m.sections = { ...m.sections };
      m.sections[sectionId] = {
        ...(m.sections[sectionId] ?? {}),
        status: "completed",
        completedAt: now,
      };
      if (nextId) {
        const nx = m.sections[nextId];
        if (!nx || nx.status === "locked") {
          m.sections[nextId] = { status: "active", startedAt: now };
        }
        m.currentSection = nextId;
        p.currentSection = nextId;
      } else {
        // last section → the module itself is completed (PRD §15.2)
        m.status = "completed";
        m.completedAt = now;
        m.currentSection = null;
        p.currentSection = null;
        const nextMod = p.modules[String(moduleId + 1)];
        if (nextMod && nextMod.status === "locked") {
          nextMod.status = "unlocked"; // PR-LEARN-SAVE-004
        }
        const courseComplete = MODULES.every(
          (module) => p.modules[String(module.id)]?.status === "completed"
        );
        p.courseCompletedAt = courseComplete
          ? (p.courseCompletedAt ?? now)
          : null;
      }
      m.completionPercent = moduleCompletionPercent(m, moduleId);
      p.currentModule = moduleId;
      p.overallPercent = overallPercent(p);
      p.lastActivityAt = now;
      p.lastSavedAt = now;

      const updates: Record<string, unknown> = {
        [P.progress(classId, uid)]: p,
        [P.sectionResponse(classId, uid, moduleId, sectionId)]:
          drafts[sectionId] ?? null,
      };

      // Finalize/rebuild LKPD whenever a completed inquiry module makes all
      // Modules 1–4 complete. This also supports resetting just one module.
      const inquiryModulesComplete = [1, 2, 3, 4].every(
        (id) => p.modules[String(id)]?.status === "completed"
      );
      if (moduleId >= 1 && moduleId <= 4 && !nextId && inquiryModulesComplete) {
        p.lkpdFinalizedAt = now;
        updates[P.progress(classId, uid)] = p;
        const [respAll, expAll] = await Promise.all([
          get(ref(db, P.responses(classId, uid))),
          get(ref(db, P.experiment(classId, uid))),
        ]);
        const respVal = (respAll.exists() ? respAll.val() : {}) as Record<
          string,
          unknown
        >;
        respVal[`m${moduleId}`] = {
          ...((respVal[`m${moduleId}`] as Record<string, unknown>) ?? {}),
          [sectionId]: drafts[sectionId] ?? null,
        };
        updates[P.lkpd(classId, uid)] = {
          finalizedAt: now,
          studentName: profile?.name ?? "",
          responses: respVal,
          experiments: expAll.exists() ? expAll.val() : {},
        };
      }

      setSaveState("saving");
      try {
        await update(ref(db), updates);
        setSaveState("saved");
        setState({
          progress: p,
          drafts,
          runs: st.runs,
          orientationMedia: st.orientationMedia,
        });
        if (nextId) {
          setTimeout(() => {
            document
              .getElementById(`sec-${nextId}`)
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 350);
        }
      } catch {
        setSaveState("error");
        throw new Error("save-failed");
      }
    },
    [classId, uid, moduleId, def, profile?.name]
  );

  // ---------- experiment runs ----------
  const recordRun = useCallback(
    async (run: ExperimentRun) => {
      const st = stateRef.current;
      if (!st || !classId || !uid) return;
      const key = safeKey(run.paramValue);
      setSaveState("saving");
      try {
        await set(ref(db, `${P.expRuns(classId, uid, moduleId)}/${key}`), run);
        setSaveState("saved");
        setState((prev) =>
          prev ? { ...prev, runs: { ...prev.runs, [key]: run } } : prev
        );
      } catch {
        setSaveState("error");
      }
    },
    [classId, uid, moduleId]
  );

  // ---------- reset all experiment data for the current module ----------
  const resetExperiment = useCallback(async () => {
    const st = stateRef.current;
    if (!st || !classId || !uid) return;

    // Commit pending edits first so no delayed autosave can restore stale data
    // after the reset has completed.
    const flushed = await flushNow();
    if (!flushed) throw new Error("reset-experiment-flush-failed");

    const now = Date.now();
    const drafts = { ...st.drafts };
    delete drafts.section4;
    const progress = clone(st.progress);
    progress.lastActivityAt = now;
    progress.lastSavedAt = now;

    setSaveState("saving");
    try {
      await update(ref(db), {
        [P.expRuns(classId, uid, moduleId)]: null,
        [P.sectionResponse(classId, uid, moduleId, "section4")]: null,
        [`${P.progress(classId, uid)}/lastActivityAt`]: now,
        [`${P.progress(classId, uid)}/lastSavedAt`]: now,
      });
      setState({
        progress,
        drafts,
        runs: {},
        orientationMedia: st.orientationMedia,
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
      throw new Error("reset-experiment-failed");
    }
  }, [classId, uid, moduleId, flushNow]);

  // ---------- exit actions ----------
  const saveAndExit = useCallback(async () => {
    // PR-LEARN-SAVE-002: save drafts + position, never force-complete anything.
    if (classId && uid) {
      const st = stateRef.current;
      const base = P.progress(classId, uid);
      Object.assign(pendingRef.current, {
        [`${base}/currentModule`]: moduleId,
        [`${base}/currentSection`]:
          st?.progress.modules[String(moduleId)]?.currentSection ?? null,
      });
      await flushNow();
    }
    router.push("/student/dashboard");
  }, [classId, uid, moduleId, flushNow, router]);

  const exitToDashboard = useCallback(async () => {
    await flushNow();
    router.push("/student/dashboard");
  }, [flushNow, router]);

  const goToModule = useCallback(
    (id: number) => {
      void flushNow().then(() => router.push(`/student/modules/${id}`));
    },
    [flushNow, router]
  );

  // ---------- render gates ----------
  if (loading) return <>{renderLoading}</>;
  if (!user) return <>{renderLoading}</>;
  if (!classId) return <>{renderNoClass}</>;
  if (locked) return <>{renderLocked(def)}</>;
  if (!state) return <>{renderLoading}</>;

  const modProgress = state.progress.modules[String(moduleId)];
  const readOnlyAcademic =
    Boolean(state.progress.lkpdFinalizedAt) && moduleId >= 1 && moduleId <= 4;

  const value: EngineCtx = {
    moduleId,
    def,
    classId,
    uid: uid as string,
    studentName: profile?.name ?? "",
    progress: state.progress,
    modProgress,
    drafts: state.drafts,
    runs: state.runs,
    orientationMedia: state.orientationMedia,
    saveState,
    readOnlyAcademic,
    updateDraft,
    flushNow,
    retrySave: () => void flushNow(),
    completeSection,
    recordRun,
    resetExperiment,
    saveAndExit,
    goToModule,
    exitToDashboard,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
