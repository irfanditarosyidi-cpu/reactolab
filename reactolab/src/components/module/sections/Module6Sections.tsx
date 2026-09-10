"use client";

// Module 6 — Forum Diskusi Ilmiah CER (PRD §24).
// Submit-to-reveal: forum feed only becomes visible after the student's own
// CER is submitted (also enforced by RTDB security rules).

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MessageCircle, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import { Help, Label, Textarea } from "@/components/ui/forms";
import { Badge, Avatar, Spinner } from "@/components/ui/misc";
import {
  addComment,
  listenComments,
  listenConclusion,
  listenPosts,
  listenPublishedCases,
  readOnce,
  submitCER,
  updatePaths,
} from "@/lib/db";
import { P } from "@/lib/paths";
import { formatRelative } from "@/lib/utils";
import { useEngine } from "../engine";
import type { SectionProps } from "./InquirySections";
import type {
  DiscussionCase,
  ForumComment,
  ForumPost,
  TeacherConclusion,
} from "@/lib/types";

type CaseItem = DiscussionCase & { id: string };

function useCases(): CaseItem[] | null {
  const { classId } = useEngine();
  const [cases, setCases] = useState<CaseItem[] | null>(null);
  useEffect(() => listenPublishedCases(classId, setCases), [classId]);
  return cases;
}

function WaitingTeacher({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
      <div className="text-2xl">⏳</div>
      <p className="mt-2 text-sm font-bold text-amber-900">Menunggu Guru</p>
      <p className="text-sm text-amber-800 mt-1">{text}</p>
      <p className="text-xs text-amber-700 mt-2">
        Kamu dapat menekan <b>Simpan &amp; Keluar</b> dan kembali lagi nanti — halaman
        ini akan terbuka otomatis saat guru mempublikasikannya.
      </p>
    </div>
  );
}

// ---------- Section 1: Pembuka ----------

export function M6Intro({ sec, readOnly }: SectionProps) {
  const { completeSection } = useEngine();
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-sm text-slate-700 leading-relaxed space-y-2">
        <p>
          Selamat datang di <b>Forum Diskusi Ilmiah</b>! Kali ini kamu akan menggunakan
          hasil penyelidikanmu untuk menanggapi kasus nyata dengan format{" "}
          <b>CER (Claim–Evidence–Reasoning)</b>:
        </p>
        <ul className="space-y-1">
          <li>
            • <b>Claim</b> — pernyataan/pendapatmu terhadap pertanyaan kasus.
          </li>
          <li>
            • <b>Evidence</b> — bukti/data (dari artikel maupun eksperimenmu).
          </li>
          <li>
            • <b>Reasoning</b> — penalaran ilmiah yang menghubungkan bukti dengan
            claim.
          </li>
        </ul>
        <p>
          Setelah mengirim pendapatmu, kamu baru bisa melihat pendapat teman dan wajib
          memberi minimal satu tanggapan.
        </p>
      </div>
      {!readOnly && (
        <Button
          className="mt-4"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await completeSection(sec.id);
            } finally {
              setBusy(false);
            }
          }}
        >
          Mulai Diskusi
        </Button>
      )}
    </div>
  );
}

// ---------- Section 2: Artikel & Pertanyaan ----------

export function M6Articles({ sec, readOnly }: SectionProps) {
  const { drafts, updateDraft, completeSection } = useEngine();
  const cases = useCases();
  const d = drafts[sec.id] ?? {};
  const read = (d.read as Record<string, boolean>) ?? {};
  const [busy, setBusy] = useState(false);

  if (cases === null) return <Spinner label="Memuat kasus…" />;
  if (cases.length === 0)
    return <WaitingTeacher text="Guru belum mempublikasikan studi kasus diskusi." />;

  const allRead = cases.every((c) => read[c.id]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Baca artikel pada setiap kasus berikut, lalu cermati pertanyaannya:
      </p>
      {cases.map((c, i) => (
        <div key={c.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <Badge tone="blue">Kasus {i + 1}</Badge>
            <h4 className="font-bold text-slate-800 text-sm">{c.title}</h4>
          </div>
          {c.articleNote ? (
            <p className="mt-2 text-sm text-slate-600">{c.articleNote}</p>
          ) : null}
          <a
            href={c.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
          >
            <ExternalLink className="h-4 w-4" /> Buka Artikel
          </a>
          <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
            <p className="text-xs font-bold text-slate-500 uppercase">Pertanyaan Diskusi</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{c.question}</p>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={Boolean(read[c.id])}
              disabled={readOnly}
              onChange={(e) =>
                updateDraft(sec.id, { read: { ...read, [c.id]: e.target.checked } })
              }
            />
            Saya sudah membaca artikel dan memahami pertanyaannya
          </label>
        </div>
      ))}
      {!readOnly && (
        <Button
          disabled={!allRead}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await completeSection(sec.id);
            } finally {
              setBusy(false);
            }
          }}
        >
          Lanjut Menyusun Pendapat
        </Button>
      )}
    </div>
  );
}

