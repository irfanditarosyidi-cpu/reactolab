// Client-side LKPD PDF generation with jsPDF (PR-LKPD-002).
// Reads the finalized snapshot from /lkpdSnapshots (falls back to live data).

import { get, ref } from "firebase/database";
import { db } from "./firebase/client";
import { P } from "./paths";
import { buildAllReports, type ModuleReport } from "./format";
import {
  buildGasComparisonRows,
  reportedRateLabel,
  reportedRateValue,
} from "./runs";
import type { ClassInfo, ExperimentRun, UserProfile } from "./types";
import { formatDateTime } from "./utils";

interface Snapshot {
  finalizedAt: number;
  studentName: string;
  responses?: Record<string, unknown>;
  experiments?: Record<string, unknown>;
}

interface TableColumn {
  header: string;
  width: number;
  align?: "left" | "center" | "right";
}

const PAGE_WIDTH = 210;
const PAGE_BOTTOM = 282;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CHART_COLORS: Array<[number, number, number]> = [
  [37, 99, 235],
  [14, 165, 233],
  [245, 158, 11],
  [16, 185, 129],
  [139, 92, 246],
  [239, 68, 68],
];

/** Helvetica's built-in PDF encoding cannot render most Unicode symbols. */
function pdfText(value: unknown): string {
  const subscripts: Record<string, string> = {
    "₀": "0",
    "₁": "1",
    "₂": "2",
    "₃": "3",
    "₄": "4",
    "₅": "5",
    "₆": "6",
    "₇": "7",
    "₈": "8",
    "₉": "9",
  };
  const superscripts: Record<string, string> = {
    "⁰": "0",
    "¹": "1",
    "²": "2",
    "³": "3",
    "⁴": "4",
    "⁵": "5",
    "⁶": "6",
    "⁷": "7",
    "⁸": "8",
    "⁹": "9",
    "⁻": "-",
  };

  return String(value ?? "-")
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (char) => subscripts[char] ?? char)
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (part) =>
      `^${Array.from(part)
        .map((char) => superscripts[char] ?? char)
        .join("")}`
    )
    .replace(/[→⟶]/g, "->")
    .replace(/[–—]/g, "-")
    .replace(/Δ/g, "Delta ")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/×/g, "x")
    .replace(/·/g, "|")
    .replace(/•/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");
}

