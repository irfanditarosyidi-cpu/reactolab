// Turn stored responses/runs into labeled Q&A pairs — reused by the teacher
// read-only detail view and the LKPD PDF generator.

import {
  MODULES,
  type ExperimentConfig,
  type ModuleDef,
} from "./module-defs";
import { sortRuns } from "./runs";
import type { ExperimentRun } from "./types";

export interface QA {
  label: string;
  value: string;
}

export interface ModuleReport {
  moduleId: number;
  title: string;
  description: string;
  items: QA[];
  runs: ExperimentRun[];
  rateUnit?: string;
  paramName?: string;
  experiment?: ExperimentConfig;
}

type AnyMap = Record<string, unknown>;

function str(v: unknown): string {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string") return v.trim() || "-";
  return String(v);
}

export function hypothesisText(def: ModuleDef, d: AnyMap | undefined): string {
  if (!d?.direction || !d?.effect) return "-";
  return `${def.hypothesis?.subject ?? "Jika"} ${str(d.direction)}, maka laju reaksi akan ${str(
    d.effect
  )}, karena ${str(d.reason)}`;
}

export function runsOf(
  def: ModuleDef,
  experiments: AnyMap | undefined
): ExperimentRun[] {
  const modExp = (experiments?.[`m${def.id}`] as AnyMap | undefined)?.runs as
    | Record<string, ExperimentRun>
    | undefined;
  if (!modExp || !def.experiment) return [];
  // Generic ordering: works for student-defined concentrations (Module 1) as
  // well as preset options (Modules 2–4 and legacy Module 1 data).
  return sortRuns(def.experiment, modExp);
}