// ---------- Section 3: CER Form (submit-to-reveal) ----------

const CER_FIELDS = [
  { key: "claim", label: "Claim (pernyataanmu)", ph: "Menurut saya, …" },
  {
    key: "evidence",
    label: "Evidence (bukti/data)",
    ph: "Berdasarkan artikel dan data eksperimen saya pada Modul …, …",
  },
  {
    key: "reasoning",
    label: "Reasoning (penalaran ilmiah)",
    ph: "Bukti tersebut mendukung claim saya karena menurut teori tumbukan …",
  },
] as const;

export function M6CER({ sec, readOnly }: SectionProps) {
  const { classId, uid, studentName, drafts, updateDraft, completeSection } =
    useEngine();
  const cases = useCases();
  const d = drafts[sec.id] ?? {};
  const [submitted, setSubmitted] = useState<Record<string, boolean> | null>(null);
  const [busyCase, setBusyCase] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // check which cases already have our post
  useEffect(() => {
    if (!cases) return;
    let alive = true;
    (async () => {
      const map: Record<string, boolean> = {};
      for (const c of cases) {
        const post = await readOnce<ForumPost>(P.post(classId, c.id, uid));
        map[c.id] = Boolean(post);
      }
      if (alive) setSubmitted(map);
    })();
    return () => {
      alive = false;
    };
  }, [cases, classId, uid]);

  if (cases === null || submitted === null) return <Spinner label="Memuat…" />;
  if (cases.length === 0)
    return <WaitingTeacher text="Guru belum mempublikasikan studi kasus diskusi." />;

  const allSubmitted = cases.every((c) => submitted[c.id]);

  const send = async (c: CaseItem) => {
    const form = (d[c.id] as Record<string, string>) ?? {};
    setBusyCase(c.id);
    try {
      await submitCER(classId, c.id, uid, {
        claim: (form.claim ?? "").trim(),
        evidence: (form.evidence ?? "").trim(),
        reasoning: (form.reasoning ?? "").trim(),
        studentName,
        submittedAt: Date.now(),
      });
      setSubmitted((m) => ({ ...(m ?? {}), [c.id]: true }));
    } finally {
      setBusyCase(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 font-semibold">
        ⚠ Pendapat teman-temanmu baru terlihat SETELAH kamu mengirim CER milikmu
        sendiri, dan CER yang telah dikirim tidak dapat diubah.
      </div>
      {cases.map((c, i) => {
        const form = (d[c.id] as Record<string, string>) ?? {};
        const isDone = submitted[c.id];
        const valid = CER_FIELDS.every((f) => (form[f.key] ?? "").trim().length >= 10);
        return (
          <div key={c.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Badge tone="blue">Kasus {i + 1}</Badge>
              <p className="text-sm font-bold text-slate-800">{c.question}</p>
            </div>
            {isDone ? (
              <p className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm text-emerald-800 font-semibold">
                ✔ CER kamu untuk kasus ini sudah terkirim.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {CER_FIELDS.map((f) => (
                  <div key={f.key}>
                    <Label>{f.label}</Label>
                    <Textarea
                      rows={2}
                      disabled={readOnly}
                      value={form[f.key] ?? ""}
                      onChange={(e) =>
                        updateDraft(sec.id, {
                          [c.id]: { ...form, [f.key]: e.target.value },
                        })
                      }
                      placeholder={f.ph}
                    />
                  </div>
                ))}
                {!readOnly && (
                  <Button
                    size="sm"
                    disabled={!valid}
                    loading={busyCase === c.id}
                    onClick={() => void send(c)}
                  >
                    <Send className="h-4 w-4" /> Kirim CER (tidak dapat diubah)
                  </Button>
                )}
                {!valid && (
                  <Help>Isi ketiga bagian (masing-masing ≥ 10 karakter).</Help>
                )}
              </div>
            )}
          </div>
        );
      })}
      {!readOnly && (
        <Button
          disabled={!allSubmitted}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await completeSection(sec.id);
            } finally {
              setBusy(false);
            }
          }}
        >
          Buka Forum Tanggapan
        </Button>
      )}
    </div>
  );
}

