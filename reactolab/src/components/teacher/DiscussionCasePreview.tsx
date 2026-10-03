import BibliographyList from "@/components/ui/BibliographyList";
import ScientificText from "@/components/ui/ScientificText";
import { narrativeParagraphs, normalizedCase } from "@/lib/discussion";
import type { DiscussionCase } from "@/lib/types";

export default function DiscussionCasePreview({
  discussionCase,
}: {
  discussionCase: DiscussionCase;
}) {
  const value = normalizedCase(discussionCase);

  return (
    <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-brand-700">
        Pratinjau Siswa
      </p>
      {value.imageUrl && (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.imageUrl}
            alt={value.imageAlt ?? value.imageCaption ?? value.title}
            className="max-h-64 w-full rounded-lg object-cover"
          />
          <figcaption className="mt-1 text-[11px] text-slate-500">
            {value.imageCaption || "Caption belum diisi"}
          </figcaption>
        </figure>
      )}
      <h4 className="font-black text-slate-900">{value.title || "Tanpa judul"}</h4>
      {narrativeParagraphs(value.narrative).length ? (
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          {narrativeParagraphs(value.narrative).map((paragraph, index) => (
            <p key={index} className="[text-align:justify] [text-indent:2rem]">
              <ScientificText text={paragraph} />
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Narasi belum diisi.</p>
      )}
      {Boolean(value.sources?.length) && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            Daftar Pustaka
          </p>
          <BibliographyList sources={value.sources ?? []} className="mt-2" />
        </div>
      )}
      <p className="rounded-lg bg-white p-3 text-sm font-semibold text-slate-800">
        {value.phenomenonQuestion || "Pertanyaan pemantik belum diisi."}
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {value.stakeholderPerspectives?.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-slate-200 bg-white p-2 text-xs"
          >
            <b>{item.stakeholder}</b>
            <p className="mt-1 text-slate-600">{item.argument}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {value.scientificEvidence?.length ?? 0} bukti ilmiah ·{" "}
        {value.socioeconomicEvidence?.length ?? 0} bukti sosial-ekonomi
      </p>
    </div>
  );
}
