"use client";

// Module 5 — Aplikasi Konsep. Legacy CER components remain here only so old
// records can still be rendered; the active case flow lives in Module5CaseFlow.
// Submit-to-reveal: forum feed only becomes visible after the student's own
// CER is submitted (also enforced by RTDB security rules).

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, LockKeyhole, MessageCircle, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import EmbeddedLink from "@/components/ui/EmbeddedLink";
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
          Selamat datang di <b>Forum Diskusi Berbasis Studi Kasus</b>. Kamu akan
          menerapkan konsep laju reaksi untuk mengkaji persoalan keselamatan industri
          dan dampak sosial-ekonominya.
        </p>
        <ul className="space-y-1">
          <li>
            • Merumuskan pertanyaan dan hipotesismu sendiri.
          </li>
          <li>
            • Memilih bukti ilmiah serta sosial-ekonomi, atau menambahkan sumbermu sendiri.
          </li>
          <li>
            • Menguji hipotesis, membandingkan dua sudut pandang teman, dan menyusun
            keputusan berbasis bukti.
          </li>
        </ul>
        <p>
          Argumen teman baru terlihat setelah argumen awalmu berhasil disimpan. Setiap
          kasus selesai saat keputusanmu tersimpan; setelah seluruh kasus selesai, kamu
          dapat membaca kesimpulan guru.
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
          Mulai Studi Kasus
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
          <div className="mt-3">
            <EmbeddedLink
              url={c.articleUrl}
              title={`Artikel studi kasus ${i + 1}: ${c.title}`}
            />
          </div>
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

// ---------- Unified case flow: article → CER → forum → decision ----------

interface UnifiedCaseDraft {
  read?: boolean;
  claim?: string;
  evidence?: string;
  reasoning?: string;
  decision?: string;
  decisionSubmittedAt?: number;
}

interface DiscussionCaseProgress {
  cerSubmittedAt?: number;
  lastCommentAt?: number;
  decisionAt?: number;
}

