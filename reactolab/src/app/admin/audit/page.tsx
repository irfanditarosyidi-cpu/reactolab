"use client";

// Audit log viewer (PR-ADM read audit) — latest 200 administrative actions.

import { useEffect, useMemo, useState } from "react";
import { limitToLast, onValue, query, ref } from "firebase/database";
import Card from "@/components/ui/Card";
import { Badge, EmptyState, Spinner } from "@/components/ui/misc";
import { db } from "@/lib/firebase/client";
import { P } from "@/lib/paths";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";

const ACTION_LABEL: Record<string, { label: string; tone: "blue" | "green" | "red" | "amber" | "slate" }> = {
  create_user: { label: "Buat akun", tone: "green" },
  change_role: { label: "Ubah role", tone: "blue" },
  deactivate_user: { label: "Nonaktifkan", tone: "red" },
  activate_user: { label: "Aktifkan", tone: "green" },
  delete_user: { label: "Hapus akun", tone: "red" },
  reset_password: { label: "Reset password", tone: "amber" },
  seed_admin: { label: "Seed akun", tone: "slate" },
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[] | null>(null);

  useEffect(() => {
    const q = query(ref(db, P.audit), limitToLast(200));
    return onValue(q, (snap) => {
      const out: AuditLog[] = [];
      snap.forEach((child) => {
        out.push({ ...(child.val() as AuditLog), id: child.key as string });
      });
      out.sort((a, b) => b.at - a.at);
      setLogs(out);
    });
  }, []);

  const rows = useMemo(() => logs ?? [], [logs]);

  if (logs === null) return <Spinner label="Memuat audit log…" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-1">
          Jejak {rows.length} aksi administratif terakhir (ditulis server-side).
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState emoji="📜" title="Belum ada aktivitas admin" />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm min-w-[680px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-bold">Waktu</th>
                  <th className="px-3 py-3 font-bold">Aksi</th>
                  <th className="px-3 py-3 font-bold">Aktor</th>
                  <th className="px-3 py-3 font-bold">Target</th>
                  <th className="px-3 py-3 font-bold">Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => {
                  const a = ACTION_LABEL[l.action] ?? { label: l.action, tone: "slate" as const };
                  return (
                    <tr key={l.id} className="border-b border-slate-50">
                      <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(l.at)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={a.tone}>{a.label}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{l.actorEmail || l.actorUid}</td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {l.targetEmail || l.targetUid || "-"}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{l.detail ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
