// Client-side data operations against Firebase Realtime Database.
// All privileged admin operations live in /api/admin/* (Admin SDK) instead.

import {
  equalTo,
  get,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  set,
  update,
} from "firebase/database";
import { db } from "./firebase/client";
import { createDiscussionAttemptId } from "./discussion";
import { missingDefaultDiscussionCases } from "./discussion-templates";
import { P } from "./paths";
import { getModuleDef } from "./module-defs";
import {
  buildProgressSkeleton,
  CLOSING_MODULE_ID,
  DISCUSSION_MODULE_ID,
  lockedModuleProgress,
  normalizeProgress,
  overallPercent,
  resetModuleProgress,
} from "./progress";
import { generateClassCode } from "./utils";
import type {
  ClassInfo,
  ClassMembership,
  DiscussionCase,
  ForumArgument,
  ForumComment,
  ForumPeerReview,
  ForumPost,
  OrientationMedia,
  StudentProgress,
  TeacherConclusion,
  TeacherGrade,
  UserProfile,
} from "./types";

// ---------- generic ----------

export async function readOnce<T>(path: string): Promise<T | null> {
  const snap = await get(ref(db, path));
  return snap.exists() ? (snap.val() as T) : null;
}

export function listen<T>(
  path: string,
  cb: (value: T | null) => void
): () => void {
  const r = ref(db, path);
  const unsub = onValue(r, (snap) => cb(snap.exists() ? (snap.val() as T) : null));
  return unsub;
}

export async function writePath(path: string, value: unknown): Promise<void> {
  await set(ref(db, path), value);
}

export async function updatePaths(updates: Record<string, unknown>): Promise<void> {
  await update(ref(db), updates);
}

// ---------- users ----------

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await set(ref(db, P.user(profile.uid)), profile);
}

export async function updateOwnProfile(
  uid: string,
  patch: Partial<Pick<UserProfile, "name" | "activeClassId">>
): Promise<void> {
  await update(ref(db, P.user(uid)), { ...patch, updatedAt: Date.now() });
}

// ---------- classes ----------

export async function createClass(
  teacherId: string,
  className: string
): Promise<{ classId: string; classCode: string }> {
  const classRef = push(ref(db, P.classes));
  const classId = classRef.key as string;
  let classCode = generateClassCode();
  // avoid (unlikely) code collision
  for (let i = 0; i < 5; i++) {
    const exists = await readOnce(P.classCode(classCode));
    if (!exists) break;
    classCode = generateClassCode();
  }
  const info: ClassInfo = {
    className,
    classCode,
    teacherId,
    status: "active",
    createdAt: Date.now(),
  };
  // Sequential writes: security rules validate the code against the EXISTING
  // class record, so the class must be created first.
  await set(ref(db, P.class(classId)), info);
  await set(ref(db, P.classCode(classCode)), { classId });
  await ensureDefaultDiscussionCases(classId);
  return { classId, classCode };
}

export async function regenerateClassCode(
  classId: string,
  oldCode: string
): Promise<string> {
  let code = generateClassCode();
  for (let i = 0; i < 5; i++) {
    const exists = await readOnce(P.classCode(code));
    if (!exists) break;
    code = generateClassCode();
  }
  await updatePaths({
    [P.classCode(oldCode)]: null, // old code becomes invalid (PR-CLASS-003)
    [P.classCode(code)]: { classId },
    [`${P.class(classId)}/classCode`]: code,
  });
  return code;
}

export function listenTeacherClasses(
  teacherId: string,
  cb: (classes: Array<ClassInfo & { classId: string }>) => void
): () => void {
  const q = query(ref(db, P.classes), orderByChild("teacherId"), equalTo(teacherId));
  return onValue(q, (snap) => {
    const out: Array<ClassInfo & { classId: string }> = [];
    snap.forEach((child) => {
      out.push({ ...(child.val() as ClassInfo), classId: child.key as string });
    });
    out.sort((a, b) => b.createdAt - a.createdAt);
    cb(out);
  });
}

export async function saveOrientationMedia(
  classId: string,
  moduleId: number,
  data: Pick<OrientationMedia, "youtubeUrl" | "caption">
): Promise<void> {
  await set(ref(db, P.orientationMedia(classId, moduleId)), {
    youtubeUrl: data.youtubeUrl.trim(),
    caption: data.caption.trim(),
    updatedAt: Date.now(),
  } satisfies OrientationMedia);
}

export async function removeOrientationMedia(
  classId: string,
  moduleId: number
): Promise<void> {
  await remove(ref(db, P.orientationMedia(classId, moduleId)));
}

