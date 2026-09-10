"use client";

// Small multiple-choice question with instant feedback (retry until correct).

import { cn } from "@/lib/utils";

export interface MCQItem {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export default function MCQ({
  item,
  chosen,
  readOnly,
  onChoose,
  index,
}: {
  item: MCQItem;
  chosen: number | undefined;
  readOnly: boolean;
  onChoose: (i: number) => void;
  index?: number;
}) {
  const answered = chosen !== undefined && chosen !== null;
  const correct = answered && chosen === item.answer;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">
        {index !== undefined ? `${index}. ` : ""}
        {item.q}
      </p>
      <div className="mt-3 grid sm:grid-cols-2 gap-2">
        {item.options.map((opt, i) => {
          const isChosen = chosen === i;
          const isAnswer = i === item.answer;
          return (
            <button
              key={i}
              type="button"
              disabled={readOnly || correct}
              onClick={() => onChoose(i)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm text-left transition-colors",
                isChosen && isAnswer &&
                  "border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold",
                isChosen && !isAnswer && "border-red-300 bg-red-50 text-red-700",
                !isChosen &&
                  "border-slate-200 bg-white text-slate-600 hover:border-brand-300 disabled:opacity-70"
              )}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <p
          className={cn(
            "mt-2.5 text-xs rounded-lg px-3 py-2",
            correct
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          )}
        >
          {correct ? `✔ Benar! ${item.explain}` : "✖ Belum tepat — coba lagi."}
        </p>
      )}
    </div>
  );
}
