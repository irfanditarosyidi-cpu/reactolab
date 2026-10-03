// POST /api/password-reset-requests — create a verified manual reset request.

import { NextRequest } from "next/server";
import {
  adminAuth,
  adminDb,
  HttpError,
} from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > 4_096) {
      throw new HttpError(413, "Data permintaan terlalu besar.");
    }

    const body = (await req.json().catch(() => {
      throw new HttpError(400, "Data permintaan tidak valid.");
    })) as {
      email?: string;
      name?: string;
      message?: string;
    };
    const email = (body.email ?? "").trim().toLowerCase();
    const name = (body.name ?? "").trim();
    const message = (body.message ?? "").trim();

    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
      throw new HttpError(400, "Format email tidak valid.");
    }
    if (name.length < 2 || name.length > 100) {
      throw new HttpError(400, "Nama harus terdiri dari 2–100 karakter.");
    }
    if (message.length > 500) {
      throw new HttpError(400, "Pesan maksimal 500 karakter.");
    }

    const account = await adminAuth()
      .getUserByEmail(email)
      .catch((error: { code?: string }) => {
        if (error.code === "auth/user-not-found") return null;
        throw error;
      });

    if (!account) {
      throw new HttpError(404, "Email belum terdaftar pada sistem.");
    }

    const profileSnap = await adminDb().ref(`users/${account.uid}`).get();
    const profile = profileSnap.val() as
      | { email?: string; status?: string }
      | null;
    if (!profile || (profile.email ?? "").trim().toLowerCase() !== email) {
      throw new HttpError(404, "Email belum terdaftar pada sistem.");
    }
    if (account.disabled || profile.status !== "active") {
      throw new HttpError(403, "Akun tidak aktif. Silakan hubungi admin.");
    }

    const existingSnap = await adminDb().ref("passwordResetRequests").get();
    const hasPendingRequest = Object.values(
      (existingSnap.val() ?? {}) as Record<
        string,
        { email?: string; status?: string }
      >
    ).some(
      (request) =>
        request.email?.trim().toLowerCase() === email && request.status === "pending"
    );

    if (hasPendingRequest) {
      throw new HttpError(
        409,
        "Permintaan untuk email ini masih menunggu diproses admin."
      );
    }

    await adminDb().ref("passwordResetRequests").push({
      uid: account.uid,
      email,
      name,
      message,
      status: "pending",
      createdAt: Date.now(),
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("create password reset request failed:", error);
    return Response.json(
      { error: "Permintaan tidak dapat diproses. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