/** Student joins a class using a 6-char code (PR-STU-DASH-004). */
export async function joinClassByCode(
  uid: string,
  name: string,
  email: string,
  rawCode: string
): Promise<{ classId: string; className: string }> {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error("Format kode kelas tidak valid.");
  const codeEntry = await readOnce<{ classId: string }>(P.classCode(code));
  if (!codeEntry) throw new Error("Kode kelas tidak ditemukan.");
  const info = await readOnce<ClassInfo>(P.class(codeEntry.classId));
  if (!info || info.status !== "active")
    throw new Error("Kelas tidak aktif atau tidak ditemukan.");

  const membership: ClassMembership = { joinedAt: Date.now(), name, email };
  // 1) membership must exist BEFORE progress (rules check membership),
  await updatePaths({
    [P.member(codeEntry.classId, uid)]: membership,
    [`${P.user(uid)}/activeClassId`]: codeEntry.classId,
    [`${P.user(uid)}/updatedAt`]: Date.now(),
  });
  // 2) then initialise the progress skeleton if missing.
  const existingProgress = await readOnce<StudentProgress>(
    P.progress(codeEntry.classId, uid)
  );
  if (!existingProgress) {
    await set(ref(db, P.progress(codeEntry.classId, uid)), buildProgressSkeleton());
  }
  return { classId: codeEntry.classId, className: info.className };
}

// ---------- progress ----------

export async function getProgress(
  classId: string,
  uid: string
): Promise<StudentProgress | null> {
  const progress = await readOnce<StudentProgress>(P.progress(classId, uid));
  return progress ? normalizeProgress(progress) : null;
}

export async function ensureProgress(
  classId: string,
  uid: string
): Promise<StudentProgress> {
  const existing = await getProgress(classId, uid);
  if (existing) return existing;
  const skeleton = buildProgressSkeleton();
  await set(ref(db, P.progress(classId, uid)), skeleton);
  return skeleton;
}

/** Reset progres siswa (Settings → Reset) — removes learning data only. */
export async function resetStudentData(classId: string, uid: string): Promise<void> {
  await Promise.all([
    remove(ref(db, P.progress(classId, uid))),
    remove(ref(db, P.responses(classId, uid))),
    remove(ref(db, P.experiment(classId, uid))),
    remove(ref(db, P.lkpd(classId, uid))),
    remove(ref(db, P.discussionProgress(classId, uid))),
  ]);
  await set(ref(db, P.progress(classId, uid)), buildProgressSkeleton());
}

/** Reset one module while preserving every other module's progress and data. */
export async function resetStudentModuleData(
  classId: string,
  uid: string,
  moduleId: number
): Promise<StudentProgress> {
  const def = getModuleDef(moduleId);
  if (!def) throw new Error("module-not-found");

  const progress = await getProgress(classId, uid);
  if (!progress) throw new Error("progress-not-found");
  const current = progress.modules[String(moduleId)];
  if (!current || current.status === "locked") throw new Error("module-locked");

  const now = Date.now();
  const nextModules = {
    ...progress.modules,
    [String(moduleId)]: resetModuleProgress(
      moduleId,
      moduleId === DISCUSSION_MODULE_ID
        ? createDiscussionAttemptId()
        : undefined
    ),
  };
  if (moduleId >= 1 && moduleId < CLOSING_MODULE_ID) {
    nextModules[String(CLOSING_MODULE_ID)] = lockedModuleProgress(
      CLOSING_MODULE_ID
    );
  }
  const nextProgress: StudentProgress = {
    ...progress,
    currentModule: moduleId,
    currentSection: null,
    courseCompletedAt: null,
    lastActivityAt: now,
    lastSavedAt: now,
    modules: nextModules,
  };

  // A reset in the inquiry modules invalidates the old combined LKPD snapshot.
  // It will be generated again after Modules 1–4 are all completed.
  if (moduleId >= 1 && moduleId <= 4) nextProgress.lkpdFinalizedAt = null;
  nextProgress.overallPercent = overallPercent(nextProgress);

  const updates: Record<string, unknown> = {
    [P.progress(classId, uid)]: nextProgress,
    [P.moduleResponses(classId, uid, moduleId)]: null,
    [P.expRuns(classId, uid, moduleId)]: null,
  };
  if (moduleId >= 1 && moduleId <= 4) updates[P.lkpd(classId, uid)] = null;
  if (moduleId === DISCUSSION_MODULE_ID) {
    updates[P.discussionProgress(classId, uid)] = null;
  }
  if (moduleId >= 1 && moduleId < CLOSING_MODULE_ID) {
    updates[P.moduleResponses(classId, uid, CLOSING_MODULE_ID)] = null;
  }

  await updatePaths(updates);
  return nextProgress;
}

