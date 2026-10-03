import { sourceCitation } from "@/lib/discussion";
import type { DiscussionSource } from "@/lib/types";
import { cn } from "@/lib/utils";

function LinkedCitation({ text }: { text: string }) {
  return (
    <>
      {text.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={`${part}-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-full break-all font-semibold text-brand-600 [overflow-wrap:anywhere] text-[clamp(0.625rem,1.5vw,0.75rem)] hover:underline"
          >
            {part}
          </a>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function BibliographyList({
  sources,
  className,
}: {
  sources: DiscussionSource[];
  className?: string;
}) {
  const entries = sources
    .map((source) => ({ id: source.id, citation: sourceCitation(source) }))
    .filter((entry) => entry.citation.trim());

  return (
    <ol className={cn("space-y-2", className)}>
      {entries.map((entry, index) => (
        <li
          key={entry.id}
          className="grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)] gap-x-1 text-xs leading-relaxed text-slate-600"
        >
          <span aria-hidden="true">[{index + 1}]</span>
          <p className="min-w-0 [overflow-wrap:anywhere]">
            <LinkedCitation text={entry.citation} />
          </p>
        </li>
      ))}
    </ol>
  );
}