// ---------- Section 4: Forum Tanggapan ----------

function CaseForum({
  c,
  index,
  readOnly,
  onMyComments,
}: {
  c: CaseItem;
  index: number;
  readOnly: boolean;
  onMyComments: (caseId: string, count: number) => void;
}) {
  const { classId, uid, studentName } = useEngine();
  const [posts, setPosts] = useState<Array<ForumPost & { uid: string }>>([]);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [text, setText] = useState("");
  const [target, setTarget] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => listenPosts(classId, c.id, setPosts), [classId, c.id]);
  useEffect(() => {
    const unsub = listenComments(classId, c.id, (list) => {
      setComments(list);
      onMyComments(c.id, list.filter((x) => x.authorId === uid).length);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, c.id, uid]);

  const myCount = comments.filter((x) => x.authorId === uid).length;

  const sendComment = async () => {
    if (text.trim().length < 5) return;
    setBusy(true);
    try {
      const targetPost = posts.find((p) => p.uid === target);
      await addComment(classId, c.id, {
        authorId: uid,
        authorName: studentName,
        text: text.trim(),
        createdAt: Date.now(),
        ...(target ? { targetStudentId: target, targetName: targetPost?.studentName } : {}),
      });
      setText("");
      setTarget("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge tone="blue">Kasus {index + 1}</Badge>
          <p className="text-sm font-bold text-slate-800">{c.title}</p>
        </div>
        <Badge tone={myCount > 0 ? "green" : "amber"}>
          Tanggapanmu: {myCount} {myCount > 0 ? "✔" : "(min. 1)"}
        </Badge>
      </div>

      <div className="mt-3 space-y-3 max-h-96 overflow-y-auto thin-scroll pr-1">
        {posts.map((p) => {
          const postComments = comments.filter((x) => x.targetStudentId === p.uid);
          return (
            <div
              key={p.uid}
              className={
                "rounded-xl border p-3.5 " +
                (p.uid === uid ? "border-brand-300 bg-brand-50/50" : "border-slate-200 bg-white")
              }
            >
              <div className="flex items-center gap-2">
                <Avatar name={p.studentName} size={28} />
                <p className="text-sm font-bold text-slate-800">
                  {p.studentName}
                  {p.uid === uid ? " (kamu)" : ""}
                </p>
                <span className="text-[11px] text-slate-400 ml-auto">
                  {formatRelative(p.submittedAt)}
                </span>
              </div>
              <div className="mt-2 space-y-1.5 text-sm">
                <p><b className="text-brand-700">Claim:</b> <span className="text-slate-700">{p.claim}</span></p>
                <p><b className="text-emerald-700">Evidence:</b> <span className="text-slate-700">{p.evidence}</span></p>
                <p><b className="text-amber-700">Reasoning:</b> <span className="text-slate-700">{p.reasoning}</span></p>
              </div>
              {postComments.length > 0 && (
                <div className="mt-2.5 border-t border-slate-100 pt-2 space-y-1.5">
                  {postComments.map((cm) => (
                    <p key={cm.id} className="text-xs text-slate-600">
                      <MessageCircle className="h-3 w-3 inline mr-1 text-brand-500" />
                      <b>{cm.authorName}:</b> {cm.text}
                    </p>
                  ))}
                </div>
              )}
              {!readOnly && p.uid !== uid && (
                <button
                  type="button"
                  onClick={() => setTarget(p.uid)}
                  className={
                    "mt-2 text-xs font-semibold rounded-full px-2.5 py-1 border " +
                    (target === p.uid
                      ? "bg-brand-600 text-white border-brand-600"
                      : "text-brand-600 border-brand-200 hover:bg-brand-50")
                  }
                >
                  {target === p.uid ? "Menanggapi ini…" : "Tanggapi"}
                </button>
              )}
            </div>
          );
        })}
        {/* general comments (no target) */}
        {comments.filter((x) => !x.targetStudentId).length > 0 && (
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-bold text-slate-500 mb-1.5">Tanggapan umum</p>
            {comments
              .filter((x) => !x.targetStudentId)
              .map((cm) => (
                <p key={cm.id} className="text-xs text-slate-600 mb-1">
                  <b>{cm.authorName}:</b> {cm.text}
                </p>
              ))}
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="mt-3 flex gap-2">
          <Textarea
            rows={1}
            className="min-h-[44px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              target
                ? `Tanggapi pendapat ${posts.find((p) => p.uid === target)?.studentName ?? "teman"}…`
                : "Tulis tanggapan (setuju/tidak setuju + alasan ilmiah)…"
            }
          />
          <Button size="sm" onClick={() => void sendComment()} loading={busy} disabled={text.trim().length < 5}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function M6Forum({ sec, readOnly }: SectionProps) {
  const { drafts, updateDraft, completeSection } = useEngine();
  const cases = useCases();
  const d = drafts[sec.id] ?? {};
  const counts = (d.myComments as Record<string, number>) ?? {};
  const [busy, setBusy] = useState(false);

  if (cases === null) return <Spinner label="Memuat forum…" />;
  if (cases.length === 0)
    return <WaitingTeacher text="Guru belum mempublikasikan studi kasus diskusi." />;

  const allCommented = cases.every((c) => (counts[c.id] ?? 0) >= 1);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Baca pendapat teman-temanmu, lalu beri <b>minimal satu tanggapan ilmiah</b>{" "}
        pada setiap kasus (setuju/tidak setuju beserta alasannya).
      </p>
      {cases.map((c, i) => (
        <CaseForum
          key={c.id}
          c={c}
          index={i}
          readOnly={readOnly}
          onMyComments={(caseId, count) => {
            if ((counts[caseId] ?? -1) !== count) {
              updateDraft(sec.id, { myComments: { ...counts, [caseId]: count } });
            }
          }}
        />
      ))}
      {!readOnly && (
        <Button
          disabled={!allCommented}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await completeSection(sec.id);
            } finally {
              setBusy(false);
            }
          }}
        >
          Lanjut ke Pengambilan Keputusan
        </Button>
      )}
    </div>
  );
}

// ---------- Section 5: Decision Making ----------

export function M6Decision({ sec, readOnly }: SectionProps) {
  const { classId, uid, drafts, updateDraft, completeSection } = useEngine();
  const cases = useCases();
  const d = drafts[sec.id] ?? {};
  const decisions = (d.decisions as Record<string, string>) ?? {};
  const [busy, setBusy] = useState(false);

  if (cases === null) return <Spinner label="Memuat…" />;
  if (cases.length === 0)
    return <WaitingTeacher text="Guru belum mempublikasikan studi kasus diskusi." />;

  const allDone = cases.every((c) => (decisions[c.id] ?? "").trim().length >= 15);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Setelah berdiskusi, ambil keputusan akhirmu untuk setiap kasus:
      </p>
      {cases.map((c, i) => (
        <div key={c.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <Badge tone="blue">Kasus {i + 1}</Badge>
            <p className="text-sm font-bold text-slate-800">{c.title}</p>
          </div>
          <p className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            {c.decisionPrompt}
          </p>
          <Textarea
            className="mt-2"
            rows={3}
            disabled={readOnly}
            value={decisions[c.id] ?? ""}
            onChange={(e) =>
              updateDraft(sec.id, {
                decisions: { ...decisions, [c.id]: e.target.value },
              })
            }
            placeholder="Keputusan saya beserta pertimbangan ilmiahnya…"
          />
        </div>
      ))}
      {!readOnly && (
        <Button
          disabled={!allDone}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const updates: Record<string, unknown> = {};
              for (const c of cases) {
                updates[`${P.discussionProgress(classId, uid)}/${c.id}/decisionAt`] =
                  Date.now();
              }
              await updatePaths(updates);
              await completeSection(sec.id);
            } finally {
              setBusy(false);
            }
          }}
        >
          Kirim Keputusan
        </Button>
      )}
    </div>
  );
}

// ---------- Section 6: Kesimpulan Guru ----------

export function M6Conclusion({ sec, readOnly }: SectionProps) {
  const { classId, completeSection } = useEngine();
  const [conclusion, setConclusion] = useState<TeacherConclusion | null | undefined>(
    undefined
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => listenConclusion(classId, (c) => setConclusion(c)), [classId]);

  const published = useMemo(
    () => Boolean(conclusion && conclusion.published),
    [conclusion]
  );

  if (conclusion === undefined) return <Spinner label="Memeriksa kesimpulan guru…" />;

  return (
    <div className="space-y-4">
      {!published ? (
        <WaitingTeacher text="Guru sedang menyusun kesimpulan diskusi. Bagian ini terbuka otomatis begitu kesimpulan dipublikasikan." />
      ) : (
        <>
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-brand-600">
              📌 Kesimpulan dari Gurumu
            </p>
            <p className="mt-2 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {conclusion?.content}
            </p>
          </div>
          {!readOnly && (
            <Button
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await completeSection(sec.id);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Selesaikan Modul 6
            </Button>
          )}
        </>
      )}
    </div>
  );
}
