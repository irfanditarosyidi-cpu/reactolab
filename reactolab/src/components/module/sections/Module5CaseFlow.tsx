"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  LockKeyhole,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Button from "@/components/ui/Button";
import { Help, Input, Label, Select, Textarea } from "@/components/ui/forms";
import { Avatar, Badge, Spinner } from "@/components/ui/misc";
import {
  listenArgumentAttempts,
  listenArguments,
  listenComments,
  listenPeerReviewAttempts,
  listenPeerReviews,
  listenPosts,
  listenPublishedCases,
  readOnce,
  submitForumArgument,
  submitForumArgumentAttempt,
  submitPeerReview,
  submitPeerReviewAttempt,
  updatePaths,
} from "@/lib/db";
import {
  caseCompleted,
  conclusionComplete,
  distinctPeerReviewCount,
  discussionScaffoldHint,
  discussionScaffoldWarnings,
  discussionAttemptMatches,
  evidenceComplete,
  forumPostBody,
  forumPostLabel,
  hasText,
  hypothesisComplete,
  hypothesisDraftText,
  hypothesisResponseText,
  LEGACY_DISCUSSION_ATTEMPT_ID,
  mergePublishedCasePlan,
  narrativeParagraphs,
  normalizedCase,
  peerReviewComplete,
  problemComplete,
  problemQuestionFromParts,
  problemValidationIssues,
  REQUIRED_PEER_REVIEWS,
} from "@/lib/discussion";
import ScientificText from "@/components/ui/ScientificText";
import BibliographyList from "@/components/ui/BibliographyList";
import { P } from "@/lib/paths";
import { formatRelative } from "@/lib/utils";
import type {
  DiscussionCase,
  DiscussionEvidence,
  DiscussionScaffoldStage,
  ForumArgument,
  ForumComment,
  ForumPeerReview,
  ForumPost,
  Module5CaseResponse,
  StudentOwnEvidence,
} from "@/lib/types";
import { useEngine } from "../engine";
import type { SectionProps } from "./InquirySections";

type CaseItem = DiscussionCase & { id: string };
type ForumEntry = (ForumArgument | ForumPost) & {
  uid: string;
  attemptId?: string;
};

interface DiscussionCaseProgress {
  attemptId?: string;
  argumentSubmittedAt?: number;
  cerSubmittedAt?: number;
  decisionAt?: number;
}

interface DiscussionScaffoldNotice {
  warnings: string[];
  hint: string;
}

const DISCUSSION_STAGE_REFLECTION: Record<DiscussionScaffoldStage, string> = {
  problem:
    "Periksa kembali apakah faktor kimia, risiko atau dampak, dan perspektif lain sudah spesifik serta benar-benar merujuk pada kasus.",
  hypothesis:
    "Periksa kembali apakah dugaan awal sudah menjawab rumusan masalah dan disertai alasan yang dapat ditelusuri.",
  evidence:
    "Periksa kembali apakah bukti ilmiah dan sosial-ekonomi yang dipilih mempunyai fungsi yang jelas dalam menjawab rumusan masalah.",
  testing:
    "Periksa kembali apakah keputusan terhadap hipotesis sudah dihubungkan dengan data, bukti, atau temuan yang dipilih.",
  conclusion:
    "Periksa kembali apakah kesimpulan menjawab masalah, memakai dasar bukti, dan mempertimbangkan dampak solusi bagi pihak terkait.",
};

function CaseScaffoldWarning({
  notice,
  onContinue,
  loading = false,
}: {
  notice: DiscussionScaffoldNotice | undefined;
  onContinue: () => void;
  loading?: boolean;
}) {
  if (!notice) return null;
  return (
    <div
      role="status"
      className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <p className="flex items-center gap-2 font-bold">
        <TriangleAlert className="h-4 w-4 shrink-0" /> Umpan balik scaffolding
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
        {notice.warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
      <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-xs leading-relaxed">
        <b>Petunjuk:</b> {notice.hint}
      </p>
      <div className="mt-3 flex flex-col gap-2 border-t border-amber-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-amber-800">
          Kamu boleh memperbaiki jawaban atau tetap melanjutkan.
        </p>
        <Button
          size="sm"
          variant="secondary"
          loading={loading}
          className="shrink-0"
          onClick={onContinue}
        >
          Tetap lanjutkan
        </Button>
      </div>
    </div>
  );
}

function waitCard(text: string) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
      <div className="text-2xl">⏳</div>
      <p className="mt-2 text-sm font-bold text-amber-900">Menunggu Guru</p>
      <p className="mt-1 text-sm text-amber-800">{text}</p>
    </div>
  );
}

function newResponse(
  discussionCase: CaseItem,
  order: number,
  attemptId: string
): Module5CaseResponse {
  return {
    schemaVersion: 2,
    attemptId,
    caseSnapshot: normalizedCase(discussionCase),
    caseOrder: order,
    startedAt: Date.now(),
  };
}

function selectedEvidenceSummary(
  discussionCase: DiscussionCase,
  response: Module5CaseResponse
): string {
  const evidence = response.evidence;
  const scientific = new Set(evidence?.selectedScientificIds ?? []);
  const socioeconomic = new Set(evidence?.selectedSocioeconomicIds ?? []);
  return [
    ...(discussionCase.scientificEvidence ?? [])
      .filter((item) => scientific.has(item.id))
      .map((item) => item.title),
    ...(discussionCase.socioeconomicEvidence ?? [])
      .filter((item) => socioeconomic.has(item.id))
      .map((item) => item.title),
    ...(evidence?.ownEvidence ?? []).map((item) => `Bukti sendiri: ${item.content}`),
  ].join("; ");
}

