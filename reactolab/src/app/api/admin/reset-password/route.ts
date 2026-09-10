// POST /api/admin/reset-password — set a new password for a user and
// (optionally) mark the matching reset request as done (PR-ADM-005).

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
      uid?: string;
      email?: string;
      newPassword?: string;
      requestId?: string;
    };
    const newPassword = body.newPassword ?? "";
    if (newPassword.length < 6)
      throw new HttpError(400, "Password baru minimal 6 karakter.");

    let uid = body.uid ?? "";
    let email = body.email ?? "";
    if (!uid && email) {
      const rec = await adminAuth()
        .getUserByEmail(email.trim().toLowerCase())
        .catch(() => null);
      if (!rec) throw new HttpError(404, "Akun dengan email tersebut tidak ditemukan.");
      uid = rec.uid;
      email = rec.email ?? email;
    }
    if (!uid) throw new HttpError(400, "uid atau email wajib diisi.");
    if (!email) {
      const rec = await adminAuth().getUser(uid).catch(() => null);
      email = rec?.email ?? "";
    }

    // admins cannot reset other admins' passwords from this endpoint
    const roleSnap = await adminDb().ref(`users/${uid}/role`).get();
    if (roleSnap.val() === "admin" && uid !== actor.uid)
      throw new HttpError(403, "Password admin lain tidak dapat direset dari sini.");

    await adminAuth().updateUser(uid, { password: newPassword });

    if (body.requestId) {
      await adminDb().ref(`passwordResetRequests/${body.requestId}`).update({
        status: "done",
        processedAt: Date.now(),
        processedBy: actor.uid,
      });
    }

    await writeAudit(actor, "reset_password", { uid, email });
    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
