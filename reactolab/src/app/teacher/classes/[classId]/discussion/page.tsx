"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ref, set } from "firebase/database";
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  MessageCircle,
  Plus,
  RotateCcw,
  Send,
  Settings2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/forms";
import { Avatar, Badge, EmptyState, Spinner } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { db } from "@/lib/firebase/client";
import {
  ensureDefaultDiscussionCases,
  listen,
  listenAllCases,
  listenArgumentAttempts,
  listenArguments,
  listenComments,
  listenPosts,
  saveDiscussionCase,
  syncPublishedCaseProjection,
} from "@/lib/db";
import {
  casePublishIssues,
  forumPostBody,
  forumPostLabel,
} from "@/lib/discussion";
import { P } from "@/lib/paths";
import { formatRelative } from "@/lib/utils";
import type {
  ClassInfo,
  DiscussionCase,
  ForumArgument,
  ForumComment,
  ForumPeerReview,
  ForumPost,
  TeacherConclusion,
} from "@/lib/types";

type CaseItem = DiscussionCase & { id: string };
type ForumEntry = (ForumArgument | ForumPost) & {
  uid: string;
  attemptId?: string;
};

function ForumViewer({
  classId,
  discussionCase,
}: {
  classId: string;
  discussionCase: CaseItem;
}) {
  const [argumentsList, setArgumentsList] = useState<
    Array<ForumArgument & { uid: string }>
  >([]);
  const [attemptArguments, setAttemptArguments] = useState<
    Array<ForumArgument & { uid: string; attemptId: string }>
  >([]);
  const [legacyPosts, setLegacyPosts] = useState<
    Array<ForumPost & { uid: string }>
  >([]);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [peerReviews, setPeerReviews] = useState<
    Record<string, Record<string, ForumPeerReview>>
  >({});
  const [attemptPeerReviews, setAttemptPeerReviews] = useState<
    Record<string, Record<string, Record<string, ForumPeerReview>>>
  >({});

  useEffect(
    () => listenArguments(classId, discussionCase.id, setArgumentsList),
    [classId, discussionCase.id]
  );
  useEffect(
    () =>
      listenArgumentAttempts(
        classId,
        discussionCase.id,
        setAttemptArguments
      ),
    [classId, discussionCase.id]
  );
  useEffect(
    () => listenPosts(classId, discussionCase.id, setLegacyPosts),
    [classId, discussionCase.id]
  );
  useEffect(
    () => listenComments(classId, discussionCase.id, setComments),
    [classId, discussionCase.id]
  );
  useEffect(
    () =>
      listen<Record<string, Record<string, ForumPeerReview>>>(
        P.peerReviews(classId, discussionCase.id),
        (value) => setPeerReviews(value ?? {})
      ),
    [classId, discussionCase.id]
  );
  useEffect(
    () =>
      listen<Record<string, Record<string, Record<string, ForumPeerReview>>>>(
        P.peerReviewAttempts(classId, discussionCase.id),
        (value) => setAttemptPeerReviews(value ?? {})
      ),
    [classId, discussionCase.id]
  );

  const entries = useMemo<ForumEntry[]>(
    () =>
      [...legacyPosts, ...argumentsList, ...attemptArguments].sort(
        (a, b) => a.submittedAt - b.submittedAt
      ),
    [argumentsList, attemptArguments, legacyPosts]
  );
  const reviews = [
    ...Object.values(peerReviews).flatMap((value) => Object.values(value)),
    ...Object.values(attemptPeerReviews).flatMap((attempts) =>
      Object.values(attempts).flatMap((value) => Object.values(value))
    ),
  ];

  if (!entries.length) {
    return <p className="mt-3 text-sm text-slate-400">Belum ada argumen siswa.</p>;
  }

  return (
    <div className="mt-3 max-h-[520px] space-y-3 overflow-y-auto pr-1 thin-scroll">
      {entries.map((entry) => {
        const legacyComments = entry.attemptId
          ? []
          : comments.filter((item) => item.targetStudentId === entry.uid);
        const receivedReviews = reviews.filter(
          (item) =>
            item.targetStudentId === entry.uid &&
            (entry.attemptId
              ? item.targetAttemptId === entry.attemptId
              : !item.targetAttemptId)
        );

        return (
          <div
            key={`${entry.uid}-${entry.attemptId ?? "legacy"}-${entry.submittedAt}`}
            className="rounded-xl border border-slate-200 p-3.5"
          >
            <div className="flex items-center gap-2">
              <Avatar name={entry.studentName} size={28} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">
                  {entry.studentName}
                </p>
                <p className="text-[11px] text-slate-400">
                  {forumPostLabel(entry)} · {formatRelative(entry.submittedAt)}
                </p>
              </div>
              {entry.attemptId && (
                <Badge tone="sky">Versi jawaban</Badge>
              )}
            </div>
            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              {forumPostBody(entry)}
            </p>
            {[
              ...legacyComments.map((item) => ({
                id: item.id ?? `${item.authorId}-${item.createdAt}`,
                author: item.authorName,
                difference: "Tanggapan CER historis",
                response: item.text,
              })),
              ...receivedReviews.map((item) => ({
                id: `${item.reviewerId}-${item.attemptId ?? "legacy"}-${item.targetStudentId}-${item.createdAt}`,
                author: item.reviewerName || "Siswa",
                difference: item.differenceReason,
                response: item.response,
              })),
            ].map((item) => (
              <div
                key={item.id}
                className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-600"
              >
                <p className="font-bold">
                  <MessageCircle className="mr-1 inline h-3 w-3 text-brand-500" />
                  {item.author}
                </p>
                <p className="mt-1">
                  <b>Perbedaan:</b> {item.difference}
                </p>
                <p className="mt-1">
                  <b>Tanggapan:</b> {item.response}
                </p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function TeacherDiscussionPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [cases, setCases] = useState<CaseItem[] | null>(null);
  const [conclusion, setConclusion] = useState<TeacherConclusion | null>(null);
  const [conclusionText, setConclusionText] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewCase, setViewCase] = useState<string | null>(null);

  useEffect(() => {
    void ensureDefaultDiscussionCases(classId).catch(() => undefined);
    return listenAllCases(classId, setCases);
  }, [classId]);
  useEffect(
    () => listen<ClassInfo>(P.class(classId), setClassInfo),
    [classId]
  );
  useEffect(
    () =>
      listen<TeacherConclusion>(P.conclusion(classId), (value) => {
        setConclusion(value);
        if (value) setConclusionText(value.content);
      }),
    [classId]
  );
  useEffect(() => {
    if (!cases) return;
    void syncPublishedCaseProjection(classId, cases).catch(() => undefined);
  }, [cases, classId]);

  const activeCases = (cases ?? []).filter((item) => !item.archivedAt);
  const archivedCases = (cases ?? []).filter((item) => item.archivedAt);
  const editorBase = `/teacher/classes/${classId}/discussion/cases`;

  const openCreate = () => router.push(`${editorBase}/new`);

  const openEdit = (discussionCase: CaseItem) => {
    router.push(`${editorBase}/${encodeURIComponent(discussionCase.id)}`);
  };

  const restoreCase = async (discussionCase: CaseItem) => {
    const restored = { ...discussionCase, published: false };
    delete restored.archivedAt;
    delete restored.archivedReason;
    await saveDiscussionCase(classId, restored, discussionCase.id);
    toast("Kasus dipulihkan sebagai draft.", "success");
  };

  const moveCase = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= activeCases.length) return;
    const current = activeCases[index];
    const other = activeCases[target];
    await Promise.all([
      saveDiscussionCase(
        classId,
        { ...current, order: other.order ?? target + 1 },
        current.id
      ),
      saveDiscussionCase(
        classId,
        { ...other, order: current.order ?? index + 1 },
        other.id
      ),
    ]);
  };

  const saveConclusion = async (publish: boolean) => {
    if (!conclusionText.trim()) {
      toast("Isi kesimpulan guru terlebih dahulu.", "error");
      return;
    }

    setBusy(true);
    try {
      const now = Date.now();
      await set(ref(db, P.conclusion(classId)), {
        content: conclusionText.trim(),
        published: publish,
        updatedAt: now,
        ...(publish ? { publishedAt: now } : {}),
      });
      toast(
        publish
          ? "Kesimpulan guru dipublikasikan."
          : "Draft kesimpulan disimpan.",
        "success"
      );
    } catch {
      toast("Gagal menyimpan kesimpulan.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-[240px] flex-1">
          <Link
            href="/teacher/classes"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <ArrowLeft className="h-4 w-4" /> Semua Kelas
          </Link>
          <h1 className="mt-1.5 text-2xl font-black text-slate-900">
            Forum Diskusi
          </h1>
          <p className="mt-1 text-sm font-bold text-brand-700">
            {classInfo?.className ?? "Memuat kelas…"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Kelola studi kasus Modul 5, lalu pantau argumen dan tanggapan siswa.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Buat Kasus Custom
        </Button>
      </div>

      {cases === null ? (
        <Spinner label="Memuat kasus…" />
      ) : activeCases.length === 0 ? (
        <Card>
          <EmptyState
            emoji="🧪"
            title="Belum ada studi kasus aktif"
            desc="Kasus bawaan sedang disiapkan. Anda juga dapat membuat kasus custom."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Buat Kasus Custom
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {activeCases.map((discussionCase, index) => {
            const issues = casePublishIssues(discussionCase);
            return (
              <Card key={discussionCase.id}>
                <CardHeader
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge tone="blue">Kasus {index + 1}</Badge>
                      {discussionCase.title}
                      {discussionCase.defaultKey && (
                        <Badge tone="slate">Kasus Bawaan</Badge>
                      )}
                      <Badge tone={discussionCase.published ? "green" : "amber"}>
                        {discussionCase.published ? "Terbit" : "Draft"}
                      </Badge>
                    </span>
                  }
                  subtitle={
                    discussionCase.phenomenonQuestion ?? discussionCase.question
                  }
                  action={
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={index === 0}
                        aria-label="Naikkan urutan"
                        onClick={() => void moveCase(index, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={index === activeCases.length - 1}
                        aria-label="Turunkan urutan"
                        onClick={() => void moveCase(index, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEdit(discussionCase)}
                      >
                        <Settings2 className="h-4 w-4" /> Kelola Kasus
                      </Button>
                    </div>
                  }
                />
                <CardBody>
                  {!discussionCase.published && issues.length > 0 && (
                    <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <b>Belum lengkap untuk terbit:</b> {issues.join(", ")}.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>
                      {discussionCase.scientificEvidence?.length ?? 0} bukti ilmiah
                    </span>
                    <span>
                      {discussionCase.socioeconomicEvidence?.length ?? 0} bukti
                      sosial-ekonomi
                    </span>
                    <span>
                      {discussionCase.stakeholderPerspectives?.length ?? 0}{" "}
                      perspektif contoh
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mt-4 text-sm font-semibold text-brand-600 hover:underline"
                    onClick={() =>
                      setViewCase(
                        viewCase === discussionCase.id ? null : discussionCase.id
                      )
                    }
                  >
                    {viewCase === discussionCase.id
                      ? "▲ Tutup respons"
                      : "▼ Lihat argumen & tanggapan siswa"}
                  </button>
                  {viewCase === discussionCase.id && (
                    <ForumViewer
                      classId={classId}
                      discussionCase={discussionCase}
                    />
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {archivedCases.length > 0 && (
        <Card>
          <CardHeader
            title="Arsip Kasus"
            subtitle="Kasus dengan respons tidak dihapus agar riwayat siswa tetap utuh."
          />
          <CardBody className="space-y-2">
            {archivedCases.map((discussionCase) => (
              <div
                key={discussionCase.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3"
              >
                <Archive className="h-4 w-4 text-slate-400" />
                <span className="flex-1 text-sm font-semibold text-slate-700">
                  {discussionCase.title}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void restoreCase(discussionCase)}
                >
                  <RotateCcw className="h-4 w-4" /> Pulihkan sebagai Draft
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setViewCase(
                      viewCase === discussionCase.id ? null : discussionCase.id
                    )
                  }
                >
                  Lihat riwayat
                </Button>
                {viewCase === discussionCase.id && (
                  <div className="w-full">
                    <ForumViewer
                      classId={classId}
                      discussionCase={discussionCase}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Kesimpulan Guru"
          subtitle="Tetap menjadi prasyarat bagian penutup Modul 5."
          action={
            <Badge tone={conclusion?.published ? "green" : "amber"}>
              {conclusion?.published ? "Terbit" : "Draft"}
            </Badge>
          }
        />
        <CardBody className="space-y-3">
          <Textarea
            rows={5}
            value={conclusionText}
            onChange={(event) => setConclusionText(event.target.value)}
            placeholder="Rangkum diskusi, luruskan miskonsepsi, dan berikan kesimpulan ilmiah…"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              loading={busy}
              onClick={() => void saveConclusion(false)}
            >
              Simpan Draft
            </Button>
            <Button loading={busy} onClick={() => void saveConclusion(true)}>
              <Send className="h-4 w-4" /> Publikasikan
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