export function buildModuleReport(
  def: ModuleDef,
  responses: AnyMap | undefined,
  experiments: AnyMap | undefined
): ModuleReport {
  const currentResponse = responses?.[`m${def.id}`] as AnyMap | undefined;
  // Discussion used to be Module 6. Only fall back when no Module 5 payload
  // exists, so the present closing-module response is never mixed into it.
  const resp =
    def.id === 5
      ? {
          ...((responses?.m6 as AnyMap | undefined) ?? {}),
          ...(currentResponse ?? {}),
        }
      : currentResponse ?? {};
  const items: QA[] = [];
  const s = (id: string) => (resp[id] as AnyMap | undefined) ?? {};

  if (def.id >= 1 && def.id <= 4) {
    items.push({
      label: "Fenomena Awal (Orientasi)",
      value: [def.orientation?.story, def.orientation?.caption]
        .filter(Boolean)
        .join(" "),
    });
    items.push({
      label: "Rumusan Masalah",
      value:
        s("section2").varBebas || s("section2").varTerikat
          ? `Bagaimana pengaruh ${str(s("section2").varBebas)} terhadap ${str(
              s("section2").varTerikat
            )}?`
          : "-",
    });
    items.push({ label: "Hipotesis", value: hypothesisText(def, s("section3")) });
    items.push({
      label: "Persamaan Reaksi (jawaban siswa)",
      value: s("section4").symbolicAnswer
        ? `${def.experiment?.reactionLeft ?? ""} ${str(s("section4").symbolicAnswer)}`
        : "-",
    });
    const explain = (s("section4").explain as AnyMap | undefined) ?? {};
    items.push({ label: "Penjelasan Makroskopik", value: str(explain.makro) });
    items.push({ label: "Penjelasan Submikroskopik", value: str(explain.submikro) });
    items.push({ label: "Penjelasan Simbolik", value: str(explain.simbolik) });
    const verdict = s("section5").verdict;
    items.push({
      label: "Uji Hipotesis",
      value:
        verdict === "terbukti"
          ? `Hipotesis TERBUKTI — ${str(s("section5").explanation)}`
          : verdict === "tidak_terbukti"
            ? `Hipotesis TIDAK TERBUKTI — ${str(s("section5").explanation)}`
            : "-",
    });
    items.push({ label: "Kesimpulan", value: str(s("section6").text) });
  } else if (def.id === 5) {
    const cases = s("sectionCases");
    const legacyCer = s("section3");
    const legacyDecisions = (s("section5").decisions as AnyMap | undefined) ?? {};
    const caseIds = new Set([
      ...Object.keys(cases).filter((key) => key !== "casePlan"),
      ...Object.keys(legacyCer),
      ...Object.keys(legacyDecisions),
    ]);

    if (caseIds.size === 0) {
      items.push({ label: "Respons Studi Kasus", value: "-" });
    }

    for (const caseId of Array.from(caseIds)) {
      const value = (cases[caseId] as AnyMap | undefined) ?? {};
      const snapshot = (value.caseSnapshot as AnyMap | undefined) ?? {};
      const title = str(snapshot.title) === "-" ? `Kasus ${caseId}` : str(snapshot.title);
      const orientation = (value.orientation as AnyMap | undefined) ?? {};
      const problem = (value.problem as AnyMap | undefined) ?? {};
      const hypothesis = (value.hypothesis as AnyMap | undefined) ?? {};
      const evidence = (value.evidence as AnyMap | undefined) ?? {};
      const testing = (value.testing as AnyMap | undefined) ?? {};
      const conclusion = (value.conclusion as AnyMap | undefined) ?? {};
      const oldCer = (legacyCer[caseId] as AnyMap | undefined) ?? {};
      const ownEvidence = Array.isArray(evidence.ownEvidence)
        ? (evidence.ownEvidence as AnyMap[])
        : [];
      const reviews =
        value.peerReviews && typeof value.peerReviews === "object"
          ? (Object.values(value.peerReviews as AnyMap) as AnyMap[])
          : [];

      items.push({
        label: `${title} · Pihak Lain`,
        value: str(orientation.otherStakeholder),
      });
      items.push({
        label: `${title} · Rumusan Masalah`,
        value:
          str(problem.question) !== "-"
            ? str(problem.question)
            : [problem.chemicalFactor, problem.impactRisk, problem.stakeholderConsideration]
                .map(str)
                .filter((part) => part !== "-")
                .join(" · ") || "-",
      });
      items.push({
        label: `${title} · Hipotesis`,
        value:
          str(hypothesis.position) !== "-"
            ? str(hypothesis.reason) !== "-"
              ? `${str(hypothesis.position)} — Alasan: ${str(hypothesis.reason)}`
              : str(hypothesis.position)
            : str(value.claim) !== "-" || str(oldCer.claim) !== "-"
              ? `CER historis — ${str(value.claim ?? oldCer.claim)}`
              : "-",
      });
      items.push({
        label: `${title} · Bukti Pilihan`,
        value: [
          Array.isArray(evidence.selectedScientificIds) && evidence.selectedScientificIds.length
            ? `Ilmiah: ${(evidence.selectedScientificIds as string[]).join(", ")}`
            : "",
          Array.isArray(evidence.selectedSocioeconomicIds) && evidence.selectedSocioeconomicIds.length
            ? `Sosial-ekonomi: ${(evidence.selectedSocioeconomicIds as string[]).join(", ")}`
            : "",
          ...ownEvidence.map(
            (item) =>
              `${str(item.category)}: ${str(item.content)} (asal: ${str(item.source)}; alasan: ${str(item.selectionReason)})`
          ),
          str(evidence.selectionReason) !== "-"
            ? `Alasan kumpulan bukti: ${str(evidence.selectionReason)}`
            : "",
          str(value.evidenceText) !== "-" ? `CER historis: ${str(value.evidenceText)}` : "",
          str(oldCer.evidence) !== "-" ? `CER historis: ${str(oldCer.evidence)}` : "",
        ]
          .filter(Boolean)
          .join("\n") || "-",
      });
      items.push({
        label: `${title} · Uji Hipotesis`,
        value:
          str(testing.argument) !== "-"
            ? `${testing.verdict === "supported" ? "Didukung" : "Tidak didukung"} — ${str(testing.argument)}`
            : str(value.reasoning) !== "-" || str(oldCer.reasoning) !== "-"
              ? `CER historis — ${str(value.reasoning ?? oldCer.reasoning)}`
              : "-",
      });
      items.push({
        label: `${title} · Tanggapan Teman`,
        value:
          reviews.length > 0
            ? reviews
                .map(
                  (review) =>
                    `${str(review.targetName)} — Perbedaan: ${str(review.differenceReason)}; Tanggapan: ${str(review.response)}`
                )
                .join("\n")
            : value.peerExceptionUsedAt
              ? `Pengecualian guru digunakan: ${str(value.peerExceptionNote)}`
              : "-",
      });
      const oldDecision = value.decision ?? legacyDecisions[caseId];
      items.push({
        label: `${title} · Kesimpulan dan Keputusan`,
        value:
          str(conclusion.problemAnswer) !== "-" || str(conclusion.policySolution) !== "-"
            ? `Jawaban: ${str(conclusion.problemAnswer)}\nSolusi/kebijakan: ${str(conclusion.policySolution)}\nDasar bukti: ${str(conclusion.evidenceBasis)}`
            : str(oldDecision),
      });
    }
  }

  return {
    moduleId: def.id,
    title: def.title,
    description: def.description,
    items,
    runs: runsOf(def, experiments),
    rateUnit: def.experiment?.rateUnit,
    paramName: def.experiment?.paramName,
    experiment: def.experiment,
  };
}

export function buildAllReports(
  responses: AnyMap | undefined,
  experiments: AnyMap | undefined,
  moduleIds: number[] = [1, 2, 3, 4]
): ModuleReport[] {
  return MODULES.filter((m) => moduleIds.includes(m.id)).map((def) =>
    buildModuleReport(def, responses, experiments)
  );
}