// ---------- discussion / forum ----------

/**
 * Seeds the two bundled Module 5 cases without changing an existing default,
 * a teacher-edited copy, or a custom case with the same title.
 */
export async function ensureDefaultDiscussionCases(
  classId: string
): Promise<number> {
  const existing = await readOnce<Record<string, DiscussionCase>>(P.cases(classId));
  const missing = missingDefaultDiscussionCases(existing);
  if (!missing.length) return 0;

  const updates: Record<string, unknown> = {};
  for (const discussionCase of missing) {
    const { id, ...payload } = discussionCase;
    updates[P.caseItem(classId, id)] = payload;
    updates[P.publishedCase(classId, id)] = payload;
  }
  await updatePaths(updates);
  return missing.length;
}

export function listenPublishedCases(
  classId: string,
  cb: (cases: Array<DiscussionCase & { id: string }>) => void
): () => void {
  const publishedQuery = query(
    ref(db, P.cases(classId)),
    orderByChild("published"),
    equalTo(true)
  );
  return onValue(publishedQuery, (snap) => {
    const out: Array<DiscussionCase & { id: string }> = [];
    snap.forEach((child) => {
      const v = child.val() as DiscussionCase;
      if (v.published && !v.archivedAt)
        out.push({ ...v, id: child.key as string });
    });
    out.sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));
    cb(out);
  });
}

/**
 * Store the teacher-only source record and its student-readable published
 * projection in one multi-location update. Drafts never enter the projection.
 */
export async function saveDiscussionCase(
  classId: string,
  value: DiscussionCase,
  caseId?: string
): Promise<string> {
  const id = caseId ?? (push(ref(db, P.cases(classId))).key as string);
  const { id: _ignoredId, ...caseValue } = value;
  const payload = JSON.parse(
    JSON.stringify({ ...caseValue, updatedAt: Date.now() })
  ) as DiscussionCase;
  const visible = payload.published && !payload.archivedAt;
  await updatePaths({
    [P.caseItem(classId, id)]: payload,
    [P.publishedCase(classId, id)]: visible ? payload : null,
  });
  return id;
}

/** Backfills/repairs the published projection without touching responses. */
export async function syncPublishedCaseProjection(
  classId: string,
  cases: Array<DiscussionCase & { id: string }>
): Promise<void> {
  const updates: Record<string, unknown> = {};
  for (const discussionCase of cases) {
    const { id, ...payload } = discussionCase;
    updates[P.publishedCase(classId, id)] =
      discussionCase.published && !discussionCase.archivedAt ? payload : null;
  }
  if (Object.keys(updates).length) await updatePaths(updates);
}

export async function discussionCaseHasResponses(
  classId: string,
  caseId: string
): Promise<boolean> {
  const [
    legacyPosts,
    argumentsValue,
    argumentAttempts,
    comments,
    peerReviews,
    peerReviewAttempts,
    progress,
    responses,
  ] = await Promise.all([
      readOnce<Record<string, unknown>>(P.posts(classId, caseId)),
      readOnce<Record<string, unknown>>(P.arguments(classId, caseId)),
      readOnce<Record<string, unknown>>(P.argumentAttempts(classId, caseId)),
      readOnce<Record<string, unknown>>(P.comments(classId, caseId)),
      readOnce<Record<string, unknown>>(P.peerReviews(classId, caseId)),
      readOnce<Record<string, unknown>>(P.peerReviewAttempts(classId, caseId)),
      readOnce<Record<string, Record<string, unknown>>>(
        `discussionProgress/${classId}`
      ),
      readOnce<Record<string, Record<string, unknown>>>(`responses/${classId}`),
    ]);
  const hasDraftResponse = Object.values(responses ?? {}).some((student) => {
    const m5 = student?.m5 as Record<string, unknown> | undefined;
    const m6 = student?.m6 as Record<string, unknown> | undefined;
    const currentCases = m5?.sectionCases as Record<string, unknown> | undefined;
    const legacyCases = m6?.sectionCases as Record<string, unknown> | undefined;
    return Boolean(currentCases?.[caseId] || legacyCases?.[caseId]);
  });
  return Boolean(
    legacyPosts ||
      argumentsValue ||
      argumentAttempts ||
      comments ||
      peerReviews ||
      peerReviewAttempts ||
      hasDraftResponse ||
      Object.values(progress ?? {}).some((student) => Boolean(student?.[caseId]))
  );
}

