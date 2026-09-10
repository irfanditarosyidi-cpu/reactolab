"use client";

// Discussion case authoring + forum overview + teacher conclusion
// (PRD §6.2, §24): create case (article link + own question + decision prompt),
// publish/unpublish, read student CER & comments, publish conclusion.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { push, ref, set, update } from "firebase/database";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  EyeOff,
  MessageCircle,
  Pencil,
  Plus,
  Send,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Help, Input, Label, Textarea } from "@/components/ui/forms";
import Modal from "@/components/ui/Modal";
import { Avatar, Badge, EmptyState, Spinner } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { db } from "@/lib/firebase/client";
import { listen, listenAllCases, listenComments, listenPosts } from "@/lib/db";
import { P } from "@/lib/paths";
import { formatRelative } from "@/lib/utils";
import type {
  DiscussionCase,
  ForumComment,
  ForumPost,
  TeacherConclusion,
} from "@/lib/types";

type CaseItem = DiscussionCase & { id: string };

const EMPTY_FORM = {
  title: "",
  articleUrl: "",
  articleNote: "",
  question: "",
  decisionPrompt: "",
};

function CaseForumViewer({ classId, c }: { classId: string; c: CaseItem }) {
  const [posts, setPosts] = useState<Array<ForumPost & { uid: string }>>([]);
  const [comments, setComments] = useState<ForumComment[]>([]);
  useEffect(() => listenPosts(classId, c.id, setPosts), [classId, c.id]);
  useEffect(() => listenComments(classId, c.id, setComments), [classId, c.id]);

  return (
    <div className="mt-3 space-y-2.5 max-h-[420px] overflow-y-auto thin-scroll pr-1">
      {posts.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada CER dari siswa.</p>
      ) : (
        posts.map((p) => {
          const pc = comments.filter((x) => x.targetStudentId === p.uid);
          return (
            <div key={p.uid} className="rounded-xl border border-slate-200 p-3.5">
              <div className="flex items-center gap-2">
                <Avatar name={p.studentName} size={26} />
                <p className="text-sm font-bold text-slate-800">{p.studentName}</p>
                <span className="text-[11px] text-slate-400 ml-auto">
                  {formatRelative(p.submittedAt)}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <p><b className="text-brand-700">C:</b> <span className="text-slate-700">{p.claim}</span></p>
                <p><b className="text-emerald-700">E:</b> <span className="text-slate-700">{p.evidence}</span></p>
                <p><b className="text-amber-700">R:</b> <span className="text-slate-700">{p.reasoning}</span></p>
              </div>
              {pc.length > 0 && (
                <div className="mt-2 border-t border-slate-100 pt-1.5">
                  {pc.map((cm) => (
                    <p key={cm.id} className="text-xs text-slate-600 mt-1">
                      <MessageCircle className="h-3 w-3 inline mr-1 text-brand-500" />
                      <b>{cm.authorName}:</b> {cm.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
      {comments.filter((x) => !x.targetStudentId).length > 0 && (
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-bold text-slate-500 mb-1">Tanggapan umum</p>
          {comments
            .filter((x) => !x.targetStudentId)
            .map((cm) => (
              <p key={cm.id} className="text-xs text-slate-600 mt-0.5">
                <b>{cm.authorName}:</b> {cm.text}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}

export default function TeacherDiscussionPage() {
  const { classId } = useParams<{ classId: string }>();
  const { toast } = useToast();
  const [cases, setCases] = useState<CaseItem[] | null>(null);
  const [conclusion, setConclusion] = useState<TeacherConclusion | null>(null);
  const [conclusionText, setConclusionText] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CaseItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [viewCase, setViewCase] = useState<string | null>(null);

  useEffect(() => listenAllCases(classId, setCases), [classId]);
  useEffect(
    () =>
      listen<TeacherConclusion>(P.conclusion(classId), (c) => {
        setConclusion(c);
        if (c) setConclusionText(c.content);
      }),
    [classId]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };
  const openEdit = (c: CaseItem) => {
    setEditing(c);
    setForm({
      title: c.title,
      articleUrl: c.articleUrl,
      articleNote: c.articleNote ?? "",
      question: c.question,
      decisionPrompt: c.decisionPrompt,
    });
    setFormOpen(true);
  };

  const saveCase = async () => {
    setBusy(true);
    try {
      if (editing) {
        await update(ref(db, P.caseItem(classId, editing.id)), {
          ...form,
          updatedAt: Date.now(),
        });
        toast("Kasus diperbarui.", "success");
      } else {
        const r = push(ref(db, P.cases(classId)));
        await set(r, {
          ...form,
          published: false,
          order: (cases?.length ?? 0) + 1,
          createdAt: Date.now(),
        });
        toast("Kasus dibuat sebagai draft. Publikasikan saat siap.", "success");
      }
      setFormOpen(false);
    } catch {
      toast("Gagal menyimpan kasus.", "error");
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (c: CaseItem) => {
    await update(ref(db, P.caseItem(classId, c.id)), {
      published: !c.published,
      updatedAt: Date.now(),
    });
    toast(
      !c.published
        ? "Kasus dipublikasikan — siswa kini dapat melihatnya di Modul 6."
        : "Kasus disembunyikan dari siswa.",
      "success"
    );
  };

  const saveConclusion = async (publish: boolean) => {
    if (conclusionText.trim().length < 20) {
      toast("Kesimpulan minimal 20 karakter.", "error");
      return;
    }
    setBusy(true);
    try {
      await set(ref(db, P.conclusion(classId)), {
        content: conclusionText.trim(),
        published: publish,
        updatedAt: Date.now(),
        ...(publish ? { publishedAt: Date.now() } : {}),
      });
      toast(
        publish
          ? "Kesimpulan dipublikasikan — Modul 6 siswa kini dapat dituntaskan."
          : "Draft kesimpulan disimpan.",
        "success"
      );
    } catch {
      toast("Gagal menyimpan kesimpulan.", "error");
    } finally {
      setBusy(false);
    }
  };

  const formValid =
    form.title.trim().length >= 3 &&
    /^https?:\/\/\S+$/.test(form.articleUrl.trim()) &&
    form.question.trim().length >= 10 &&
    form.decisionPrompt.trim().length >= 10;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <Link
            href={`/teacher/classes/${classId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Kelas
          </Link>
          <h1 className="text-2xl font-black text-slate-900 mt-1.5">Forum Diskusi</h1>
          <p className="text-sm text-slate-500 mt-1">
            Susun studi kasus (artikel + pertanyaan), pantau CER siswa, lalu
            publikasikan kesimpulan.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Buat Kasus
        </Button>
      </div>

      {cases === null ? (
        <Spinner label="Memuat kasus…" />
      ) : cases.length === 0 ? (
        <Card>
          <EmptyState
            emoji="📰"
            title="Belum ada studi kasus"
            desc="Buat kasus diskusi dengan tautan artikel dan pertanyaanmu sendiri. Siswa baru melihatnya setelah dipublikasikan."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Buat Kasus
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {cases.map((c, i) => (
            <Card key={c.id}>
              <CardHeader
                title={
                  <span className="flex items-center gap-2 flex-wrap">
                    <Badge tone="blue">Kasus {i + 1}</Badge> {c.title}
                    <Badge tone={c.published ? "green" : "amber"}>
                      {c.published ? "Terpublikasi" : "Draft"}
                    </Badge>
                  </span>
                }
                subtitle={c.question}
                action={
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant={c.published ? "secondary" : "primary"}
                      onClick={() => void togglePublish(c)}
                    >
                      {c.published ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Sembunyikan
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Publikasikan
                        </>
                      )}
                    </Button>
                  </div>
                }
              />
              <CardBody>
                <a
                  href={c.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" /> {c.articleUrl}
                </a>
                <p className="mt-2 text-xs text-slate-500">
                  <b>Decision prompt:</b> {c.decisionPrompt}
                </p>
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-brand-600 hover:underline"
                  onClick={() => setViewCase(viewCase === c.id ? null : c.id)}
                >
                  {viewCase === c.id ? "▲ Tutup forum" : "▼ Lihat CER & tanggapan siswa"}
                </button>
                {viewCase === c.id && <CaseForumViewer classId={classId} c={c} />}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* teacher conclusion */}
      <Card>
        <CardHeader
          title="Kesimpulan Guru"
          subtitle="Dipublikasikan ke seluruh siswa; menjadi syarat penuntasan Modul 6."
          action={
            conclusion?.published ? (
              <Badge tone="green">Terpublikasi</Badge>
            ) : (
              <Badge tone="amber">Belum dipublikasi</Badge>
            )
          }
        />
        <CardBody className="space-y-3">
          <Textarea
            rows={5}
            value={conclusionText}
            onChange={(e) => setConclusionText(e.target.value)}
            placeholder="Rangkum jalannya diskusi, luruskan miskonsepsi, dan berikan kesimpulan ilmiah akhir untuk seluruh kasus…"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              loading={busy}
              onClick={() => void saveConclusion(false)}
            >
              Simpan Draft
            </Button>
            <Button loading={busy} onClick={() => void saveConclusion(true)}>
              <Send className="h-4 w-4" />
              {conclusion?.published ? "Perbarui Publikasi" : "Publikasikan"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* case form modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Kasus" : "Buat Kasus Diskusi"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button loading={busy} disabled={!formValid} onClick={() => void saveCase()}>
              {editing ? "Simpan Perubahan" : "Buat Kasus"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label>Judul Kasus</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="cth: Penyimpanan Makanan & Laju Reaksi"
            />
          </div>
          <div>
            <Label>Link Artikel</Label>
            <Input
              value={form.articleUrl}
              onChange={(e) => setForm({ ...form, articleUrl: e.target.value })}
              placeholder="https://…"
            />
            <Help>Gunakan artikel berita/sains yang relevan dengan laju reaksi.</Help>
          </div>
          <div>
            <Label>Catatan Pengantar (opsional)</Label>
            <Textarea
              rows={2}
              value={form.articleNote}
              onChange={(e) => setForm({ ...form, articleNote: e.target.value })}
              placeholder="Konteks singkat sebelum siswa membaca artikel…"
            />
          </div>
          <div>
            <Label>Pertanyaan Diskusi</Label>
            <Textarea
              rows={2}
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="Pertanyaan yang dijawab siswa dengan format CER…"
            />
          </div>
          <div>
            <Label>Decision Prompt</Label>
            <Textarea
              rows={2}
              value={form.decisionPrompt}
              onChange={(e) => setForm({ ...form, decisionPrompt: e.target.value })}
              placeholder="cth: Sebagai kepala dapur, keputusan apa yang kamu ambil dan mengapa?"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
