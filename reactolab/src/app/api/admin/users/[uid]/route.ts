// PATCH  /api/admin/users/[uid] — change role (student↔teacher, PR-ADM-004)
//                                  or status (active/inactive).
// DELETE /api/admin/users/[uid] — remove the account.

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

async function getTarget(uid: string) {
  const snap = await adminDb().ref(`users/${uid}`).get();
  if (!snap.exists()) throw new HttpError(404, "Pengguna tidak ditemukan.");
  return snap.val() as { role: string; email: string; name: string };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const actor = await requireAdmin(req);
    const { uid } = params;
    const target = await getTarget(uid);
    if (target.role === "admin")
      throw new HttpError(403, "Akun admin tidak dapat diubah dari sini.");

    const body = (await req.json()) as { role?: string; status?: string };

    if (body.role !== undefined) {
      if (body.role !== "student" && body.role !== "teacher")
        throw new HttpError(400, "Role hanya dapat diubah antara student ↔ teacher.");
      await adminDb().ref(`users/${uid}`).update({ role: body.role, updatedAt: Date.now() });
      await writeAudit(
        actor,
        "change_role",
        { uid, email: target.email },
        `${target.role} → ${body.role}`
      );
    }

    if (body.status !== undefined) {
      if (body.status !== "active" && body.status !== "inactive")
        throw new HttpError(400, "Status tidak valid.");
      await adminAuth().updateUser(uid, { disabled: body.status === "inactive" });
      await adminDb().ref(`users/${uid}`).update({ status: body.status, updatedAt: Date.now() });
      await writeAudit(
        actor,
        body.status === "inactive" ? "deactivate_user" : "activate_user",
        { uid, email: target.email }
      );
    }

    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const actor = await requireAdmin(req);
    const { uid } = params;
    if (uid === actor.uid)
      throw new HttpError(400, "Tidak dapat menghapus akun sendiri.");
    const target = await getTarget(uid);
    if (target.role === "admin")
      throw new HttpError(403, "Akun admin tidak dapat dihapus dari sini.");

    await adminAuth().deleteUser(uid).catch(() => undefined);
    await adminDb().ref(`users/${uid}`).remove();
    await writeAudit(actor, "delete_user", { uid, email: target.email });
    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