export function M6Cases({ sec, readOnly }: SectionProps) {
  const {
    classId,
    uid,
    moduleId,
    studentName,
    drafts,
    updateDraft,
    completeSection,
  } = useEngine();
  const cases = useCases();
  const sectionDraft = drafts[sec.id] ?? {};
  const legacyRead =
    ((drafts.section2?.read as Record<string, boolean> | undefined) ?? {});
  const legacyCer = drafts.section3 ?? {};
  const legacyCommentCounts =
    ((drafts.section4?.myComments as Record<string, number> | undefined) ?? {});
  const legacyDecisions =
    ((drafts.section5?.decisions as Record<string, string> | undefined) ?? {});

  const [myPosts, setMyPosts] = useState<Record<string, ForumPost | null> | null>(null);
  const [discussionProgress, setDiscussionProgress] = useState<
    Record<string, DiscussionCaseProgress>
  >({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [busyCase, setBusyCase] = useState<string | null>(null);
  const [busyComplete, setBusyComplete] = useState(false);

  useEffect(() => {
    if (!cases) return;
    let alive = true;
    void (async () => {
      const [posts, savedProgress] = await Promise.all([
        Promise.all(
          cases.map(async (discussionCase) => [
            discussionCase.id,
            await readOnce<ForumPost>(P.post(classId, discussionCase.id, uid)),
          ] as const)
        ),
        readOnce<Record<string, DiscussionCaseProgress>>(
          P.discussionProgress(classId, uid)
        ),
      ]);
      if (!alive) return;
      setMyPosts(Object.fromEntries(posts));
      setDiscussionProgress(savedProgress ?? {});
    })();
    return () => {
      alive = false;
    };
  }, [cases, classId, uid]);

  useEffect(() => {
    if (!cases || !myPosts) return;
    const unsubs = cases
      .filter((discussionCase) => Boolean(myPosts[discussionCase.id]))
      .map((discussionCase) =>
        listenComments(classId, discussionCase.id, (comments) => {
          setCommentCounts((current) => ({
            ...current,
            [discussionCase.id]: comments.filter(
              (comment) => comment.authorId === uid
            ).length,
          }));
        })
      );
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [cases, classId, uid, myPosts]);

  if (cases === null || myPosts === null) return <Spinner label="Memuat studi kasus…" />;
  if (cases.length === 0)
    return <WaitingTeacher text="Guru belum mempublikasikan studi kasus diskusi." />;

  const getCaseDraft = (discussionCase: CaseItem): UnifiedCaseDraft => {
    const current =
      (sectionDraft[discussionCase.id] as UnifiedCaseDraft | undefined) ?? {};
    const oldCer =
      (legacyCer[discussionCase.id] as Record<string, string> | undefined) ?? {};
    return {
      ...current,
      read:
        current.read ??
        legacyRead[discussionCase.id] ??
        Boolean(myPosts[discussionCase.id]),
      claim: current.claim ?? oldCer.claim ?? myPosts[discussionCase.id]?.claim ?? "",
      evidence:
        current.evidence ?? oldCer.evidence ?? myPosts[discussionCase.id]?.evidence ?? "",
      reasoning:
        current.reasoning ?? oldCer.reasoning ?? myPosts[discussionCase.id]?.reasoning ?? "",
      decision: current.decision ?? legacyDecisions[discussionCase.id] ?? "",
    };
  };

  const patchCase = (
    discussionCase: CaseItem,
    patch: Partial<UnifiedCaseDraft>
  ) => {
    updateDraft(sec.id, {
      [discussionCase.id]: { ...getCaseDraft(discussionCase), ...patch },
    });
  };

  const sendCer = async (discussionCase: CaseItem) => {
    const value = getCaseDraft(discussionCase);
    const post: ForumPost = {
      claim: (value.claim ?? "").trim(),
      evidence: (value.evidence ?? "").trim(),
      reasoning: (value.reasoning ?? "").trim(),
      studentName,
      submittedAt: Date.now(),
    };
    setBusyCase(`cer-${discussionCase.id}`);
    try {
      await submitCER(classId, discussionCase.id, uid, post);
      setMyPosts((current) => ({ ...(current ?? {}), [discussionCase.id]: post }));
    } finally {
      setBusyCase(null);
    }
  };

  const submitDecision = async (discussionCase: CaseItem) => {
    const value = getCaseDraft(discussionCase);
    const submittedAt = Date.now();
    const nextDraft: UnifiedCaseDraft = {
      ...value,
      decision: (value.decision ?? "").trim(),
      decisionSubmittedAt: submittedAt,
    };
    setBusyCase(`decision-${discussionCase.id}`);
    try {
      patchCase(discussionCase, nextDraft);
      await updatePaths({
        [`${P.sectionResponse(classId, uid, moduleId, sec.id)}/${discussionCase.id}`]:
          nextDraft,
        [`${P.discussionProgress(classId, uid)}/${discussionCase.id}/decisionAt`]:
          submittedAt,
      });
      setDiscussionProgress((current) => ({
        ...current,
        [discussionCase.id]: {
          ...(current[discussionCase.id] ?? {}),
          decisionAt: submittedAt,
        },
      }));
    } finally {
      setBusyCase(null);
    }
  };

  const caseCompleted = (discussionCase: CaseItem) =>
    Boolean(
      discussionProgress[discussionCase.id]?.decisionAt ||
        getCaseDraft(discussionCase).decisionSubmittedAt
    );
  const allCompleted = cases.every(caseCompleted);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm leading-relaxed text-brand-900">
        Kerjakan setiap kasus secara terpisah dan berurutan. Dalam satu kasus kamu
        akan membaca artikel, menyusun CER, menanggapi forum, lalu mengambil keputusan.
        Kasus berikutnya terbuka setelah keputusan kasus sebelumnya disimpan.
      </div>

      {cases.map((discussionCase, index) => {
        const previousCompleted =
          index === 0 || caseCompleted(cases[index - 1]);
        const complete = caseCompleted(discussionCase);
        const unlocked = previousCompleted || complete;
        const value = getCaseDraft(discussionCase);
        const post = myPosts[discussionCase.id];
        const commentCount =
          commentCounts[discussionCase.id] ??
          legacyCommentCounts[discussionCase.id] ??
          0;
        const cerValid = CER_FIELDS.every(
          (field) => (value[field.key] ?? "").trim().length >= 10
        );
        // A newly published case remains actionable even when the old module was
        // already completed; finished cases stay immutable.
        const caseReadOnly = readOnly && complete;

        return (
          <article
            key={discussionCase.id}
            className={`overflow-hidden rounded-2xl border-2 ${
              complete
                ? "border-emerald-300 bg-emerald-50/20"
                : unlocked
                  ? "border-brand-300 bg-white"
                  : "border-slate-200 bg-slate-50"
            }`}
          >
            <header
              className={`flex flex-wrap items-center gap-3 px-5 py-4 ${
                complete
                  ? "bg-emerald-600 text-white"
                  : unlocked
                    ? "bg-brand-600 text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-sm font-black">
                {complete ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-80">
                  Kasus {index + 1}
                </p>
                <h3 className="font-black leading-snug">{discussionCase.title}</h3>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                {complete ? "Selesai" : unlocked ? "Sedang dikerjakan" : "Terkunci"}
              </span>
            </header>

            {!unlocked ? (
              <div className="flex items-center gap-2 px-5 py-5 text-sm font-semibold text-slate-500">
                <LockKeyhole className="h-4 w-4" /> Selesaikan decision making Kasus {index}
                terlebih dahulu.
              </div>
            ) : (
              <div className="space-y-5 p-4 sm:p-5">
                <section className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-xs font-black text-brand-700">1</span>
                    <h4 className="text-sm font-black text-slate-800">Baca Artikel & Pertanyaan</h4>
                  </div>
                  {discussionCase.articleNote && (
                    <p className="mb-3 text-sm text-slate-600">{discussionCase.articleNote}</p>
                  )}
                  <EmbeddedLink
                    url={discussionCase.articleUrl}
                    title={`Artikel Kasus ${index + 1}: ${discussionCase.title}`}
                  />
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Pertanyaan Diskusi</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{discussionCase.question}</p>
                  </div>
                  <label className="mt-3 flex items-start gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(value.read)}
                      disabled={caseReadOnly || Boolean(post)}
                      onChange={(event) => patchCase(discussionCase, { read: event.target.checked })}
                      className="mt-0.5 h-4 w-4 accent-brand-600"
                    />
                    Saya sudah membaca artikel dan memahami pertanyaannya
                  </label>
                </section>

                {value.read && (
                  <section className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-xs font-black text-brand-700">2</span>
                      <h4 className="text-sm font-black text-slate-800">Susun Pendapat CER</h4>
                    </div>
                    {post ? (
                      <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                        <p className="font-bold text-emerald-800">✓ CER sudah dikirim</p>
                        <p><b>Claim:</b> {post.claim}</p>
                        <p><b>Evidence:</b> {post.evidence}</p>
                        <p><b>Reasoning:</b> {post.reasoning}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {CER_FIELDS.map((field) => (
                          <div key={field.key}>
                            <Label>{field.label}</Label>
                            <Textarea
                              rows={2}
                              disabled={caseReadOnly}
                              value={value[field.key] ?? ""}
                              onChange={(event) =>
                                patchCase(discussionCase, { [field.key]: event.target.value })
                              }
                              placeholder={field.ph}
                            />
                          </div>
                        ))}
                        {!caseReadOnly && (
                          <Button
                            size="sm"
                            disabled={!cerValid}
                            loading={busyCase === `cer-${discussionCase.id}`}
                            onClick={() => void sendCer(discussionCase)}
                          >
                            <Send className="h-4 w-4" /> Kirim CER
                          </Button>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {post && (
                  <section className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-xs font-black text-brand-700">3</span>
                        <h4 className="text-sm font-black text-slate-800">Tanggapi Forum</h4>
                      </div>
                      <Badge tone={commentCount >= 1 ? "green" : "amber"}>
                        {commentCount >= 1 ? "Syarat terpenuhi" : "Minimal 1 tanggapan"}
                      </Badge>
                    </div>
                    <CaseForum
                      c={discussionCase}
                      index={index}
                      readOnly={caseReadOnly}
                      onMyComments={(caseId, count) =>
                        setCommentCounts((current) => ({ ...current, [caseId]: count }))
                      }
                    />
                  </section>
                )}

                {post && commentCount >= 1 && (
                  <section className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-xs font-black text-brand-700">4</span>
                      <h4 className="text-sm font-black text-slate-800">Decision Making</h4>
                    </div>
                    <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                      {discussionCase.decisionPrompt}
                    </p>
                    <Textarea
                      className="mt-3"
                      rows={3}
                      disabled={complete}
                      value={value.decision ?? ""}
                      onChange={(event) =>
                        patchCase(discussionCase, { decision: event.target.value })
                      }
                      placeholder="Keputusan saya beserta pertimbangan ilmiahnya…"
                    />
                    {complete ? (
                      <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                        ✓ Kasus {index + 1} selesai. Keputusanmu sudah tersimpan.
                      </p>
                    ) : (
                      <Button
                        className="mt-3"
                        disabled={(value.decision ?? "").trim().length < 15}
                        loading={busyCase === `decision-${discussionCase.id}`}
                        onClick={() => void submitDecision(discussionCase)}
                      >
                        Simpan Keputusan &amp; Selesaikan Kasus {index + 1}
                      </Button>
                    )}
                  </section>
                )}
              </div>
            )}
          </article>
        );
      })}

      {!readOnly && (
        <Button
          disabled={!allCompleted}
          loading={busyComplete}
          onClick={async () => {
            setBusyComplete(true);
            try {
              await completeSection(sec.id);
            } finally {
              setBusyComplete(false);
            }
          }}
        >
          Lanjut ke Kesimpulan Guru
        </Button>
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
              Selesaikan Modul 5
            </Button>
          )}
        </>
      )}
    </div>
  );
}