export async function removeOrArchiveDiscussionCase(
  classId: string,
  discussionCase: DiscussionCase & { id: string }
): Promise<"deleted" | "archived"> {
  const hasResponses = await discussionCaseHasResponses(classId, discussionCase.id);
  if (hasResponses) {
    await saveDiscussionCase(
      classId,
      {
        ...discussionCase,
        published: false,
        archivedAt: discussionCase.archivedAt ?? Date.now(),
        archivedReason: "Diarsipkan karena kasus sudah memiliki respons siswa.",
      },
      discussionCase.id
    );
    return "archived";
  }
  await updatePaths({
    [P.caseItem(classId, discussionCase.id)]: null,
    [P.publishedCase(classId, discussionCase.id)]: null,
  });
  return "deleted";
}

export function listenAllCases(
  classId: string,
  cb: (cases: Array<DiscussionCase & { id: string }>) => void
): () => void {
  return onValue(ref(db, P.cases(classId)), (snap) => {
    const out: Array<DiscussionCase & { id: string }> = [];
    snap.forEach((child) => {
      out.push({ ...(child.val() as DiscussionCase), id: child.key as string });
    });
    out.sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));
    cb(out);
  });
}

export async function submitCER(
  classId: string,
  caseId: string,
  uid: string,
  post: ForumPost
): Promise<void> {
  await updatePaths({
    [P.post(classId, caseId, uid)]: post,
    [`${P.discussionProgress(classId, uid)}/${caseId}/cerSubmittedAt`]: post.submittedAt,
  });
}

export async function submitForumArgument(
  classId: string,
  caseId: string,
  uid: string,
  argument: ForumArgument
): Promise<void> {
  await updatePaths({
    [P.argument(classId, caseId, uid)]: argument,
    [`${P.discussionProgress(classId, uid)}/${caseId}/argumentSubmittedAt`]:
      argument.submittedAt,
  });
}

export async function submitForumArgumentAttempt(
  classId: string,
  caseId: string,
  uid: string,
  attemptId: string,
  argument: ForumArgument
): Promise<void> {
  const payload: ForumArgument = { ...argument, attemptId };
  await updatePaths({
    [P.argumentAttempt(classId, caseId, uid, attemptId)]: payload,
    [`${P.discussionProgress(classId, uid)}/${caseId}/argumentSubmittedAt`]:
      payload.submittedAt,
    [`${P.discussionProgress(classId, uid)}/${caseId}/attemptId`]: attemptId,
  });
}

export function listenPosts(
  classId: string,
  caseId: string,
  cb: (posts: Array<ForumPost & { uid: string }>) => void,
  onDenied?: () => void
): () => void {
  return onValue(
    ref(db, P.posts(classId, caseId)),
    (snap) => {
      const out: Array<ForumPost & { uid: string }> = [];
      snap.forEach((child) => {
        out.push({ ...(child.val() as ForumPost), uid: child.key as string });
      });
      out.sort((a, b) => a.submittedAt - b.submittedAt);
      cb(out);
    },
    () => onDenied?.()
  );
}

export function listenArguments(
  classId: string,
  caseId: string,
  cb: (posts: Array<ForumArgument & { uid: string }>) => void,
  onDenied?: () => void
): () => void {
  return onValue(
    ref(db, P.arguments(classId, caseId)),
    (snap) => {
      const out: Array<ForumArgument & { uid: string }> = [];
      snap.forEach((child) => {
        out.push({ ...(child.val() as ForumArgument), uid: child.key as string });
      });
      out.sort((a, b) => a.submittedAt - b.submittedAt);
      cb(out);
    },
    () => onDenied?.()
  );
}

export function listenArgumentAttempts(
  classId: string,
  caseId: string,
  cb: (
    posts: Array<ForumArgument & { uid: string; attemptId: string }>
  ) => void,
  onDenied?: () => void
): () => void {
  return onValue(
    ref(db, P.argumentAttempts(classId, caseId)),
    (snap) => {
      const out: Array<ForumArgument & { uid: string; attemptId: string }> = [];
      snap.forEach((studentSnap) => {
        studentSnap.forEach((attemptSnap) => {
          const argument = attemptSnap.val() as ForumArgument;
          out.push({
            ...argument,
            uid: studentSnap.key as string,
            attemptId: argument.attemptId ?? (attemptSnap.key as string),
          });
        });
      });
      out.sort((a, b) => a.submittedAt - b.submittedAt);
      cb(out);
    },
    () => onDenied?.()
  );
}