function displayNumber(value: number | undefined, digits = 2): string {
  if (value === undefined || !Number.isFinite(value)) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

function finalVolume(run: ExperimentRun): number | undefined {
  return run.series?.[run.series.length - 1]?.v;
}

function volumeAt(run: ExperimentRun, time: number): number | undefined {
  return run.series?.find((point) => point.t === time)?.v;
}

export async function downloadLkpdPdf(classId: string, uid: string): Promise<void> {
  if (!classId || !uid) throw new Error("Identitas siswa atau kelas tidak tersedia.");

  const { jsPDF } = await import("jspdf");
  const [snapshotResult, classResult, profileResult] = await Promise.all([
    get(ref(db, P.lkpd(classId, uid))),
    get(ref(db, P.class(classId))),
    get(ref(db, P.user(uid))),
  ]);

  let snapshot: Snapshot | null = snapshotResult.exists()
    ? (snapshotResult.val() as Snapshot)
    : null;
  if (!snapshot) {
    const [responsesResult, experimentsResult] = await Promise.all([
      get(ref(db, P.responses(classId, uid))),
      get(ref(db, P.experiment(classId, uid))),
    ]);
    snapshot = {
      finalizedAt: Date.now(),
      studentName: "",
      responses: responsesResult.exists() ? responsesResult.val() : {},
      experiments: experimentsResult.exists() ? experimentsResult.val() : {},
    };
  }

  const classInfo = classResult.exists() ? (classResult.val() as ClassInfo) : null;
  const profile = profileResult.exists() ? (profileResult.val() as UserProfile) : null;
  const studentName = snapshot.studentName?.trim() || profile?.name?.trim() || "Siswa";
  const className = classInfo?.className?.trim() || "-";
  const reports = buildAllReports(snapshot.responses ?? {}, snapshot.experiments ?? {});
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  let y = 0;
  let activeModule = "";

  const drawContinuationHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(pdfText(`LKPD ChemSpace | ${studentName}`), MARGIN, 10);
    if (activeModule) {
      doc.setFont("helvetica", "normal");
      doc.text(pdfText(activeModule), PAGE_WIDTH - MARGIN, 10, { align: "right" });
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, 13, PAGE_WIDTH - MARGIN, 13);
    y = 20;
  };

  const newPage = () => {
    doc.addPage();
    drawContinuationHeader();
  };

  const ensure = (height: number) => {
    if (y + height > PAGE_BOTTOM) newPage();
  };

  const writeSectionTitle = (title: string) => {
    ensure(11);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 8, 1.3, 1.3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(29, 78, 216);
    doc.text(pdfText(title), MARGIN + 3, y + 5.4);
    doc.setTextColor(30, 41, 59);
    y += 11;
  };

  const writeAnswer = (label: string, value: string) => {
    doc.setFontSize(8.5);
    const content = value === "-" ? "Belum tersedia" : value;
    let lines = doc.splitTextToSize(pdfText(content), CONTENT_WIDTH - 8) as string[];
    let continuation = false;

    while (lines.length > 0) {
      ensure(15);
      const availableLines = Math.max(1, Math.floor((PAGE_BOTTOM - y - 11) / 3.9));
      const chunk = lines.slice(0, availableLines);
      lines = lines.slice(availableLines);
      const height = 10 + chunk.length * 3.9;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, height, 1.2, 1.2, "FD");
      doc.setFillColor(37, 99, 235);
      doc.rect(MARGIN, y, 1.2, height, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.2);
      doc.setTextColor(51, 65, 85);
      doc.text(pdfText(`${label}${continuation ? " (lanjutan)" : ""}`), MARGIN + 4, y + 4.7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.3);
      doc.setTextColor(71, 85, 105);
      doc.text(chunk, MARGIN + 4, y + 9.2, { lineHeightFactor: 1.15 });
      y += height + 2.5;
      continuation = true;
      if (lines.length > 0) newPage();
    }
  };

  const drawTable = (title: string, columns: TableColumn[], rows: string[][]) => {
    writeSectionTitle(title);
    let rowIndex = 0;

    const drawHeader = () => {
      const headerLines = columns.map((column) =>
        doc.splitTextToSize(pdfText(column.header), column.width - 4) as string[]
      );
      const headerHeight = Math.max(8, ...headerLines.map((lines) => lines.length * 3.2 + 3));
      ensure(headerHeight + 5);
      let x = MARGIN;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      for (let index = 0; index < columns.length; index += 1) {
        const column = columns[index];
        const lines = headerLines[index];
        doc.setFillColor(226, 232, 240);
        doc.setDrawColor(203, 213, 225);
        doc.rect(x, y, column.width, headerHeight, "FD");
        doc.setTextColor(51, 65, 85);
        doc.text(lines, x + column.width / 2, y + 4, {
          align: "center",
          lineHeightFactor: 1.05,
        });
        x += column.width;
      }
      y += headerHeight;
    };

    drawHeader();
    for (const row of rows) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.3);
      const wrapped = columns.map((column, index) =>
        doc.splitTextToSize(pdfText(row[index] ?? "-"), column.width - 4) as string[]
      );
      const rowHeight = Math.max(7, ...wrapped.map((lines) => lines.length * 3.4 + 3));
      if (y + rowHeight > PAGE_BOTTOM) {
        newPage();
        drawHeader();
      }

      let x = MARGIN;
      for (let index = 0; index < columns.length; index += 1) {
        const column = columns[index];
        const align = column.align ?? "left";
        const textX =
          align === "center"
            ? x + column.width / 2
            : align === "right"
              ? x + column.width - 2
              : x + 2;
        if (rowIndex % 2 === 0) doc.setFillColor(255, 255, 255);
        else doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(x, y, column.width, rowHeight, "FD");
        doc.setTextColor(71, 85, 105);
        doc.text(wrapped[index], textX, y + 4.2, {
          align,
          lineHeightFactor: 1.05,
        });
        x += column.width;
      }
      y += rowHeight;
      rowIndex += 1;
    }
    y += 4;
  };

  const drawLineMetricChart = (
    title: string,
    labels: string[],
    values: number[],
    unit: string,
    color: [number, number, number]
  ) => {
    if (values.length === 0) return;
    ensure(70);
    const top = y;
    const plotX = MARGIN + 18;
    const plotY = top + 10;
    const plotWidth = CONTENT_WIDTH - 23;
    const plotHeight = 43;
    const maxValue = Math.max(...values, 0.0001) * 1.1;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(pdfText(title), MARGIN, top + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(pdfText(unit), MARGIN, plotY + 2);
    doc.setDrawColor(203, 213, 225);
    doc.line(plotX, plotY, plotX, plotY + plotHeight);
    doc.line(plotX, plotY + plotHeight, plotX + plotWidth, plotY + plotHeight);
    doc.setDrawColor(226, 232, 240);
    doc.line(plotX, plotY + plotHeight / 2, plotX + plotWidth, plotY + plotHeight / 2);
    doc.text("0", plotX - 2, plotY + plotHeight + 1, { align: "right" });
    doc.text(displayNumber(maxValue / 2, 3), plotX - 2, plotY + plotHeight / 2 + 1, {
      align: "right",
    });
    doc.text(displayNumber(maxValue, 3), plotX - 2, plotY + 1, { align: "right" });

    const step = values.length > 1 ? plotWidth / (values.length - 1) : plotWidth / 2;
    const points = values.map((value, index) => ({
      x: values.length > 1 ? plotX + index * step : plotX + plotWidth / 2,
      y: plotY + plotHeight - (value / maxValue) * plotHeight,
    }));
    doc.setDrawColor(...color);
    doc.setLineWidth(0.7);
    for (let index = 1; index < points.length; index += 1) {
      doc.line(points[index - 1].x, points[index - 1].y, points[index].x, points[index].y);
    }
    doc.setFillColor(...color);
    points.forEach((point) => doc.circle(point.x, point.y, 1, "F"));

    doc.setTextColor(71, 85, 105);
    const labelWidth = Math.max(15, plotWidth / Math.max(labels.length, 1) - 1);
    labels.forEach((label, index) => {
      doc.text(pdfText(label), points[index].x, plotY + plotHeight + 5, {
        align: "center",
        maxWidth: labelWidth,
      });
    });
    y = top + 67;
  };

  const drawBarChart = (title: string, runs: ExperimentRun[], unit: string) => {
    if (runs.length === 0) return;
    ensure(70);
    const top = y;
    const plotX = MARGIN + 18;
    const plotY = top + 10;
    const plotWidth = CONTENT_WIDTH - 23;
    const plotHeight = 43;
    const maxValue =
      Math.max(...runs.map((run) => reportedRateValue(run)), 0.0001) * 1.1;
    const slotWidth = plotWidth / runs.length;
    const barWidth = Math.min(18, slotWidth * 0.55);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(pdfText(title), MARGIN, top + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(pdfText(unit), MARGIN, plotY + 2);
    doc.setDrawColor(203, 213, 225);
    doc.line(plotX, plotY, plotX, plotY + plotHeight);
    doc.line(plotX, plotY + plotHeight, plotX + plotWidth, plotY + plotHeight);
    doc.text("0", plotX - 2, plotY + plotHeight + 1, { align: "right" });
    doc.text(displayNumber(maxValue, 3), plotX - 2, plotY + 1, { align: "right" });

    runs.forEach((run, index) => {
      const height = (reportedRateValue(run) / maxValue) * plotHeight;
      const x = plotX + index * slotWidth + (slotWidth - barWidth) / 2;
      const color = CHART_COLORS[index % CHART_COLORS.length];
      doc.setFillColor(...color);
      doc.rect(x, plotY + plotHeight - height, barWidth, height, "F");
      doc.setTextColor(71, 85, 105);
      doc.text(pdfText(run.label), x + barWidth / 2, plotY + plotHeight + 5, {
        align: "center",
        maxWidth: Math.max(14, slotWidth - 1),
      });
    });
    y = top + 67;
  };

  const drawGasChart = (title: string, runs: ExperimentRun[]) => {
    const points = runs.flatMap((run) => run.series ?? []);
    if (points.length === 0) return;
    ensure(78);
    const top = y;
    const plotX = MARGIN + 18;
    const plotY = top + 17;
    const plotWidth = CONTENT_WIDTH - 23;
    const plotHeight = 43;
    const maxTime = Math.max(...points.map((point) => point.t), 1);
    const maxVolume = Math.max(...points.map((point) => point.v), 1) * 1.05;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(pdfText(title), MARGIN, top + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.3);
    runs.forEach((run, index) => {
      const legendX = MARGIN + (index % 3) * 57;
      const legendY = top + 9 + Math.floor(index / 3) * 4;
      const color = CHART_COLORS[index % CHART_COLORS.length];
      doc.setFillColor(...color);
      doc.rect(legendX, legendY - 2, 3, 1.2, "F");
      doc.setTextColor(71, 85, 105);
      doc.text(pdfText(run.label), legendX + 4, legendY - 0.7, { maxWidth: 50 });
    });
    doc.setDrawColor(203, 213, 225);
    doc.line(plotX, plotY, plotX, plotY + plotHeight);
    doc.line(plotX, plotY + plotHeight, plotX + plotWidth, plotY + plotHeight);
    doc.setTextColor(100, 116, 139);
    doc.text("V (mL)", MARGIN, plotY + 2);
    doc.text("0", plotX - 2, plotY + plotHeight + 1, { align: "right" });
    doc.text(displayNumber(maxVolume, 1), plotX - 2, plotY + 1, { align: "right" });
    doc.text("0", plotX, plotY + plotHeight + 5, { align: "center" });
    doc.text(`${maxTime} s`, plotX + plotWidth, plotY + plotHeight + 5, { align: "center" });

    runs.forEach((run, index) => {
      const series = run.series ?? [];
      const color = CHART_COLORS[index % CHART_COLORS.length];
      doc.setDrawColor(...color);
      doc.setLineWidth(0.55);
      for (let pointIndex = 1; pointIndex < series.length; pointIndex += 1) {
        const previous = series[pointIndex - 1];
        const current = series[pointIndex];
        doc.line(
          plotX + (previous.t / maxTime) * plotWidth,
          plotY + plotHeight - (previous.v / maxVolume) * plotHeight,
          plotX + (current.t / maxTime) * plotWidth,
          plotY + plotHeight - (current.v / maxVolume) * plotHeight
        );
      }
    });
    y = top + 75;
  };

  const drawExperiment = (report: ModuleReport) => {
    const cfg = report.experiment;
    if (!cfg || report.runs.length === 0) {
      writeSectionTitle("Data Percobaan");
      writeAnswer("Status", "Belum ada data percobaan yang tersimpan.");
      return;
    }

    const isGas = cfg.rateKind === "gasRate";
    let columns: TableColumn[];
    let rows: string[][];
    if (isGas) {
      const includeFinish = cfg.kind === "surface";
      const includeFinalVolume = cfg.kind !== "surface";
      columns = [
        { header: "No.", width: 10, align: "center" },
        { header: cfg.paramName, width: includeFinish ? 46 : 58 },
        {
          header: includeFinish ? "Volume (mL)" : "V 10 s (mL)",
          width: includeFinish ? 34 : 27,
          align: "center",
        },
        ...(includeFinalVolume
          ? ([{ header: "V akhir (mL)", width: 28, align: "center" }] as TableColumn[])
          : []),
        ...(includeFinish
          ? ([{ header: "Waktu (s)", width: 34, align: "center" }] as TableColumn[])
          : []),
        { header: `Laju (${cfg.rateUnit})`, width: includeFinish ? 54 : 55, align: "center" },
      ];
      rows = report.runs.map((run, index) => [
        String(index + 1),
        run.label,
        displayNumber(volumeAt(run, 10)),
        ...(includeFinalVolume ? [displayNumber(finalVolume(run))] : []),
        ...(includeFinish ? ["10"] : []),
        reportedRateLabel(run, cfg.rateUnit),
      ]);
    } else {
      columns = [
        { header: "No.", width: 10, align: "center" },
        { header: cfg.paramName, width: 68 },
        { header: cfg.timeLabel, width: 48, align: "center" },
        { header: `Laju (${cfg.rateUnit})`, width: 52, align: "center" },
      ];
      rows = report.runs.map((run, index) => [
        String(index + 1),
        run.label,
        `${displayNumber(run.timeSec, 1)} s`,
        reportedRateLabel(run, cfg.rateUnit),
      ]);
    }
    drawTable("Ringkasan Data Percobaan", columns, rows);

    if (isGas) {
      const gasRows = buildGasComparisonRows(cfg, report.runs);
      if (gasRows.length > 0) {
        const timeWidth = 24;
        const valueWidth = (CONTENT_WIDTH - timeWidth) / report.runs.length;
        drawTable(
          `Data Volume Gas (${cfg.gas?.sampleEvery ?? "-"} detik)`,
          [
            { header: "Waktu (s)", width: timeWidth, align: "center" },
            ...report.runs.map((run) => ({
              header: `${run.label} (mL)`,
              width: valueWidth,
              align: "center" as const,
            })),
          ],
          gasRows.map((row) => [
            String(row.t),
            ...report.runs.map((run) => displayNumber(row[run.label])),
          ])
        );
      }
      writeSectionTitle("Grafik Hasil Percobaan");
      const chartRuns =
        cfg.kind === "surface"
          ? report.runs.map((run) => ({
              ...run,
              series: gasRows.map((row) => ({
                t: row.t,
                v: row[run.label] ?? 0,
              })),
            }))
          : report.runs;
      drawGasChart("Grafik Volume Gas terhadap Waktu", chartRuns);
    } else {
      writeSectionTitle("Grafik Hasil Percobaan");
      drawLineMetricChart(
        `Grafik Waktu Reaksi terhadap ${cfg.chartX}`,
        report.runs.map((run) => run.label),
        report.runs.map((run) => run.timeSec ?? 0),
        "Waktu (s)",
        [245, 158, 11]
      );
    }
    drawBarChart(
      `Grafik Laju Reaksi terhadap ${cfg.chartX}`,
      report.runs,
      `Laju (${cfg.rateUnit})`
    );
  };

  // Document header and student identity.
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, PAGE_WIDTH, 34, "F");
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 31, PAGE_WIDTH, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("LKPD CHEMSPACE", MARGIN, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Lembar Kerja Peserta Didik - Laju Reaksi Berbasis Inkuiri Terbimbing", MARGIN, 22);
  doc.setFontSize(7.5);
  doc.text("Rekap penyelidikan Modul 1-4", MARGIN, 28);
  y = 42;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 25, 2, 2, "FD");
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("NAMA SISWA", MARGIN + 4, y + 5);
  doc.text("KELAS", MARGIN + 4, y + 15);
  doc.text("DIFINALISASI", MARGIN + 94, y + 5);
  doc.text("JUMLAH MODUL", MARGIN + 94, y + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(pdfText(studentName), MARGIN + 4, y + 9.5, { maxWidth: 83 });
  doc.text(pdfText(className), MARGIN + 4, y + 19.5, { maxWidth: 83 });
  doc.text(pdfText(formatDateTime(snapshot.finalizedAt)), MARGIN + 94, y + 9.5, {
    maxWidth: 80,
  });
  doc.text(`${reports.length} modul`, MARGIN + 94, y + 19.5);
  y += 32;

  for (const report of reports) {
    activeModule = `Modul ${report.moduleId} - ${report.title}`;
    if (y > 238) newPage();
    ensure(24);
    doc.setFillColor(219, 234, 254);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 11, 1.8, 1.8, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(29, 78, 216);
    doc.text(pdfText(activeModule), MARGIN + 4, y + 7.2);
    y += 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);
    doc.setTextColor(71, 85, 105);
    const description = doc.splitTextToSize(pdfText(report.description), CONTENT_WIDTH) as string[];
    doc.text(description, MARGIN, y, { lineHeightFactor: 1.15 });
    y += description.length * 4 + 2;
    if (report.experiment?.reaction) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text(pdfText(`Reaksi: ${report.experiment.reaction}`), MARGIN, y, {
        maxWidth: CONTENT_WIDTH,
      });
      y += 6;
    }

    writeSectionTitle("Jawaban dan Analisis Siswa");
    report.items.forEach((item) => writeAnswer(item.label, item.value));
    drawExperiment(report);
    y += 4;
  }

  // Footer on every page.
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, 287, PAGE_WIDTH - MARGIN, 287);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("ChemSpace v1.2", MARGIN, 292);
    doc.text(`Halaman ${page} dari ${pageCount}`, PAGE_WIDTH - MARGIN, 292, {
      align: "right",
    });
  }

  const safeName = studentName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .trim()
    .replace(/\s+/g, "_") || "siswa";
  doc.save(`LKPD-ChemSpace-${safeName}.pdf`);
}
