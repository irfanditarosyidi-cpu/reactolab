// ===== ReactoLab shared types (mirrors PRD v1.2 §28 data model) =====

export type Role = "student" | "teacher" | "admin";
export type UserStatus = "active" | "inactive";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  activeClassId?: string | null;
  createdAt: number;
  updatedAt?: number;
}

export type ModuleStatus = "locked" | "unlocked" | "in_progress" | "completed";
export type SectionStatus = "locked" | "active" | "completed";

export interface SectionProgress {
  status: SectionStatus;
  startedAt?: number;
  completedAt?: number;
}

export interface ModuleProgress {
  status: ModuleStatus;
  currentSection: string | null;
  completionPercent: number;
  startedAt?: number;
  lastOpenedAt?: number;
  completedAt?: number;
  sections: Record<string, SectionProgress>;
}

export interface StudentProgress {
  currentModule: number;
  currentSection: string | null;
  overallPercent: number;
  lastActivityAt: number;
  lastSavedAt?: number;
  courseCompletedAt?: number | null;
  lkpdFinalizedAt?: number | null;
  modules: Record<string, ModuleProgress>;
}

export interface ClassInfo {
  classId?: string;
  className: string;
  classCode: string;
  teacherId: string;
  status: "active" | "archived";
  createdAt: number;
}

export interface ClassMembership {
  joinedAt: number;
  name: string;
  email?: string;
}

// One experiment trial (a "run") recorded from the simulation
export interface ExperimentRun {
  id: string;
  paramValue: string; // key of the chosen parameter (e.g. "1.5" or "serbuk")
  label: string; // display label (e.g. "1,5 M" / "Serbuk")
  timeSec?: number; // completion time (simulated seconds)
  series?: { t: number; v: number }[]; // e.g. gas volume over time
  rate: number; // computed rate value
  rateLabel: string; // e.g. "0.056 s⁻¹"
  at: number;
}

export interface DiscussionCase {
  id?: string;
  title: string;
  articleUrl: string;
  articleNote?: string;
  question: string;
  decisionPrompt: string;
  published: boolean;
  order?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface ForumPost {
  claim: string;
  evidence: string;
  reasoning: string;
  studentName: string;
  submittedAt: number;
}

export interface ForumComment {
  id?: string;
  authorId: string;
  authorName: string;
  targetStudentId?: string;
  targetName?: string;
  text: string;
  createdAt: number;
}

export interface TeacherConclusion {
  content: string;
  published: boolean;
  publishedAt?: number;
  updatedAt: number;
}

export interface TeacherGrade {
  score: number;       // 0–100
  note?: string;       // catatan guru (opsional)
  gradedAt: number;    // timestamp pertama kali dinilai
  updatedAt?: number;  // timestamp update terakhir
}

export interface PasswordResetRequest {
  id?: string;
  email: string;
  name?: string;
  message?: string;
  status: "pending" | "done" | "rejected";
  createdAt: number;
  processedAt?: number;
  processedBy?: string;
}

export interface AuditLog {
  id?: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  targetUid?: string;
  targetEmail?: string;
  detail?: string;
  at: number;
}

export type SaveState = "idle" | "saving" | "saved" | "error";

// ===== Section draft shapes (stored under /responses) =====

export interface OrientationDraft {
  observation?: string;
  quiz?: string;
}
export interface ProblemDraft {
  varBebas?: string;
  varTerikat?: string;
}
export interface HypothesisDraft {
  direction?: string;
  effect?: string;
  reason?: string;
}
export interface ExperimentDraft {
  setupLocked?: boolean;
  /** Chosen parameter values. Module 1 stores custom concentrations ("1.25"). */
  selected?: string[];
  symbolicAnswer?: string;
  symbolicOk?: boolean;
  explain?: { makro?: string; submikro?: string; simbolik?: string };
  /** Module 1: the step-by-step simulation tutorial has been completed once. */
  m1TutorialSeen?: boolean;
}
export interface HypoTestDraft {
  verdict?: "terbukti" | "tidak_terbukti";
  explanation?: string;
}
export interface ConclusionDraft {
  text?: string;
  confirmFinal?: boolean;
}
