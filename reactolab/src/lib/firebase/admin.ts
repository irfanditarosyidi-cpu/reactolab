import fs from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

const DATABASE_URL =
  process.env.FIREBASE_DATABASE_URL ??
  "https://reactolab-496a1-default-rtdb.asia-southeast1.firebasedatabase.app";

function loadServiceAccount(): Record<string, string> {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT ?? "";
  if (!raw.trim()) {
    const candidateFiles = [
      process.env.FIREBASE_SERVICE_ACCOUNT_FILE,
      path.resolve(process.cwd(), "serviceAccountKey.json"),
      path.resolve(process.cwd(), "..", "serviceAccountKey.json"),
    ].filter(Boolean) as string[];

    for (const f of candidateFiles) {
      if (fs.existsSync(f)) {
        raw = fs.readFileSync(f, "utf8");
        break;
      }
    }
  }

  if (!raw.trim()) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT belum di-set dan file serviceAccountKey.json tidak ditemukan. Isi env var dengan JSON service account (atau base64-nya), atau letakkan serviceAccountKey.json di root project."
    );
  }
  raw = raw.trim();
  if (!raw.startsWith("{")) {
    raw = Buffer.from(raw, "base64").toString("utf8");
  }
  const parsed = JSON.parse(raw) as Record<string, string>;
  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
}

export function adminApp(): App {
  const apps = getApps();
  if (apps.length) return apps[0];
  return initializeApp({
    credential: cert(loadServiceAccount()),
    databaseURL: DATABASE_URL,
  });
}

export function adminAuth() {
  return getAuth(adminApp());
}

export function adminDb() {
  return getDatabase(adminApp());
}

export interface AdminActor {
  uid: string;
  email: string;
}

/** Verify the caller's ID token AND ensure their RTDB role is `admin`. */
export async function requireAdmin(req: Request): Promise<AdminActor> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "Tidak terautentikasi.");
  
  const authInstance = adminAuth();
  let decoded;
  try {
    decoded = await authInstance.verifyIdToken(token);
  } catch (err) {
    console.error("verifyIdToken failed:", err);
    throw new HttpError(401, "Token tidak valid atau kedaluwarsa.");
  }
  const roleSnap = await adminDb().ref(`users/${decoded.uid}/role`).get();
  if (roleSnap.val() !== "admin") {
    throw new HttpError(403, "Hanya admin yang dapat melakukan aksi ini.");
  }
  return { uid: decoded.uid, email: decoded.email ?? "" };
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function writeAudit(
  actor: AdminActor,
  action: string,
  target?: { uid?: string; email?: string },
  detail?: string
): Promise<void> {
  await adminDb().ref("auditLogs").push({
    actorUid: actor.uid,
    actorEmail: actor.email,
    action,
    ...(target?.uid ? { targetUid: target.uid } : {}),
    ...(target?.email ? { targetEmail: target.email } : {}),
    ...(detail ? { detail } : {}),
    at: Date.now(),
  });
}

export function jsonError(e: unknown): Response {
  if (e instanceof HttpError) {
    return Response.json({ error: e.message }, { status: e.status });
  }
  const msg = e instanceof Error ? e.message : "Terjadi kesalahan server.";
  return Response.json({ error: msg }, { status: 500 });
}
