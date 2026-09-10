// POST /api/admin/users — create a user account (PR-ADM-003, server-side only).

import { NextRequest } from "next/server";
import {
  adminAuth,
  adminDb,
  jsonError,
  requireAdmin,
  HttpError,
  writeAudit,
} from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAdmin(req);
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const role = body.role === "teacher" ? "teacher" : "student";

    if (name.length < 3) throw new HttpError(400, "Nama minimal 3 karakter.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Email tidak valid.");
    if (password.length < 6)
      throw new HttpError(400, "Password minimal 6 karakter.");

    const user = await adminAuth()
      .createUser({ email, password, displayName: name })
      .catch((e: { code?: string }) => {
        if (e.code === "auth/email-already-exists")
          throw new HttpError(409, "Email sudah terdaftar.");
        throw e;
      });

    await adminDb().ref(`users/${user.uid}`).set({
      uid: user.uid,
      name,
      email,
      role,
      status: "active",
      activeClassId: null,
      createdAt: Date.now(),
    });

    await writeAudit(actor, "create_user", { uid: user.uid, email }, `role=${role}`);
    return Response.json({ ok: true, uid: user.uid });
  } catch (e) {
    return jsonError(e);
  }
}
