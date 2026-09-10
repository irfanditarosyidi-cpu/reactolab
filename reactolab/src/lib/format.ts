// Turn stored responses/runs into labeled Q&A pairs — reused by the teacher
// read-only detail view and the LKPD PDF generator.

import { MODULES, type ModuleDef } from "./module-defs";
import type { ExperimentRun } from "./types";

export interface QA {
  label: string;
  value: string;
}

export interface ModuleReport {
  moduleId: number;
  title: string;
  items: QA[];
  runs: ExperimentRun[];
  rateUnit?: string;
  paramName?: string;
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
  return def.experiment.options
    .map((o) => modExp[o.value.replace(/[.#$/[\]]/g, "_")])
    .filter(Boolean) as ExperimentRun[];
}

export function buildModuleReport(
  def: ModuleDef,
  responses: AnyMap | undefined,
  experiments: AnyMap | undefined
): ModuleReport {
  const resp = (responses?.[`m${def.id}`] as AnyMap | undefined) ?? {};
  const items: QA[] = [];
  const s = (id: string) => (resp[id] as AnyMap | undefined) ?? {};

  if (def.id >= 1 && def.id <= 4) {
    items.push({ label: "Pengamatan Awal (Orientasi)", value: str(s("section1").observation) });
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
  } else if (def.id === 0) {
    items.push({ label: "Apersepsi", value: s("section2").quiz !== undefined ? "Selesai" : "-" });
  } else if (def.id === 5) {
    items.push({ label: "Konsep Dasar — jawaban", value: str(s("section1").answer) });
    items.push({
      label: "Kuis Persamaan Laju",
      value: s("section2").quiz ? "Selesai (benar semua)" : "-",
    });
    items.push({
      label: "Kuis Teori Tumbukan",
      value: s("section3").quiz ? "Selesai (benar semua)" : "-",
    });
  } else if (def.id === 6) {
    const dec = (s("section5").decisions as Record<string, string> | undefined) ?? {};
    const parts = Object.values(dec).filter(Boolean);
    items.push({
      label: "Keputusan Diskusi",
      value: parts.length ? parts.join(" — ") : "-",
    });
  }

  return {
    moduleId: def.id,
    title: def.title,
    items,
    runs: runsOf(def, experiments),
    rateUnit: def.experiment?.rateUnit,
    paramName: def.experiment?.paramName,
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
