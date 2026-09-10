#!/usr/bin/env node
/**
 * ReactoLab seed script — create the initial admin/teacher account.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT='<json | base64>' \
 *   node scripts/seed.mjs --email admin@sekolah.sch.id --password rahasia123 --name "Admin ReactoLab" --role admin
 *
 * Alternatively point to a key file:
 *   FIREBASE_SERVICE_ACCOUNT_FILE=./serviceAccountKey.json node scripts/seed.mjs ...
 *
 * Roles allowed: admin | teacher | student
 * Running again with the same email UPDATES the password/name/role.
 */

import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

const DATABASE_URL =
  process.env.FIREBASE_DATABASE_URL ??
  "https://reactolab-496a1-default-rtdb.asia-southeast1.firebasedatabase.app";

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

function loadServiceAccount() {
  const file =
    arg("key-file") ??
    arg("file") ??
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  let raw = file
    ? readFileSync(file, "utf8")
    : (process.env.FIREBASE_SERVICE_ACCOUNT ?? "");
  raw = raw.trim();
  if (!raw) {
    console.error(
      "✖ Gunakan parameter --key-file <path-ke-json> atau set env FIREBASE_SERVICE_ACCOUNT / FIREBASE_SERVICE_ACCOUNT_FILE."
    );
    process.exit(1);
  }
  if (!raw.startsWith("{")) raw = Buffer.from(raw, "base64").toString("utf8");
  const parsed = JSON.parse(raw);
  if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  return parsed;
}

const email = (arg("email") ?? "").trim().toLowerCase();
const password = arg("password") ?? "";
const name = arg("name") ?? "Admin ReactoLab";
const role = arg("role") ?? "admin";

if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
  console.error(
    "Usage: node scripts/seed.mjs --email <email> --password <min 6 char> [--name <nama>] [--role admin|teacher|student]"
  );
  process.exit(1);
}
if (!["admin", "teacher", "student"].includes(role)) {
  console.error("✖ Role harus admin | teacher | student");
  process.exit(1);
}

const app = initializeApp({
  credential: cert(loadServiceAccount()),
  databaseURL: DATABASE_URL,
});
const auth = getAuth(app);
const db = getDatabase(app);

async function main() {
  let user = await auth.getUserByEmail(email).catch(() => null);
  if (user) {
    await auth.updateUser(user.uid, { password, displayName: name, disabled: false });
    console.log(`ℹ Akun sudah ada — password/nama diperbarui (uid: ${user.uid})`);
  } else {
    user = await auth.createUser({ email, password, displayName: name });
    console.log(`✔ Akun auth dibuat (uid: ${user.uid})`);
  }

  const profileRef = db.ref(`users/${user.uid}`);
  const existing = (await profileRef.get()).val() ?? {};
  await profileRef.set({
    uid: user.uid,
    name,
    email,
    role,
    status: "active",
    activeClassId: existing.activeClassId ?? null,
    createdAt: existing.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  });
  console.log(`✔ Profil RTDB di-set: role=${role}`);

  await db.ref("auditLogs").push({
    actorUid: "seed-script",
    actorEmail: "seed@localhost",
    action: "seed_admin",
    targetUid: user.uid,
    targetEmail: email,
    detail: `role=${role}`,
    at: Date.now(),
  });

  console.log("\n🎉 Selesai! Login di aplikasi dengan:");
  console.log(`   Email   : ${email}`);
  console.log(`   Password: ${password}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("✖ Gagal:", e.message);
  process.exit(1);
});
