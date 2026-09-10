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
import { P } from "./paths";
import { buildProgressSkeleton } from "./progress";
import { generateClassCode } from "./utils";
import type {
  ClassInfo,
  ClassMembership,
  DiscussionCase,
  ForumComment,
  ForumPost,
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
  return readOnce<StudentProgress>(P.progress(classId, uid));
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

// ---------- discussion / forum ----------

export function listenPublishedCases(
  classId: string,
  cb: (cases: Array<DiscussionCase & { id: string }>) => void
): () => void {
  return onValue(ref(db, P.cases(classId)), (snap) => {
    const out: Array<DiscussionCase & { id: string }> = [];
    snap.forEach((child) => {
      const v = child.val() as DiscussionCase;
      if (v.published) out.push({ ...v, id: child.key as string });
    });
    out.sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));
    cb(out);
  });
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

// ---------- password reset requests (public create) ----------

export async function createResetRequest(
  email: string,
  name: string,
  message: string
): Promise<void> {
  const r = push(ref(db, P.resetRequests));
  await set(r, {
    email: email.trim().toLowerCase(),
    name: name.trim(),
    message: message.trim(),
    status: "pending",
    createdAt: Date.now(),
  });
}