export async function submitPeerReview(
  classId: string,
  caseId: string,
  review: ForumPeerReview
): Promise<void> {
  await updatePaths({
    [P.peerReview(classId, caseId, review.reviewerId, review.targetStudentId)]:
      review,
    [`${P.discussionProgress(classId, review.reviewerId)}/${caseId}/reviewedPeers/${review.targetStudentId}`]:
      review.createdAt,
  });
}

export async function submitPeerReviewAttempt(
  classId: string,
  caseId: string,
  attemptId: string,
  review: ForumPeerReview
): Promise<void> {
  const payload: ForumPeerReview = { ...review, attemptId };
  await updatePaths({
    [P.peerReviewAttempt(
      classId,
      caseId,
      review.reviewerId,
      attemptId,
      review.targetStudentId
    )]: payload,
    [`${P.discussionProgress(classId, review.reviewerId)}/${caseId}/reviewedPeers/${review.targetStudentId}`]:
      payload.createdAt,
    [`${P.discussionProgress(classId, review.reviewerId)}/${caseId}/attemptId`]:
      attemptId,
  });
}

export function listenPeerReviews(
  classId: string,
  caseId: string,
  reviewerId: string,
  cb: (reviews: Record<string, ForumPeerReview>) => void
): () => void {
  return onValue(
    ref(db, P.peerReviewsByStudent(classId, caseId, reviewerId)),
    (snap) => cb(snap.exists() ? (snap.val() as Record<string, ForumPeerReview>) : {})
  );
}

export function listenPeerReviewAttempts(
  classId: string,
  caseId: string,
  reviewerId: string,
  attemptId: string,
  cb: (reviews: Record<string, ForumPeerReview>) => void
): () => void {
  return onValue(
    ref(db, P.peerReviewsByAttempt(classId, caseId, reviewerId, attemptId)),
    (snap) =>
      cb(
        snap.exists()
          ? (snap.val() as Record<string, ForumPeerReview>)
          : {}
      )
  );
}

export async function addComment(
  classId: string,
  caseId: string,
  comment: Omit<ForumComment, "id">
): Promise<void> {
  const cRef = push(ref(db, P.comments(classId, caseId)));
  await set(cRef, comment);
  await update(
    ref(db, `${P.discussionProgress(classId, comment.authorId)}/${caseId}`),
    { lastCommentAt: comment.createdAt }
  );
}

export function listenComments(
  classId: string,
  caseId: string,
  cb: (comments: ForumComment[]) => void,
  onDenied?: () => void
): () => void {
  return onValue(
    ref(db, P.comments(classId, caseId)),
    (snap) => {
      const out: ForumComment[] = [];
      snap.forEach((child) => {
        out.push({ ...(child.val() as ForumComment), id: child.key as string });
      });
      out.sort((a, b) => a.createdAt - b.createdAt);
      cb(out);
    },
    () => onDenied?.()
  );
}

export function listenConclusion(
  classId: string,
  cb: (c: TeacherConclusion | null) => void
): () => void {
  return listen<TeacherConclusion>(P.conclusion(classId), cb);
}

// ---------- grades (teacher per-module scoring) ----------

export async function saveGrade(
  classId: string,
  studentId: string,
  moduleId: number,
  data: { score: number; note?: string }
): Promise<void> {
  const path = P.moduleGrade(classId, studentId, moduleId);
  const existing = await readOnce<TeacherGrade>(path);
  const payload: TeacherGrade = {
    score: data.score,
    note: data.note || undefined,
    gradedAt: existing?.gradedAt ?? Date.now(),
    updatedAt: Date.now(),
  };
  await set(ref(db, path), payload);
}

export function listenGrades(
  classId: string,
  studentId: string,
  cb: (grades: Record<string, TeacherGrade>) => void
): () => void {
  return listen<Record<string, TeacherGrade>>(P.grade(classId, studentId), (v) =>
    cb(v ?? {})
  );
}

export function listenMyGrades(
  classId: string,
  uid: string,
  cb: (grades: Record<string, TeacherGrade>) => void
): () => void {
  return listen<Record<string, TeacherGrade>>(P.grade(classId, uid), (v) =>
    cb(v ?? {})
  );
}

// ---------- password reset requests (verified by the server) ----------

export async function createResetRequest(
  email: string,
  name: string,
  message: string
): Promise<void> {
  const response = await fetch("/api/password-reset-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, message }),
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Gagal mengirim permintaan reset password.");
  }
}