function EvidenceChart({ evidence }: { evidence: DiscussionEvidence }) {
  if (!evidence.chartPoints?.length) return null;
  const units = Array.from(
    new Set(
      evidence.chartPoints
        .map((point) => point.unit?.trim())
        .filter((unit): unit is string => Boolean(unit))
    )
  );
  const sharedUnit = units.length === 1 ? units[0] : "";
  const xAxisTitle = evidence.chartXAxisTitle?.trim() || "Kategori data";
  const yAxisTitle =
    evidence.chartYAxisTitle?.trim() ||
    (sharedUnit ? `Nilai (${sharedUnit})` : "Nilai");
  const chartTitle = evidence.chartTitle?.trim() || "Visualisasi data";

  return (
    <div className="mt-3 min-w-0 rounded-lg border border-slate-200 bg-white p-2.5 sm:p-3">
      <p className="px-2 text-center text-xs font-bold leading-snug text-slate-700">
        {chartTitle}
      </p>
      <div
        className="mt-2 h-64 min-w-0 sm:h-80"
        role="img"
        aria-label={`${chartTitle}. Sumbu X: ${xAxisTitle}. Sumbu Y: ${yAxisTitle}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={evidence.chartPoints}
            margin={{ top: 10, right: 2, bottom: 0, left: 0 }}
            barCategoryGap="28%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              interval={0}
              height={38}
              tick={{ fontSize: 9, fill: "#64748b" }}
              tickMargin={4}
              tickLine={{ stroke: "#94a3b8" }}
              axisLine={{ stroke: "#64748b" }}
              label={{
                value: xAxisTitle,
                position: "insideBottom",
                offset: 3,
                fontSize: 10,
                fontWeight: 700,
                fill: "#334155",
              }}
            />
            <YAxis
              width={54}
              tick={{ fontSize: 9, fill: "#64748b" }}
              tickMargin={3}
              tickLine={{ stroke: "#94a3b8" }}
              axisLine={{ stroke: "#64748b" }}
              label={{
                value: yAxisTitle,
                angle: -90,
                position: "insideLeft",
                offset: 7,
                fontSize: 10,
                fontWeight: 700,
                fill: "#334155",
                style: { textAnchor: "middle" },
              }}
            />
            <Tooltip
              cursor={{ fill: "#eff6ff" }}
              labelFormatter={(label) => `${xAxisTitle}: ${label}`}
              formatter={(value) => [
                `${String(value)}${sharedUnit ? ` ${sharedUnit}` : ""}`,
                yAxisTitle,
              ]}
            />
            <Bar
              dataKey="value"
              name={yAxisTitle}
              fill="#2563eb"
              maxBarSize={64}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] text-slate-500">
        Grafik mengikuti data yang dimasukkan guru dan bukan penilaian otomatis.
      </p>
    </div>
  );
}

function EvidenceOption({
  item,
  checked,
  disabled,
  onChange,
}: {
  item: DiscussionEvidence;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="block rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-brand-600"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800">{item.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.content}</p>
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              {item.sourceLabel ?? "Buka sumber"}
            </a>
          )}
        </div>
      </div>
      <EvidenceChart evidence={item} />
    </label>
  );
}

function OwnEvidenceEditor({
  values,
  disabled,
  onChange,
}: {
  values: StudentOwnEvidence[];
  disabled: boolean;
  onChange: (values: StudentOwnEvidence[]) => void;
}) {
  const add = () =>
    onChange([
      ...values,
      {
        id: `own-${Date.now()}`,
        category: "scientific",
        content: "",
        source: "",
        selectionReason: "",
      },
    ]);
  const patch = (id: string, value: Partial<StudentOwnEvidence>) =>
    onChange(values.map((item) => (item.id === id ? { ...item, ...value } : item)));

  return (
    <div className="space-y-3">
      {values.map((item, index) => (
        <div key={item.id} className="rounded-xl border border-dashed border-slate-300 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Bukti sendiri {index + 1}
            </p>
            {!disabled && (
              <button
                type="button"
                className="text-red-500 hover:text-red-700"
                aria-label="Hapus bukti sendiri"
                onClick={() => onChange(values.filter((value) => value.id !== item.id))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Kategori</Label>
              <Select
                disabled={disabled}
                value={item.category}
                onChange={(event) =>
                  patch(item.id, {
                    category: event.target.value as StudentOwnEvidence["category"],
                  })
                }
              >
                <option value="scientific">Ilmiah</option>
                <option value="socioeconomic">Sosial-ekonomi</option>
              </Select>
            </div>
            <div>
              <Label>Asal/sumber bukti</Label>
              <Input
                disabled={disabled}
                value={item.source}
                onChange={(event) => patch(item.id, { source: event.target.value })}
                placeholder="Judul, penulis, URL, observasi, atau asal lain"
              />
            </div>
          </div>
          <div className="mt-3">
            <Label>Isi bukti</Label>
            <Textarea
              rows={2}
              disabled={disabled}
              value={item.content}
              onChange={(event) => patch(item.id, { content: event.target.value })}
              placeholder="Catat data atau informasi konkret yang kamu temukan"
            />
          </div>
          <div className="mt-3">
            <Label>Alasan memilih bukti ini</Label>
            <Textarea
              rows={2}
              disabled={disabled}
              value={item.selectionReason}
              onChange={(event) => patch(item.id, { selectionReason: event.target.value })}
              placeholder="Jelaskan mengapa bukti ini penting atau menarik. Belum perlu menilai hipotesis."
            />
          </div>
        </div>
      ))}
      {!disabled && (
        <Button size="sm" variant="secondary" onClick={add}>
          <Plus className="h-4 w-4" /> Tambah Bukti Sendiri
        </Button>
      )}
    </div>
  );
}

function ForumStage({
  classId,
  uid,
  discussionCase,
  response,
  attemptId,
  ownSubmitted,
  reviewerName,
  disabled,
  onResponse,
}: {
  classId: string;
  uid: string;
  discussionCase: CaseItem;
  response: Module5CaseResponse;
  attemptId: string;
  ownSubmitted: boolean;
  reviewerName: string;
  disabled: boolean;
  onResponse: (next: Module5CaseResponse) => void;
}) {
  const [argumentsList, setArgumentsList] = useState<Array<ForumArgument & { uid: string }>>(
    []
  );
  const [attemptArguments, setAttemptArguments] = useState<
    Array<ForumArgument & { uid: string; attemptId: string }>
  >([]);
  const [legacyPosts, setLegacyPosts] = useState<Array<ForumPost & { uid: string }>>([]);
  const [legacyComments, setLegacyComments] = useState<ForumComment[]>([]);
  const [reviews, setReviews] = useState<Record<string, ForumPeerReview>>(
    response.peerReviews ?? {}
  );
  const [drafts, setDrafts] = useState<
    Record<string, { differenceReason: string; response: string }>
  >(
    Object.fromEntries(
      Object.entries(response.peerReviewDrafts ?? {}).map(([key, value]) => [
        key,
        {
          differenceReason: value.differenceReason ?? "",
          response: value.response ?? "",
        },
      ])
    )
  );
  const [busyTarget, setBusyTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!ownSubmitted) return;
    const stopArguments = listenArguments(classId, discussionCase.id, setArgumentsList);
    const stopAttemptArguments = listenArgumentAttempts(
      classId,
      discussionCase.id,
      setAttemptArguments,
      () => setAttemptArguments([])
    );
    const stopLegacy = listenPosts(classId, discussionCase.id, setLegacyPosts);
    const stopLegacyComments = listenComments(
      classId,
      discussionCase.id,
      setLegacyComments
    );
    const onReviews = (value: Record<string, ForumPeerReview>) => {
      setReviews(value);
      onResponse({ ...response, peerReviews: value });
    };
    const stopReviews =
      attemptId === LEGACY_DISCUSSION_ATTEMPT_ID
        ? listenPeerReviews(classId, discussionCase.id, uid, onReviews)
        : listenPeerReviewAttempts(
            classId,
            discussionCase.id,
            uid,
            attemptId,
            onReviews
          );
    return () => {
      stopArguments();
      stopAttemptArguments();
      stopLegacy();
      stopLegacyComments();
      stopReviews();
    };
    // Response changes are persisted by the listener callback; resubscribing is unnecessary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, classId, discussionCase.id, ownSubmitted, uid]);

  const entries = useMemo<ForumEntry[]>(() => {
    const candidates = [
      ...legacyPosts,
      ...argumentsList,
      ...attemptArguments,
    ] as ForumEntry[];
    const byUid = new Map<string, ForumEntry>();
    for (const entry of candidates) {
      const savedReview = reviews[entry.uid];
      const isReviewedVersion = savedReview
        ? savedReview.targetAttemptId
          ? entry.attemptId === savedReview.targetAttemptId
          : !entry.attemptId
        : false;
      const previous = byUid.get(entry.uid);
      const previousIsReviewedVersion = previous
        ? savedReview?.targetAttemptId
          ? previous.attemptId === savedReview.targetAttemptId
          : Boolean(savedReview && !previous.attemptId)
        : false;
      if (
        !previous ||
        (isReviewedVersion && !previousIsReviewedVersion) ||
        (isReviewedVersion === previousIsReviewedVersion &&
          entry.submittedAt > previous.submittedAt)
      ) {
        byUid.set(entry.uid, entry);
      }
    }
    return Array.from(byUid.values()).sort((a, b) => a.submittedAt - b.submittedAt);
  }, [argumentsList, attemptArguments, legacyPosts, reviews]);
  const peers = entries.filter((entry) => entry.uid !== uid);
  const count = distinctPeerReviewCount(reviews);

  const saveReviewDraft = (
    targetId: string,
    value: { differenceReason: string; response: string }
  ) => {
    const nextDrafts = { ...drafts, [targetId]: value };
    setDrafts(nextDrafts);
    onResponse({
      ...response,
      peerReviews: reviews,
      peerReviewDrafts: nextDrafts,
    });
  };

  const sendReview = async (entry: ForumEntry) => {
    const draft = drafts[entry.uid];
    if (!hasText(draft?.differenceReason) || !hasText(draft?.response)) return;
    const review: ForumPeerReview = {
      reviewerId: uid,
      reviewerName,
      ...(attemptId === LEGACY_DISCUSSION_ATTEMPT_ID ? {} : { attemptId }),
      targetStudentId: entry.uid,
      targetName: entry.studentName,
      ...(entry.attemptId ? { targetAttemptId: entry.attemptId } : {}),
      differenceReason: draft.differenceReason.trim(),
      response: draft.response.trim(),
      createdAt: Date.now(),
    };
    setBusyTarget(entry.uid);
    try {
      if (attemptId === LEGACY_DISCUSSION_ATTEMPT_ID) {
        await submitPeerReview(classId, discussionCase.id, review);
      } else {
        await submitPeerReviewAttempt(
          classId,
          discussionCase.id,
          attemptId,
          review
        );
      }
      const nextReviews = { ...reviews, [entry.uid]: review };
      setReviews(nextReviews);
      onResponse({ ...response, peerReviews: nextReviews });
    } finally {
      setBusyTarget(null);
    }
  };

  if (!ownSubmitted) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black text-slate-800">Forum terbuka</p>
          <p className="text-xs text-slate-500">
            Pilih dua argumen dari dua teman berbeda. Jelaskan perbedaan sudut
            pandang dan beri tanggapan beralasan pada masing-masing.
          </p>
        </div>
        <Badge tone={count >= REQUIRED_PEER_REVIEWS ? "green" : "amber"}>
          {count}/{REQUIRED_PEER_REVIEWS} penulis berbeda
        </Badge>
      </div>

      {peers.length < REQUIRED_PEER_REVIEWS && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Baru tersedia {peers.length} argumen teman. Syarat dua penulis tidak
          dikurangi otomatis; tunggu teman lain mengirim argumen
          {discussionCase.allowPeerReviewException
            ? " atau gunakan pengecualian yang telah dicatat guru di bawah."
            : "."}
        </div>
      )}

      <div className="space-y-3">
        {peers.map((entry) => {
          const saved = reviews[entry.uid];
          const oldComments = legacyComments.filter(
            (comment) => comment.targetStudentId === entry.uid
          );
          const draft = drafts[entry.uid] ?? { differenceReason: "", response: "" };
          return (
            <div key={entry.uid} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <Avatar name={entry.studentName} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">{entry.studentName}</p>
                  <p className="text-[11px] text-slate-400">
                    {forumPostLabel(entry)} · {formatRelative(entry.submittedAt)}
                  </p>
                </div>
                {saved && <Badge tone="green">Ditanggapi</Badge>}
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                {forumPostBody(entry)}
              </p>
              {oldComments.length > 0 && (
                <div className="mt-2 rounded-lg border border-sky-100 bg-sky-50 p-3">
                  <p className="text-[11px] font-black uppercase tracking-wide text-sky-700">
                    Riwayat tanggapan format lama
                  </p>
                  {oldComments.map((comment) => (
                    <p key={comment.id} className="mt-1 text-xs text-sky-900">
                      <b>{comment.authorName}:</b> {comment.text}
                    </p>
                  ))}
                </div>
              )}
              {saved ? (
                <div className="mt-3 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <p>
                    <b>Perbedaan sudut pandang:</b> {saved.differenceReason}
                  </p>
                  <p>
                    <b>Tanggapanmu:</b> {saved.response}
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div>
                    <Label>Apa perbedaan sudut pandangnya?</Label>
                    <Textarea
                      rows={2}
                      disabled={disabled}
                      value={draft.differenceReason}
                      onChange={(event) =>
                        saveReviewDraft(entry.uid, {
                          ...draft,
                          differenceReason: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Tanggapan beralasan</Label>
                    <Textarea
                      rows={2}
                      disabled={disabled}
                      value={draft.response}
                      onChange={(event) =>
                        saveReviewDraft(entry.uid, {
                          ...draft,
                          response: event.target.value,
                        })
                      }
                    />
                  </div>
                  {!disabled && (
                    <Button
                      size="sm"
                      loading={busyTarget === entry.uid}
                      disabled={!hasText(draft.differenceReason) || !hasText(draft.response)}
                      onClick={() => void sendReview(entry)}
                    >
                      <MessageCircle className="h-4 w-4" /> Simpan Tanggapan
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {legacyComments.some((comment) => !comment.targetStudentId) && (
        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-sky-700">
            Riwayat tanggapan umum format lama
          </p>
          {legacyComments
            .filter((comment) => !comment.targetStudentId)
            .map((comment) => (
              <p key={comment.id} className="mt-1 text-xs text-sky-900">
                <b>{comment.authorName}:</b> {comment.text}
              </p>
            ))}
        </div>
      )}

      {discussionCase.allowPeerReviewException && count < REQUIRED_PEER_REVIEWS && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-sm font-bold text-sky-900">Pengecualian eksplisit dari guru</p>
          <p className="mt-1 text-sm text-sky-800">
            {discussionCase.peerReviewExceptionNote}
          </p>
          {response.peerExceptionUsedAt ? (
            <p className="mt-2 text-xs font-bold text-sky-700">Pengecualian telah dicatat.</p>
          ) : (
            !disabled && (
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                onClick={() =>
                  onResponse({
                    ...response,
                    peerExceptionUsedAt: Date.now(),
                    peerExceptionNote: discussionCase.peerReviewExceptionNote,
                  })
                }
              >
                Gunakan Pengecualian Guru
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function Module5CaseFlow({ sec, readOnly }: SectionProps) {
  const {
    classId,
    uid,
    moduleId,
    modProgress,
    studentName,
    drafts,
    scaffoldingEnabled,
    updateDraft,
    completeSection,
  } = useEngine();
  const attemptId =
    modProgress.attemptId ?? LEGACY_DISCUSSION_ATTEMPT_ID;
  const sectionDraft = useMemo(() => drafts[sec.id] ?? {}, [drafts, sec.id]);
  const [publishedCases, setPublishedCases] = useState<CaseItem[] | null>(null);
  const [myArguments, setMyArguments] = useState<Record<string, ForumArgument | null>>({});
  const [myLegacyPosts, setMyLegacyPosts] = useState<Record<string, ForumPost | null>>({});
  const [discussionProgress, setDiscussionProgress] = useState<
    Record<string, DiscussionCaseProgress>
  >({});
  const [loadedOwnPosts, setLoadedOwnPosts] = useState(false);
  const [busyCase, setBusyCase] = useState<string | null>(null);
  const [busyComplete, setBusyComplete] = useState(false);
  const [evidenceTabs, setEvidenceTabs] = useState<
    Record<string, "scientific" | "socioeconomic">
  >({});
  const [scaffoldAttempts, setScaffoldAttempts] = useState<Record<string, number>>(
    {}
  );
  const [scaffoldNotices, setScaffoldNotices] = useState<
    Record<string, DiscussionScaffoldNotice>
  >({});

  const scaffoldKey = (caseId: string, stage: DiscussionScaffoldStage) =>
    `${caseId}:${stage}`;

  const clearScaffoldNotice = (
    caseId: string,
    stage: DiscussionScaffoldStage
  ) => {
    const key = scaffoldKey(caseId, stage);
    setScaffoldNotices((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const scaffoldAllowsImmediateContinue = (
    discussionCase: DiscussionCase,
    response: Module5CaseResponse,
    stage: DiscussionScaffoldStage
  ): boolean => {
    const caseId = discussionCase.id ?? "case";
    const key = scaffoldKey(caseId, stage);
    if (!scaffoldingEnabled) {
      clearScaffoldNotice(caseId, stage);
      return true;
    }
    const warnings = discussionScaffoldWarnings(stage, response);
    const attempt = (scaffoldAttempts[key] ?? 0) + 1;
    setScaffoldAttempts((current) => ({ ...current, [key]: attempt }));
    setScaffoldNotices((current) => ({
      ...current,
      [key]: {
        warnings:
          warnings.length > 0
            ? warnings
            : [DISCUSSION_STAGE_REFLECTION[stage]],
        hint: discussionScaffoldHint(discussionCase, stage, attempt),
      },
    }));
    return false;
  };

  useEffect(
    () => listenPublishedCases(classId, setPublishedCases),
    [classId]
  );

  const savedResponses = useMemo(() => {
    const result: Record<string, Module5CaseResponse> = {};
    for (const [key, value] of Object.entries(sectionDraft)) {
      if (
        key !== "casePlan" &&
        value &&
        typeof value === "object" &&
        (value as Module5CaseResponse).caseSnapshot
      ) {
        result[key] = value as Module5CaseResponse;
      }
    }
    return result;
  }, [sectionDraft]);

  const cases = useMemo<CaseItem[]>(() => {
    if (!publishedCases) return [];
    const current = new Map(publishedCases.map((item) => [item.id, item]));
    const legacyCaseIds = Array.from(
      new Set([
        ...Object.keys(sectionDraft).filter(
          (key) => key !== "casePlan" && typeof sectionDraft[key] === "object"
        ),
        ...Object.keys(drafts.section3 ?? {}),
        ...Object.keys(
          (drafts.section5?.decisions as Record<string, string> | undefined) ?? {}
        ),
      ])
    );
    const plan = Array.isArray(sectionDraft.casePlan)
      ? (sectionDraft.casePlan as string[])
      : readOnly
        ? legacyCaseIds
        : [
            ...Object.keys(savedResponses),
            ...publishedCases.map((item) => item.id).filter((id) => !savedResponses[id]),
          ];
    return plan
      .map((id) => {
        const live = current.get(id);
        if (live) return live;
        const snapshot = savedResponses[id]?.caseSnapshot;
        return snapshot ? ({ ...snapshot, id } as CaseItem) : null;
      })
      .filter((item): item is CaseItem => Boolean(item));
  }, [drafts.section3, drafts.section5, publishedCases, readOnly, savedResponses, sectionDraft]);

  useEffect(() => {
    if (!publishedCases || publishedCases.length === 0) return;
    if (Array.isArray(sectionDraft.casePlan)) {
      const currentPlan = sectionDraft.casePlan as string[];
      const added = publishedCases.filter((item) => !currentPlan.includes(item.id));
      if (!added.length) return;
      const patch: Record<string, unknown> = {
        casePlan: mergePublishedCasePlan(
          currentPlan,
          publishedCases.map((item) => item.id)
        ),
      };
      added.forEach((item, offset) => {
        patch[item.id] = newResponse(
          item,
          currentPlan.length + offset + 1,
          attemptId
        );
      });
      updateDraft(sec.id, patch);
      return;
    }
    const initial: Record<string, unknown> = { casePlan: cases.map((item) => item.id) };
    cases.forEach((item, index) => {
      if (!savedResponses[item.id]) {
        initial[item.id] = newResponse(item, index + 1, attemptId);
      }
    });
    updateDraft(sec.id, initial);
  }, [
    cases,
    attemptId,
    publishedCases,
    readOnly,
    savedResponses,
    sec.id,
    sectionDraft.casePlan,
    updateDraft,
  ]);

  useEffect(() => {
    if (!publishedCases) return;
    let active = true;
    void (async () => {
      const [argumentsPairs, legacyPairs, progress] = await Promise.all([
        Promise.all(
          cases.map(async (item) => {
            const path =
              attemptId === LEGACY_DISCUSSION_ATTEMPT_ID
                ? P.argument(classId, item.id, uid)
                : P.argumentAttempt(classId, item.id, uid, attemptId);
            return [item.id, await readOnce<ForumArgument>(path)] as const;
          })
        ),
        Promise.all(
          cases.map(async (item) => [
            item.id,
            attemptId === LEGACY_DISCUSSION_ATTEMPT_ID
              ? await readOnce<ForumPost>(P.post(classId, item.id, uid))
              : null,
          ] as const)
        ),
        readOnce<Record<string, DiscussionCaseProgress>>(
          P.discussionProgress(classId, uid)
        ),
      ]);
      if (!active) return;
      setMyArguments(Object.fromEntries(argumentsPairs));
      setMyLegacyPosts(Object.fromEntries(legacyPairs));
      setDiscussionProgress(progress ?? {});
      setLoadedOwnPosts(true);
    })();
    return () => {
      active = false;
    };
  }, [attemptId, cases, classId, publishedCases, uid]);

  if (publishedCases === null || !loadedOwnPosts)
    return <Spinner label="Memuat studi kasus Modul 5…" />;
  if (cases.length === 0)
    return waitCard("Guru belum mempublikasikan studi kasus Modul 5.");

  const legacyRead =
    (drafts.section2?.read as Record<string, boolean> | undefined) ?? {};
  const legacyCer = drafts.section3 ?? {};
  const legacyDecisions =
    (drafts.section5?.decisions as Record<string, string> | undefined) ?? {};

  const responseFor = (discussionCase: CaseItem, index: number): Module5CaseResponse => {
    const saved = savedResponses[discussionCase.id];
    if (saved && discussionAttemptMatches(saved.attemptId, attemptId)) {
      return saved;
    }
    const raw = (sectionDraft[discussionCase.id] as Record<string, unknown> | undefined) ?? {};
    const oldCer =
      (legacyCer[discussionCase.id] as Record<string, string> | undefined) ?? {};
    const legacyDecision =
      (raw.decision as string | undefined) ?? legacyDecisions[discussionCase.id];
    const started = newResponse(discussionCase, index + 1, attemptId);
    const oldPost =
      attemptId === LEGACY_DISCUSSION_ATTEMPT_ID
        ? myLegacyPosts[discussionCase.id]
        : null;
    const legacySubmittedAt = oldPost?.submittedAt;
    const scientificId = discussionCase.scientificEvidence?.[0]?.id;
    const socioeconomicId = discussionCase.socioeconomicEvidence?.[0]?.id;
    return {
      ...started,
      orientation:
        raw.read || legacyRead[discussionCase.id] || oldPost
          ? { completedAt: Date.now() }
          : undefined,
      problem: oldPost
        ? {
            chemicalFactor: "Komponen ilmiah pada respons CER historis",
            impactRisk: discussionCase.phenomenonQuestion ?? discussionCase.question,
            stakeholderConsideration: "Pertimbangan pada respons CER historis",
            question: discussionCase.question,
            completedAt: legacySubmittedAt,
          }
        : undefined,
      hypothesis: oldPost
        ? {
            position: oldPost.claim ?? oldCer.claim ?? "Respons CER historis",
            reason: oldPost.reasoning ?? oldCer.reasoning ?? "Respons CER historis",
            completedAt: legacySubmittedAt,
          }
        : undefined,
      evidence: oldPost
        ? {
            selectedScientificIds: scientificId ? [scientificId] : [],
            selectedSocioeconomicIds: socioeconomicId ? [socioeconomicId] : [],
            ownEvidence:
              scientificId && socioeconomicId
                ? []
                : [
                    {
                      id: "legacy-scientific",
                      category: "scientific",
                      content: oldPost.evidence ?? oldCer.evidence ?? "Bukti CER historis",
                      source: "Post CER historis siswa",
                      selectionReason:
                        oldPost.reasoning ?? oldCer.reasoning ?? "Alasan CER historis",
                    },
                    {
                      id: "legacy-socioeconomic",
                      category: "socioeconomic",
                      content: oldPost.evidence ?? oldCer.evidence ?? "Bukti CER historis",
                      source: "Post CER historis siswa",
                      selectionReason:
                        oldPost.reasoning ?? oldCer.reasoning ?? "Alasan CER historis",
                    },
                  ],
            selectionReason:
              oldPost.evidence ?? oldCer.evidence ?? "Pilihan bukti CER historis",
            completedAt: legacySubmittedAt,
          }
        : undefined,
      claim: (raw.claim as string | undefined) ?? oldCer.claim ?? oldPost?.claim,
      evidenceText:
        (raw.evidence as string | undefined) ?? oldCer.evidence ?? oldPost?.evidence,
      reasoning:
        (raw.reasoning as string | undefined) ?? oldCer.reasoning ?? oldPost?.reasoning,
      decision: legacyDecision,
      decisionSubmittedAt:
        (raw.decisionSubmittedAt as number | undefined) ??
        discussionProgress[discussionCase.id]?.decisionAt,
      conclusion:
        legacyDecision &&
        ((raw.decisionSubmittedAt as number | undefined) ||
          discussionProgress[discussionCase.id]?.decisionAt)
          ? {
              problemAnswer: legacyDecision,
              policySolution: legacyDecision,
              evidenceBasis:
                (raw.reasoning as string | undefined) ?? oldCer.reasoning ?? "Respons historis CER",
              submittedAt:
                (raw.decisionSubmittedAt as number | undefined) ??
                discussionProgress[discussionCase.id]?.decisionAt,
            }
          : undefined,
    };
  };

  const saveResponse = (discussionCase: CaseItem, response: Module5CaseResponse) => {
    updateDraft(sec.id, { [discussionCase.id]: response });
  };

  const allCompleted = cases.every((item, index) =>
    caseCompleted(responseFor(item, index))
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm leading-relaxed text-brand-900">
        Setiap kasus mengikuti enam tahap: orientasi, merumuskan masalah,
        merumuskan hipotesis, mengumpulkan data, menguji hipotesis dan
        berdiskusi, lalu menyimpulkan. Isian tersimpan otomatis.{" "}
        {scaffoldingEnabled
          ? "Scaffolding memberi peringatan dan petunjuk tanpa menghalangi kamu melanjutkan; ketepatan ilmiah tetap dapat ditinjau guru."
          : "Scaffolding sedang dinonaktifkan guru; sistem hanya memeriksa kelengkapan minimum."}
      </div>

      {cases.map((rawCase, index) => {
        const discussionCase = normalizedCase(rawCase) as CaseItem;
        const response = responseFor(rawCase, index);
        const previousComplete =
          index === 0 || caseCompleted(responseFor(cases[index - 1], index - 1));
        const complete = caseCompleted(response);
        const unlocked = previousComplete || complete;
        const ownArgument = myArguments[discussionCase.id];
        const legacyPost =
          attemptId === LEGACY_DISCUSSION_ATTEMPT_ID
            ? myLegacyPosts[discussionCase.id]
            : null;
        const ownSubmitted = Boolean(ownArgument || legacyPost);
        const immutable = ownSubmitted || complete;
        const orientationDone = Boolean(response.orientation?.completedAt);
        const problemDone = Boolean(response.problem?.completedAt && problemComplete(response));
        const hypothesisDone = Boolean(
          response.hypothesis?.completedAt && hypothesisComplete(response)
        );
        const evidenceDone = Boolean(
          response.evidence?.completedAt && evidenceComplete(response)
        );
        const testingDone = ownSubmitted;
        const reviewsDone = peerReviewComplete(response, discussionCase);
        const selectedScientific = new Set(
          response.evidence?.selectedScientificIds ?? []
        );
        const selectedSocioeconomic = new Set(
          response.evidence?.selectedSocioeconomicIds ?? []
        );

        const patch = (value: Partial<Module5CaseResponse>) =>
          saveResponse(rawCase, { ...response, ...value });

        const updateProblemPart = (
          field: "chemicalFactor" | "impactRisk" | "stakeholderConsideration",
          value: string
        ) => {
          const problem = { ...response.problem, [field]: value };
          patch({
            problem: {
              ...problem,
              question: problemQuestionFromParts(problem),
            },
          });
        };

        const liveProblem = {
          ...response.problem,
          question: problemQuestionFromParts(response.problem),
        };
        const problemIssues = problemValidationIssues({
          ...response,
          problem: liveProblem,
        });
        const problemNotice =
          scaffoldNotices[scaffoldKey(discussionCase.id, "problem")];
        const hypothesisNotice =
          scaffoldNotices[scaffoldKey(discussionCase.id, "hypothesis")];
        const evidenceNotice =
          scaffoldNotices[scaffoldKey(discussionCase.id, "evidence")];
        const testingNotice =
          scaffoldNotices[scaffoldKey(discussionCase.id, "testing")];
        const conclusionNotice =
          scaffoldNotices[scaffoldKey(discussionCase.id, "conclusion")];

        const completeProblem = () => {
          clearScaffoldNotice(discussionCase.id, "problem");
          patch({
            problem: {
              ...response.problem,
              question: problemQuestionFromParts(response.problem),
              completedAt: Date.now(),
            },
          });
        };

        const completeHypothesis = () => {
          clearScaffoldNotice(discussionCase.id, "hypothesis");
          const next: Module5CaseResponse = {
            ...response,
            hypothesis: {
              ...response.hypothesis,
              completedAt: Date.now(),
            },
          };
          saveResponse(rawCase, next);
          void updatePaths({
            [`${P.sectionResponse(classId, uid, moduleId, sec.id)}/${discussionCase.id}`]:
              next,
          }).catch(() => undefined);
        };

        const completeEvidence = () => {
          clearScaffoldNotice(discussionCase.id, "evidence");
          patch({
            evidence: { ...response.evidence, completedAt: Date.now() },
          });
        };

        const submitArgument = async () => {
          const testing = response.testing;
          if (
            !testing?.verdict ||
            !hasText(testing.argument) ||
            !response.problem?.question ||
            !response.hypothesis?.position
          )
            return;
          const submittedAt = Date.now();
          const argument: ForumArgument = {
            format: "hypothesis_argument",
            ...(attemptId === LEGACY_DISCUSSION_ATTEMPT_ID
              ? {}
              : { attemptId }),
            verdict: testing.verdict,
            argument: testing.argument.trim(),
            studentName,
            submittedAt,
          };
          const next = {
            ...response,
            testing: { ...testing, argument: argument.argument, submittedAt },
          };
          clearScaffoldNotice(discussionCase.id, "testing");
          setBusyCase(`argument-${discussionCase.id}`);
          try {
            if (attemptId === LEGACY_DISCUSSION_ATTEMPT_ID) {
              await submitForumArgument(classId, discussionCase.id, uid, argument);
            } else {
              await submitForumArgumentAttempt(
                classId,
                discussionCase.id,
                uid,
                attemptId,
                argument
              );
            }
            setMyArguments((current) => ({ ...current, [discussionCase.id]: argument }));
            saveResponse(rawCase, next);
            // The public post is the submit-to-reveal authority. Persist the
            // private snapshot immediately as well; autosave remains a retry path.
            await updatePaths({
              [P.sectionResponse(classId, uid, moduleId, sec.id) + `/${discussionCase.id}`]:
                next,
            }).catch(() => undefined);
          } finally {
            setBusyCase(null);
          }
        };

        const submitConclusion = async () => {
          if (!response.conclusion || !conclusionComplete({
            ...response,
            conclusion: { ...response.conclusion, submittedAt: Date.now() },
          })) return;
          const submittedAt = Date.now();
          const next: Module5CaseResponse = {
            ...response,
            conclusion: { ...response.conclusion, submittedAt },
          };
          clearScaffoldNotice(discussionCase.id, "conclusion");
          setBusyCase(`conclusion-${discussionCase.id}`);
          try {
            await updatePaths({
              [P.sectionResponse(classId, uid, moduleId, sec.id) + `/${discussionCase.id}`]:
                next,
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
            saveResponse(rawCase, next);
          } finally {
            setBusyCase(null);
          }
        };

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
                <LockKeyhole className="h-4 w-4" /> Simpan keputusan kasus sebelumnya
                terlebih dahulu.
              </div>
            ) : (
              <div className="space-y-5 p-4 sm:p-5">
                <section className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-black text-slate-800">1. Orientasi</h4>
                    {orientationDone && <Badge tone="green">Lengkap</Badge>}
                  </div>
                  {discussionCase.imageUrl && (
                    <figure className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={discussionCase.imageUrl}
                        alt={
                          discussionCase.imageAlt ??
                          discussionCase.imageCaption ??
                          discussionCase.title
                        }
                        className="max-h-[420px] w-full object-cover"
                      />
                      <figcaption className="p-2 text-[11px] text-slate-500">
                        {discussionCase.imageCaption}
                      </figcaption>
                    </figure>
                  )}
                  <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                    {narrativeParagraphs(discussionCase.narrative).map(
                      (paragraph, paragraphIndex) => (
                        <p
                          key={`${discussionCase.id}-narrative-${paragraphIndex}`}
                          className="[text-align:justify] [text-indent:2rem]"
                        >
                          <ScientificText text={paragraph} />
                        </p>
                      )
                    )}
                  </div>
                  {Boolean(discussionCase.sources?.length) && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Daftar Pustaka
                      </p>
                      <BibliographyList
                        sources={discussionCase.sources ?? []}
                        className="mt-2"
                      />
                    </div>
                  )}
                  <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-brand-600">
                      Pertanyaan pemantik
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-950">
                      {discussionCase.phenomenonQuestion}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {discussionCase.stakeholderPerspectives?.map((perspective) => (
                      <div key={perspective.id} className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs font-black text-slate-700">
                          {perspective.stakeholder}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          {perspective.argument}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Label>{discussionCase.otherStakeholderPrompt}</Label>
                    <Textarea
                      rows={2}
                      readOnly={orientationDone || immutable}
                      aria-readonly={orientationDone || immutable}
                      className={
                        orientationDone || immutable
                          ? "cursor-not-allowed bg-slate-50 text-slate-600"
                          : undefined
                      }
                      value={response.orientation?.otherStakeholder ?? ""}
                      onChange={(event) =>
                        patch({
                          orientation: {
                            ...response.orientation,
                            otherStakeholder: event.target.value,
                          },
                        })
                      }
                      placeholder="Opsional: sebutkan pihak lain dan kepentingannya"
                    />
                    <Help>
                      {orientationDone
                        ? "Tahap orientasi telah dikunci. Reset Modul 5 untuk mengubah jawaban ini."
                        : "Jawaban ini opsional; perspektif contoh bukan jawaban tetap."}
                    </Help>
                  </div>
                  {!orientationDone && !immutable && (
                    <Button
                      className="mt-3"
                      size="sm"
                      onClick={() =>
                        patch({ orientation: { ...response.orientation, completedAt: Date.now() } })
                      }
                    >
                      Lanjut Merumuskan Masalah
                    </Button>
                  )}
                </section>

                {orientationDone && (
                  <section className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-slate-800">
                        2. Merumuskan Masalah
                      </h4>
                      {problemDone && <Badge tone="green">Lengkap</Badge>}
                    </div>
                    <div className="mb-3 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm leading-relaxed text-brand-950">
                      <p className="font-semibold">
                        Rumuskan sendiri pertanyaan penelitian setelah membaca kasus
                        lengkap. Hubungkan sisi ilmiah dengan pertimbangan
                        sosial-ekonomi atau perspektif lain.
                      </p>
                      <p className="mt-2 rounded-md bg-white/80 p-2 italic text-slate-700">
                        “Bagaimana pengaruh <b>faktor kimia dari kasus</b> terhadap{" "}
                        <b>risiko/dampak</b>, dibandingkan dengan{" "}
                        <b>beban sosial-ekonomi atau perspektif pihak pilihanmu</b>?”
                      </p>
                      <p className="mt-2 text-xs text-brand-800">
                        Isi setiap bagian berdasarkan penalaranmu sendiri. Perspektif
                        tidak dibatasi pada industri, pekerja, atau pemerintah; kamu
                        boleh memilih konsumen, investor, masyarakat, atau pihak lain
                        yang relevan. Sistem hanya memeriksa kelengkapan pola, bukan
                        benar-salah isi jawaban.
                      </p>
                    </div>
                    {discussionCase.problemGuide && (
                      <p className="mb-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                        <b>Panduan khusus kasus:</b> {discussionCase.problemGuide}
                      </p>
                    )}
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Lengkapi kalimat rumpang berikut
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-base font-semibold leading-relaxed text-slate-800">
                        <span className="shrink-0">Bagaimana pengaruh</span>
                        <label className="w-full sm:min-w-[180px] sm:flex-1">
                          <span className="sr-only">Faktor kimia dari kasus</span>
                          <input
                            type="text"
                            readOnly={problemDone || immutable}
                            aria-readonly={problemDone || immutable}
                            value={response.problem?.chemicalFactor ?? ""}
                            onChange={(event) =>
                              updateProblemPart("chemicalFactor", event.target.value)
                            }
                            placeholder="faktor kimia dari kasus"
                            className="w-full rounded-lg border border-slate-300 bg-brand-50 px-3 py-2 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 read-only:cursor-not-allowed read-only:bg-slate-100 read-only:text-slate-500"
                          />
                        </label>
                        <span className="shrink-0">terhadap</span>
                        <label className="w-full sm:min-w-[180px] sm:flex-1">
                          <span className="sr-only">Risiko atau dampak</span>
                          <input
                            type="text"
                            readOnly={problemDone || immutable}
                            aria-readonly={problemDone || immutable}
                            value={response.problem?.impactRisk ?? ""}
                            onChange={(event) =>
                              updateProblemPart("impactRisk", event.target.value)
                            }
                            placeholder="risiko atau dampak"
                            className="w-full rounded-lg border border-slate-300 bg-brand-50 px-3 py-2 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 read-only:cursor-not-allowed read-only:bg-slate-100 read-only:text-slate-500"
                          />
                        </label>
                        <span className="shrink-0">, dibandingkan dengan</span>
                        <label className="w-full sm:min-w-[240px] sm:flex-[1.35]">
                          <span className="sr-only">
                            Beban sosial-ekonomi atau perspektif lain
                          </span>
                          <input
                            type="text"
                            readOnly={problemDone || immutable}
                            aria-readonly={problemDone || immutable}
                            value={response.problem?.stakeholderConsideration ?? ""}
                            onChange={(event) =>
                              updateProblemPart(
                                "stakeholderConsideration",
                                event.target.value
                              )
                            }
                            placeholder="beban sosial-ekonomi atau perspektif lain"
                            className="w-full rounded-lg border border-slate-300 bg-brand-50 px-3 py-2 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 read-only:cursor-not-allowed read-only:bg-slate-100 read-only:text-slate-500"
                          />
                        </label>
                        <span className="shrink-0">?</span>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-slate-500">
                        {problemDone
                          ? "Rumusan masalah telah dikunci. Reset Modul 5 untuk menyusun rumusan baru."
                          : "Isi ketiga bagian langsung di dalam kalimat. Bagian terakhir bebas memakai perspektif konsumen, investor, masyarakat, atau pihak lain yang menurutmu relevan."}
                      </p>
                    </div>
                    {!problemDone && !immutable && (
                      <div
                        className={`mt-3 rounded-lg border p-3 text-xs ${
                          problemIssues.length
                            ? "border-amber-200 bg-amber-50 text-amber-900"
                            : "border-emerald-200 bg-emerald-50 text-emerald-900"
                        }`}
                      >
                        <p className="font-bold">Umpan balik otomatis</p>
                        {problemIssues.length ? (
                          <ul className="mt-1 list-disc space-y-1 pl-4">
                            {problemIssues.map((issue) => (
                              <li key={issue}>{issue}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1">
                            Pola sudah lengkap: sisi ilmiah dan sisi
                            sosial-ekonomi/perspektif lain sudah termuat secara
                            eksplisit.
                          </p>
                        )}
                      </div>
                    )}
                    {!problemDone && !immutable && (
                      <CaseScaffoldWarning
                        notice={problemNotice}
                        onContinue={completeProblem}
                      />
                    )}
                    {!problemDone && !immutable && (
                      <Button
                        className="mt-3"
                        size="sm"
                        disabled={problemIssues.length > 0}
                        onClick={() => {
                          const candidate: Module5CaseResponse = {
                            ...response,
                            problem: liveProblem,
                          };
                          if (
                            scaffoldAllowsImmediateContinue(
                              discussionCase,
                              candidate,
                              "problem"
                            )
                          ) {
                            completeProblem();
                          }
                        }}
                      >
                        Periksa Rumusan Masalah
                      </Button>
                    )}
                  </section>
                )}

                {problemDone && (
                  <section className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-slate-800">
                        3. Merumuskan Hipotesis
                      </h4>
                      {hypothesisDone && <Badge tone="green">Lengkap</Badge>}
                    </div>
                    <p className="mb-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                      {discussionCase.hypothesisPrompt}
                    </p>
                    <p className="mb-3 text-xs text-slate-500">
                      Rumusan masalahmu: <b>{response.problem?.question}</b>
                    </p>
                    <div>
                      <Label>Hipotesis atau dugaan awal</Label>
                      <Textarea
                        rows={4}
                        readOnly={hypothesisDone || immutable}
                        aria-readonly={hypothesisDone || immutable}
                        className={
                          hypothesisDone || immutable
                            ? "cursor-not-allowed bg-slate-50 text-slate-600"
                            : undefined
                        }
                        value={hypothesisDraftText(response)}
                        onChange={(event) => {
                          patch({
                            hypothesis: {
                              ...response.hypothesis,
                              position: event.target.value,
                              reason: "",
                            },
                          });
                        }}
                        placeholder="Tuliskan hipotesis atau dugaan awalmu beserta alasan yang mendukungnya dalam satu jawaban."
                      />
                      <Help>
                        {hypothesisDone
                          ? "Hipotesis telah dikunci setelah kamu melanjutkan. Reset Modul 5 untuk menyusun hipotesis baru."
                          : "Gabungkan dugaan dan alasanmu dalam satu paragraf. Sistem hanya memeriksa apakah jawaban sudah diisi."}
                      </Help>
                    </div>
                    {!hypothesisDone && !immutable && (
                      <CaseScaffoldWarning
                        notice={hypothesisNotice}
                        onContinue={completeHypothesis}
                      />
                    )}
                    {!hypothesisDone && !immutable && (
                      <Button
                        className="mt-3"
                        size="sm"
                        disabled={!hypothesisComplete(response)}
                        onClick={() => {
                          if (
                            scaffoldAllowsImmediateContinue(
                              discussionCase,
                              response,
                              "hypothesis"
                            )
                          ) {
                            completeHypothesis();
                          }
                        }}
                      >
                        Periksa Hipotesis
                      </Button>
                    )}
                  </section>
                )}

                {hypothesisDone && (
                  <section className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-slate-800">
                        4. Mengumpulkan Data
                      </h4>
                      {evidenceDone && <Badge tone="green">Lengkap</Badge>}
                    </div>
                    <p className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                      {discussionCase.evidencePrompt}
                    </p>
                    <div className="mb-3 flex rounded-xl bg-slate-100 p-1" role="tablist">
                      {([
                        ["scientific", "Tab A · Bukti Ilmiah"],
                        ["socioeconomic", "Tab B · Bukti Sosial-Ekonomi"],
                      ] as const).map(([tab, label]) => {
                        const active = (evidenceTabs[discussionCase.id] ?? "scientific") === tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`flex-1 rounded-lg px-3 py-2 text-xs font-black transition-colors ${
                              active
                                ? "bg-white text-brand-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                            onClick={() =>
                              setEvidenceTabs((current) => ({
                                ...current,
                                [discussionCase.id]: tab,
                              }))
                            }
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {(evidenceTabs[discussionCase.id] ?? "scientific") ===
                    "scientific" ? (
                      <div className="space-y-2" role="tabpanel">
                        {discussionCase.scientificEvidence?.map((item) => (
                          <EvidenceOption
                            key={item.id}
                            item={item}
                            disabled={evidenceDone || immutable}
                            checked={selectedScientific.has(item.id)}
                            onChange={(checked) => {
                              const next = new Set(selectedScientific);
                              if (checked) next.add(item.id);
                              else next.delete(item.id);
                              patch({
                                evidence: {
                                  ...response.evidence,
                                  selectedScientificIds: Array.from(next),
                                },
                              });
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2" role="tabpanel">
                        {discussionCase.socioeconomicEvidence?.map((item) => (
                          <EvidenceOption
                            key={item.id}
                            item={item}
                            disabled={evidenceDone || immutable}
                            checked={selectedSocioeconomic.has(item.id)}
                            onChange={(checked) => {
                              const next = new Set(selectedSocioeconomic);
                              if (checked) next.add(item.id);
                              else next.delete(item.id);
                              patch({
                                evidence: {
                                  ...response.evidence,
                                  selectedSocioeconomicIds: Array.from(next),
                                },
                              });
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <Label>Bukti lain yang kamu temukan</Label>
                      <OwnEvidenceEditor
                        disabled={evidenceDone || immutable}
                        values={response.evidence?.ownEvidence ?? []}
                        onChange={(ownEvidence) => {
                          patch({ evidence: { ...response.evidence, ownEvidence } })
                        }}
                      />
                    </div>
                    <div className="mt-4">
                      <Label>Alasan memilih kumpulan bukti</Label>
                      <Textarea
                        rows={3}
                        readOnly={evidenceDone || immutable}
                        aria-readonly={evidenceDone || immutable}
                        className={
                          evidenceDone || immutable
                            ? "cursor-not-allowed bg-slate-50 text-slate-600"
                            : undefined
                        }
                        value={response.evidence?.selectionReason ?? ""}
                        onChange={(event) => {
                          patch({
                            evidence: {
                              ...response.evidence,
                              selectionReason: event.target.value,
                            },
                          });
                        }}
                        placeholder="Jelaskan kepentingan bukti yang dipilih. Belum perlu menyatakan cocok/tidak cocok dengan hipotesis."
                      />
                      {evidenceDone && (
                        <Help>
                          Pilihan bukti telah dikunci. Reset Modul 5 untuk memilih atau
                          menambahkan bukti baru.
                        </Help>
                      )}
                    </div>
                    {!evidenceDone && !immutable && (
                      <CaseScaffoldWarning
                        notice={evidenceNotice}
                        onContinue={completeEvidence}
                      />
                    )}
                    {!evidenceDone && !immutable && (
                      <Button
                        className="mt-3"
                        size="sm"
                        disabled={!evidenceComplete(response)}
                        onClick={() => {
                          if (
                            scaffoldAllowsImmediateContinue(
                              discussionCase,
                              response,
                              "evidence"
                            )
                          ) {
                            completeEvidence();
                          }
                        }}
                      >
                        Periksa Pilihan Bukti
                      </Button>
                    )}
                  </section>
                )}

                {evidenceDone && (
                  <section className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-slate-800">
                        5. Menguji Hipotesis dan Berdiskusi
                      </h4>
                      {testingDone && reviewsDone && <Badge tone="green">Lengkap</Badge>}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-black uppercase text-slate-500">Hipotesismu</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {hypothesisResponseText(response)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-black uppercase text-slate-500">Bukti pilihanmu</p>
                        <p className="mt-1 text-sm text-slate-700">
                          {selectedEvidenceSummary(discussionCase, response)}
                        </p>
                      </div>
                    </div>
                    {ownArgument ? (
                      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                        <p className="font-bold">{forumPostLabel(ownArgument)}</p>
                        <p className="mt-1 whitespace-pre-wrap">{ownArgument.argument}</p>
                      </div>
                    ) : legacyPost ? (
                      <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
                        <p className="font-bold">Post CER historis tetap tersimpan</p>
                        <p className="mt-1 whitespace-pre-wrap">{forumPostBody(legacyPost)}</p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <div>
                          <Label>Putusan terhadap hipotesis</Label>
                          <div className="flex flex-wrap gap-2">
                            {([
                              ["supported", "Hipotesis Didukung"],
                              ["not_supported", "Hipotesis Tidak Didukung"],
                            ] as const).map(([value, label]) => (
                              <button
                                type="button"
                                key={value}
                                disabled={readOnly && complete}
                                className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                                  response.testing?.verdict === value
                                    ? "border-brand-500 bg-brand-50 text-brand-700"
                                    : "border-slate-200 bg-white text-slate-600"
                                }`}
                                onClick={() => {
                                  patch({
                                    testing: { ...response.testing, verdict: value },
                                  });
                                }}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>Argumen ilmiah bebas</Label>
                          <Textarea
                            rows={4}
                            value={response.testing?.argument ?? ""}
                            onChange={(event) => {
                              patch({
                                testing: {
                                  ...response.testing,
                                  argument: event.target.value,
                                },
                              });
                            }}
                            placeholder="Hubungkan bukti pilihanmu dengan teori yang relevan. Tidak ada pola kalimat wajib."
                          />
                        </div>
                        <CaseScaffoldWarning
                          notice={testingNotice}
                          loading={busyCase === `argument-${discussionCase.id}`}
                          onContinue={() => void submitArgument()}
                        />
                        <Button
                          size="sm"
                          loading={busyCase === `argument-${discussionCase.id}`}
                          disabled={
                            !response.testing?.verdict ||
                            !hasText(response.testing?.argument)
                          }
                          onClick={() => {
                            if (
                              scaffoldAllowsImmediateContinue(
                                discussionCase,
                                response,
                                "testing"
                              )
                            ) {
                              void submitArgument();
                            }
                          }}
                        >
                          <Send className="h-4 w-4" /> Periksa Argumen
                        </Button>
                        <Help>
                          Setelah dikirim, argumen awal tidak dapat diubah dan forum teman
                          akan terbuka.
                        </Help>
                      </div>
                    )}

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <ForumStage
                        classId={classId}
                        uid={uid}
                        discussionCase={discussionCase}
                        response={response}
                        attemptId={attemptId}
                        ownSubmitted={ownSubmitted}
                        reviewerName={studentName}
                        disabled={complete}
                        onResponse={(next) => saveResponse(rawCase, next)}
                      />
                    </div>
                  </section>
                )}

                {testingDone && reviewsDone && (
                  <section className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-slate-800">6. Menyimpulkan</h4>
                      {complete && <Badge tone="green">Keputusan tersimpan</Badge>}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Jawab rumusan masalahmu sendiri</Label>
                        <p className="mb-2 text-xs text-slate-500">
                          {response.problem?.question ?? discussionCase.question}
                        </p>
                        <Textarea
                          rows={3}
                          disabled={complete}
                          value={response.conclusion?.problemAnswer ?? ""}
                          onChange={(event) => {
                            patch({
                              conclusion: {
                                ...response.conclusion,
                                problemAnswer: event.target.value,
                              },
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label>{discussionCase.conclusionPrompt}</Label>
                        <Textarea
                          rows={3}
                          disabled={complete}
                          value={response.conclusion?.policySolution ?? ""}
                          onChange={(event) => {
                            patch({
                              conclusion: {
                                ...response.conclusion,
                                policySolution: event.target.value,
                              },
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Bukti yang mendasari keputusan</Label>
                        <Textarea
                          rows={2}
                          disabled={complete}
                          value={response.conclusion?.evidenceBasis ?? ""}
                          onChange={(event) => {
                            patch({
                              conclusion: {
                                ...response.conclusion,
                                evidenceBasis: event.target.value,
                              },
                            });
                          }}
                          placeholder="Sebutkan bukti pilihanmu, temuan forum, atau bukti lain yang menjadi dasar."
                        />
                      </div>
                    </div>
                    {complete ? (
                      <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                        ✓ Keputusan tersimpan. Kasus berikutnya telah terbuka.
                      </p>
                    ) : (
                      <>
                        <CaseScaffoldWarning
                          notice={conclusionNotice}
                          loading={busyCase === `conclusion-${discussionCase.id}`}
                          onContinue={() => void submitConclusion()}
                        />
                        <Button
                          className="mt-3"
                          loading={busyCase === `conclusion-${discussionCase.id}`}
                          disabled={
                            !hasText(response.conclusion?.problemAnswer) ||
                            !hasText(response.conclusion?.policySolution) ||
                            !hasText(response.conclusion?.evidenceBasis)
                          }
                          onClick={() => {
                            if (
                              scaffoldAllowsImmediateContinue(
                                discussionCase,
                                response,
                                "conclusion"
                              )
                            ) {
                              void submitConclusion();
                            }
                          }}
                        >
                          Periksa Keputusan
                        </Button>
                      </>
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
