"use client";

// Password reset request queue (PR-AUTH-004 / PR-ADM-005).

import { useEffect, useMemo, useState } from "react";
import { KeyRound, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { Input, Label } from "@/components/ui/forms";
import { Badge, EmptyState, Spinner } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/admin-api";
import { listen, updatePaths } from "@/lib/db";
import { P } from "@/lib/paths";
import { formatDateTime } from "@/lib/utils";
import type { PasswordResetRequest } from "@/lib/types";

export default function ResetRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<Record<string, PasswordResetRequest> | null>(null);
  const [processing, setProcessing] = useState<(PasswordResetRequest & { id: string }) | null>(null);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(
    () =>
      listen<Record<string, PasswordResetRequest>>(P.resetRequests, (v) =>
        setRequests(v ?? {})
      ),
    []
  );

  const list = useMemo(() => {
    if (!requests) return [];
    return Object.entries(requests)
      .map(([id, r]) => ({ ...r, id }))
      .sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        return b.createdAt - a.createdAt;
      });
  }, [requests]);

  const process = async () => {
    if (!processing) return;
    setBusy(true);
    try {
      await adminFetch("/api/admin/reset-password", {
        body: { email: processing.email, newPassword: pw, requestId: processing.id },
      });
      toast(
        `Password ${processing.email} berhasil direset. Sampaikan password baru secara aman.`,
        "success"
      );
      setProcessing(null);
      setPw("");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const reject = async (r: PasswordResetRequest & { id: string }) => {
    await updatePaths({
      [`${P.resetRequests}/${r.id}/status`]: "rejected",
      [`${P.resetRequests}/${r.id}/processedAt`]: Date.now(),
    });
    toast("Permintaan ditolak.", "info");
  };

  if (requests === null) return <Spinner label="Memuat permintaan…" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Permintaan Reset Password
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Permintaan manual dari pengguna yang tidak dapat memakai email reset.
        </p>
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState emoji="🔐" title="Tidak ada permintaan" desc="Semua beres!" />
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <Card key={r.id}>
              <CardBody className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800">
                    {r.name || "(tanpa nama)"}{" "}
                    <span className="font-normal text-slate-500">— {r.email}</span>
                  </p>
                  {r.message ? (
                    <p className="text-sm text-slate-500 mt-0.5 italic">
                      &ldquo;{r.message}&rdquo;
                    </p>
                  ) : null}
                  <p className="text-xs text-slate-400 mt-1">
                    Diminta {formatDateTime(r.createdAt)}
                    {r.processedAt ? ` · diproses ${formatDateTime(r.processedAt)}` : ""}
                  </p>
                </div>
                {r.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setProcessing(r)}>
                      <KeyRound className="h-3.5 w-3.5" /> Proses
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void reject(r)}>
                      <X className="h-3.5 w-3.5" /> Tolak
                    </Button>
                  </div>
                ) : (
                  <Badge tone={r.status === "done" ? "green" : "red"}>
                    {r.status === "done" ? "Selesai" : "Ditolak"}
                  </Badge>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={processing !== null}
        onClose={() => setProcessing(null)}
        title={`Reset Password — ${processing?.email ?? ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setProcessing(null)}>
              Batal
            </Button>
            <Button loading={busy} disabled={pw.length < 6} onClick={() => void process()}>
              Reset &amp; Tandai Selesai
            </Button>
          </>
        }
      >
        <Label htmlFor="rpw">Password baru</Label>
        <Input
          id="rpw"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="min. 6 karakter"
        />
        <p className="text-xs text-slate-400 mt-2">
          Setelah direset, sampaikan password baru kepada pengguna melalui jalur yang
          aman (bukan lewat aplikasi ini).
        </p>
      </Modal>
    </div>
  );
}
