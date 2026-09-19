import { NextRequest } from "next/server";
import {
  adminDb,
  HttpError,
  jsonError,
  requireAdmin,
  writeAudit,
} from "@/lib/firebase/admin";
import { P } from "@/lib/paths";
import {
  getDefaultScaffoldTerms,
  normalizeScaffoldTerm,
  SCAFFOLD_FIELD_KEYS,
  type ScaffoldConfigMap,
  type ScaffoldFieldKey,
  type ScaffoldTermMap,
} from "@/lib/scaffold-config";

export const runtime = "nodejs";

const TOO_GENERIC = new Set([
  "jawaban",
  "reaksi",
  "zat",
  "hasil",
  "produk",
  "larutan",
  "partikel",
]);

function parseTarget(body: {
  moduleId?: number;
  field?: string;
}): { moduleId: number; field: ScaffoldFieldKey } {
  const moduleId = Number(body.moduleId);
  if (!Number.isInteger(moduleId) || moduleId < 1 || moduleId > 4) {
    throw new HttpError(400, "Modul harus berada antara 1 dan 4.");
  }
  if (!body.field || !SCAFFOLD_FIELD_KEYS.has(body.field as ScaffoldFieldKey)) {
    throw new HttpError(400, "Bagian scaffolding tidak valid.");
  }
  return { moduleId, field: body.field as ScaffoldFieldKey };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb().ref(P.scaffoldConfigs).get();
    const config = snap.exists() ? (snap.val() as ScaffoldConfigMap) : {};
    return Response.json({ ok: true, config });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAdmin(req);
    const body = (await req.json()) as {
      moduleId?: number;
      field?: string;
      text?: string;
    };
    const { moduleId, field } = parseTarget(body);
    const text = (body.text ?? "").trim().replace(/\s+/g, " ");
    const normalized = normalizeScaffoldTerm(text);
    const minimumLength = field === "symbolic_product" ? 1 : 3;

    if (text.length > 100) {
      throw new HttpError(400, "Istilah maksimal 100 karakter.");
    }
    if (normalized.length < minimumLength) {
      throw new HttpError(400, "Istilah terlalu pendek atau tidak valid.");
    }
    if (TOO_GENERIC.has(normalized)) {
      throw new HttpError(
        400,
        "Istilah terlalu umum. Tambahkan kata yang membuat konsepnya lebih spesifik."
      );
    }

    const defaults = getDefaultScaffoldTerms(moduleId, field).map(
      normalizeScaffoldTerm
    );
    if (defaults.includes(normalized)) {
      throw new HttpError(409, "Istilah tersebut sudah tersedia sebagai istilah bawaan.");
    }

    const fieldRef = adminDb().ref(P.scaffoldField(moduleId, field));
    const currentSnap = await fieldRef.get();
    const current = currentSnap.exists()
      ? (currentSnap.val() as ScaffoldTermMap)
      : {};
    if (Object.keys(current).length >= 50) {
      throw new HttpError(400, "Maksimal 50 istilah tambahan untuk setiap bagian.");
    }
    if (
      Object.values(current).some(
        (entry) => normalizeScaffoldTerm(entry.text ?? "") === normalized
      )
    ) {
      throw new HttpError(409, "Istilah tambahan tersebut sudah tersimpan.");
    }

    const termRef = fieldRef.push();
    if (!termRef.key) throw new Error("Gagal membuat ID istilah.");
    await termRef.set({
      text,
      normalized,
      createdAt: Date.now(),
      createdBy: actor.uid,
    });
    await writeAudit(
      actor,
      "add_scaffold_term",
      undefined,
      `Modul ${moduleId} · ${field} · ${text}`
    );

    return Response.json({ ok: true, id: termRef.key });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const actor = await requireAdmin(req);
    const body = (await req.json()) as {
      moduleId?: number;
      field?: string;
      termId?: string;
    };
    const { moduleId, field } = parseTarget(body);
    const termId = (body.termId ?? "").trim();
    if (!/^[A-Za-z0-9_-]+$/.test(termId)) {
      throw new HttpError(400, "ID istilah tidak valid.");
    }

    const termRef = adminDb().ref(`${P.scaffoldField(moduleId, field)}/${termId}`);
    const snap = await termRef.get();
    if (!snap.exists()) throw new HttpError(404, "Istilah tidak ditemukan.");
    const text = String((snap.val() as { text?: string }).text ?? "");
    await termRef.remove();
    await writeAudit(
      actor,
      "delete_scaffold_term",
      undefined,
      `Modul ${moduleId} · ${field} · ${text}`
    );

    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
