"use client";

// Client helper for calling privileged /api/admin endpoints with the
// caller's Firebase ID token.

import { auth } from "./firebase/client";

export async function adminFetch<T = { ok: boolean }>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Tidak terautentikasi.");
  const token = await user.getIdToken();
  const res = await fetch(path, {
    method: options.method ?? "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Permintaan gagal (${res.status}).`);
  }
  return data;
}
