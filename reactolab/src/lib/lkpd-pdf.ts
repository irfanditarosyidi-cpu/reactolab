// Client-side LKPD PDF generation with jsPDF (PR-LKPD-002).
// Reads the finalized snapshot from /lkpdSnapshots (falls back to live data).

import { get, ref } from "firebase/database";
import { db } from "./firebase/client";
import { P } from "./paths";
import { buildAllReports } from "./format";
import { formatDateTime } from "./utils";

interface Snapshot {
  finalizedAt: number;
  studentName: string;
  responses?: Record<string, unknown>;
  experiments?: Record<string, unknown>;
}

export async function downloadLkpdPdf(classId: string, uid: string): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const snapSnap = await get(ref(db, P.lkpd(classId, uid)));
  let snapshot: Snapshot | null = snapSnap.exists()
    ? (snapSnap.val() as Snapshot)
    : null;
  if (!snapshot) {
    // fallback: live data (before finalization)
    const [respSnap, expSnap] = await Promise.all([
      get(ref(db, P.responses(classId, uid))),
      get(ref(db, P.experiment(classId, uid))),
    ]);
    snapshot = {
      finalizedAt: Date.now(),
      studentName: "",
      responses: respSnap.exists() ? respSnap.val() : {},
      experiments: expSnap.exists() ? expSnap.val() : {},
    };
  }

  const reports = buildAllReports(snapshot.responses ?? {}, snapshot.experiments ?? {});

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 18;
  const CW = W - M * 2;
  let y = 0;

  const ensure = (need: number) => {
    if (y + need > 282) {
      doc.addPage();
      y = 18;
    }
  };

  // header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, W, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LKPD REACTOLAB", M, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Lembar Kerja Peserta Didik — Laju Reaksi (Inkuiri Terbimbing)", M, 20);
  doc.setTextColor(30, 41, 59);
  y = 40;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Nama: ${snapshot.studentName || "-"}`, M, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Difinalisasi: ${formatDateTime(snapshot.finalizedAt)}`, W - M, y, {
    align: "right",
  });
  y += 8;

  for (const rep of reports) {
    ensure(20);
    // module title bar
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(M, y, CW, 9, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(29, 78, 216);
    doc.text(`Modul ${rep.moduleId} — ${rep.title}`, M + 3, y + 6.2);
    doc.setTextColor(30, 41, 59);
    y += 14;

    doc.setFontSize(9);
    for (const item of rep.items) {
      const lines = doc.splitTextToSize(item.value, CW - 4) as string[];
      ensure(8 + lines.length * 4.4);
      doc.setFont("helvetica", "bold");
      doc.text(item.label, M, y);
      y += 4.6;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(lines, M + 2, y);
      y += lines.length * 4.4 + 2.5;
      doc.setTextColor(30, 41, 59);
    }

    if (rep.runs.length > 0) {
      ensure(12 + rep.runs.length * 6);
      doc.setFont("helvetica", "bold");
      doc.text("Data Percobaan", M, y);
      y += 5;
      // table header
      doc.setFillColor(241, 245, 249);
      doc.rect(M, y - 3.5, CW, 6, "F");
      doc.setFontSize(8.5);
      doc.text(rep.paramName ?? "Kondisi", M + 2, y);
      doc.text("Waktu (s)", M + 80, y);
      doc.text(`Laju (${rep.rateUnit ?? "-"})`, M + 120, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      for (const r of rep.runs) {
        ensure(6);
        doc.text(String(r.label), M + 2, y);
        doc.text(r.timeSec !== undefined ? r.timeSec.toFixed(1) : "-", M + 80, y);
        doc.text(r.rateLabel, M + 120, y);
        y += 5.4;
      }
      y += 3;
      doc.setFontSize(9);
    }
    y += 3;
  }

  // footer on each page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`ReactoLab v1.2 · Halaman ${i}/${pages}`, W / 2, 292, {
      align: "center",
    });
  }

  doc.save(`LKPD-ReactoLab-${(snapshot.studentName || "siswa").replace(/\s+/g, "_")}.pdf`);
}
