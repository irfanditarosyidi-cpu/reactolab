import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  caseCompleted,
  casePublishIssues,
  conclusionComplete,
  createDiscussionAttemptId,
  discussionAttemptMatches,
  distinctPeerReviewCount,
  discussionScaffoldHint,
  discussionScaffoldWarnings,
  evidenceComplete,
  hypothesisComplete,
  hypothesisDraftText,
  hypothesisResponseText,
  looksLikePlaceholderText,
  mergePublishedCasePlan,
  narrativeParagraphs,
  peerReviewComplete,
  problemComplete,
  problemQuestionFromParts,
  problemValidationIssues,
  scientificTextSegments,
  sourceCitation,
  LEGACY_DISCUSSION_ATTEMPT_ID,
} from "../src/lib/discussion";
import {
  defaultDiscussionCases,
  DISCUSSION_CASE_TEMPLATES,
  missingDefaultDiscussionCases,
} from "../src/lib/discussion-templates";
import type {
  DiscussionCase,
  ForumPeerReview,
  Module5CaseResponse,
} from "../src/lib/types";
import { resetModuleProgress } from "../src/lib/progress";

const discussionCase: DiscussionCase = {
  schemaVersion: 2,
  title: "Kasus uji",
  narrative: "Narasi",
  imageUrl: "https://example.com/photo.jpg",
  imageCaption: "Caption foto uji",
  sources: [{ id: "s1", label: "Sumber", url: "https://example.com/source" }],
  phenomenonQuestion: "Mengapa peristiwa ini terjadi?",
  stakeholderPerspectives: [
    { id: "p1", stakeholder: "Pekerja", argument: "Contoh perspektif" },
  ],
  otherStakeholderPrompt: "Adakah pihak lain?",
  problemGuide: "Rangkai pertanyaan.",
  hypothesisPrompt: "Tulis dugaan.",
  scientificEvidence: [
    {
      id: "science",
      title: "Data ilmiah",
      content: "Data",
      sourceLabel: "Sumber ilmiah",
      sourceUrl: "https://example.com/science",
    },
  ],
  socioeconomicEvidence: [
    {
      id: "social",
      title: "Data sosial",
      content: "Data",
      sourceLabel: "Sumber sosial",
      sourceUrl: "https://example.com/social",
    },
  ],
  evidencePrompt: "Pilih bukti.",
  conclusionPrompt: "Usulkan kebijakan.",
  articleUrl: "https://example.com/source",
  question: "Mengapa peristiwa ini terjadi?",
  decisionPrompt: "Usulkan kebijakan.",
  published: false,
  createdAt: 1,
};

const baseResponse = (): Module5CaseResponse => ({
  schemaVersion: 2,
  caseSnapshot: discussionCase,
  caseOrder: 1,
  startedAt: 1,
});

function review(reviewerId: string, targetStudentId: string): ForumPeerReview {
  return {
    reviewerId,
    reviewerName: reviewerId,
    targetStudentId,
    targetName: targetStudentId,
    differenceReason: "Berbeda sudut pandang",
    response: "Tanggapan beralasan",
    createdAt: 1,
  };
}

test("rumusan masalah memeriksa pola sains dan perspektif bebas tanpa menilai makna", () => {
  const response = baseResponse();
  response.problem = {
    chemicalFactor: "ukuran partikel",
    impactRisk: "risiko ledakan",
    stakeholderConsideration: "kepercayaan konsumen",
  };
  response.problem.question = problemQuestionFromParts(response.problem);
  assert.equal(problemComplete(response), true);
  assert.deepEqual(problemValidationIssues(response), []);

  response.problem.question =
    "Bagaimana pengaruh ukuran partikel terhadap risiko ledakan?";
  assert.equal(problemComplete(response), false);
  assert.match(problemValidationIssues(response).join(" "), /sosial-ekonomi/i);

  response.problem.question = problemQuestionFromParts(response.problem);
  response.problem.impactRisk = "";
  assert.equal(problemComplete(response), false);
});

test("hipotesis cukup ditulis sebagai satu jawaban utuh", () => {
  const response = baseResponse();
  response.hypothesis = {
    position: "Ukuran partikel yang lebih kecil meningkatkan risiko ledakan karena memperluas bidang kontak.",
    reason: "",
  };
  assert.equal(hypothesisComplete(response), true);
  assert.equal(
    hypothesisResponseText(response),
    "Ukuran partikel yang lebih kecil meningkatkan risiko ledakan karena memperluas bidang kontak."
  );

  response.hypothesis = {
    position: "Dugaan dari respons lama",
    reason: "Alasan dari respons lama",
  };
  assert.equal(hypothesisComplete(response), true);
  assert.equal(
    hypothesisResponseText(response),
    "Dugaan dari respons lama\n\nAlasan: Alasan dari respons lama"
  );

  response.hypothesis = { position: "", reason: "" };
  assert.equal(hypothesisComplete(response), false);
});

test("teks hipotesis mempertahankan spasi selama masih diedit", () => {
  const response = baseResponse();
  response.hypothesis = {
    position: "  Jika konsentrasi meningkat, maka laju reaksi meningkat.  ",
    reason: "",
  };

  assert.equal(
    hypothesisDraftText(response),
    "  Jika konsentrasi meningkat, maka laju reaksi meningkat.  "
  );
  assert.equal(
    hypothesisResponseText(response),
    "Jika konsentrasi meningkat, maka laju reaksi meningkat."
  );
});

test("scaffolding kasus memberi peringatan tanpa membatalkan kelengkapan tahap", () => {
  const response = baseResponse();
  response.hypothesis = {
    position: "Debu meningkatkan risiko.",
    reason: "",
  };

  assert.equal(hypothesisComplete(response), true);
  assert.ok(discussionScaffoldWarnings("hypothesis", response).length > 0);

  const configuredCase: DiscussionCase = {
    ...discussionCase,
    scaffolding: {
      hypothesisHints: [
        "Petunjuk awal dari guru.",
        "Petunjuk lanjutan dari guru.",
      ],
    },
  };
  assert.equal(
    discussionScaffoldHint(configuredCase, "hypothesis", 1),
    "Petunjuk awal dari guru."
  );
  assert.equal(
    discussionScaffoldHint(configuredCase, "hypothesis", 3),
    "Petunjuk lanjutan dari guru."
  );
});

test("tahap bukti memerlukan sisi ilmiah dan sosial-ekonomi, termasuk bukti sendiri", () => {
  const response = baseResponse();
  response.evidence = {
    selectedScientificIds: ["science"],
    selectedSocioeconomicIds: [],
    selectionReason: "relevan",
  };
  assert.equal(evidenceComplete(response), false);
  response.evidence.ownEvidence = [
    {
      id: "own-social",
      category: "socioeconomic",
      content: "bukti",
      source: "sumber",
      selectionReason: "alasan",
    },
  ];
  assert.equal(evidenceComplete(response), true);
});

test("scaffolding data mengenali teks asal yang panjang dan berulang", () => {
  const response = baseResponse();
  response.evidence = {
    selectedScientificIds: ["science"],
    selectedSocioeconomicIds: ["social"],
    selectionReason: "asasasaasssssssssssssssssssssssssssssssssssssssssssssss",
  };

  assert.equal(looksLikePlaceholderText(response.evidence.selectionReason), true);
  assert.ok(discussionScaffoldWarnings("evidence", response).length > 0);
  assert.equal(
    looksLikePlaceholderText(
      "Bukti ini dipilih karena menunjukkan hubungan risiko kimia dengan keselamatan pekerja."
    ),
    false
  );
});

test("dua ulasan harus berasal dari dua target penulis yang berbeda dan bukan diri sendiri", () => {
  const response = baseResponse();
  response.peerReviews = {
    first: review("student-a", "student-b"),
    duplicate: review("student-a", "student-b"),
    self: review("student-a", "student-a"),
  };
  assert.equal(distinctPeerReviewCount(response.peerReviews), 1);
  assert.equal(peerReviewComplete(response, discussionCase), false);
  response.peerReviews.second = review("student-a", "student-c");
  assert.equal(distinctPeerReviewCount(response.peerReviews), 2);
  assert.equal(peerReviewComplete(response, discussionCase), true);
});

test("pengecualian forum hanya berlaku jika diputuskan guru dan dicatat siswa", () => {
  const response = baseResponse();
  const exceptionCase = {
    ...discussionCase,
    allowPeerReviewException: true,
    peerReviewExceptionNote: "Kelas hanya memiliki dua siswa aktif.",
  };
  assert.equal(peerReviewComplete(response, exceptionCase), false);
  response.peerExceptionUsedAt = 2;
  assert.equal(peerReviewComplete(response, exceptionCase), true);
});

test("kesimpulan memakai validasi kelengkapan, bukan panjang atau kata kunci", () => {
  const response = baseResponse();
  response.conclusion = {
    problemAnswer: "a",
    policySolution: "b",
    evidenceBasis: "c",
    submittedAt: 2,
  };
  assert.equal(conclusionComplete(response), true);
  assert.equal(caseCompleted(response), true);
  response.conclusion.evidenceBasis = "";
  assert.equal(conclusionComplete(response), false);
});

test("status keputusan historis tetap dianggap selesai tanpa menghapus CER lama", () => {
  const response = baseResponse();
  response.claim = "Claim lama";
  response.evidenceText = "Evidence lama";
  response.reasoning = "Reasoning lama";
  response.decision = "Keputusan lama";
  response.decisionSubmittedAt = 2;
  assert.equal(caseCompleted(response), true);
  assert.equal(response.claim, "Claim lama");
});

test("reset Modul 5 membuat percobaan editable baru tanpa memakai jawaban historis", () => {
  const attemptId = createDiscussionAttemptId(1_700_000_000_000);
  const reset = resetModuleProgress(5, attemptId);

  assert.equal(reset.status, "unlocked");
  assert.equal(reset.completionPercent, 0);
  assert.equal(reset.attemptId, attemptId);
  assert.ok(Object.values(reset.sections).every((item) => item.status === "locked"));
  assert.equal(
    discussionAttemptMatches(undefined, LEGACY_DISCUSSION_ATTEMPT_ID),
    true
  );
  assert.equal(discussionAttemptMatches(undefined, attemptId), false);
  assert.equal(discussionAttemptMatches(attemptId, attemptId), true);

  for (const moduleId of [1, 2, 3, 4, 6]) {
    const otherReset = resetModuleProgress(moduleId, attemptId);
    assert.equal(otherReset.status, "unlocked");
    assert.equal(otherReset.completionPercent, 0);
    assert.equal(otherReset.attemptId, undefined);
    assert.ok(
      Object.values(otherReset.sections).every(
        (item) => item.status === "locked"
      )
    );
  }
});

test("kasus tidak dapat terbit tanpa foto, caption, sumber, dan komponen alur", () => {
  assert.deepEqual(casePublishIssues(discussionCase), []);
  assert.ok(casePublishIssues({ ...discussionCase, imageCaption: "" }).includes("caption foto"));
  assert.ok(
    casePublishIssues({ ...discussionCase, sources: [] }).includes(
      "sumber rujukan"
    )
  );
  assert.ok(
    !casePublishIssues({
      ...discussionCase,
      sources: [
        {
          id: "bibliography",
          label: "Badan Penerbit. (2026). Judul sumber.",
          url: "",
        },
      ],
    }).includes("sumber rujukan")
  );
});

test("data sumber lama dirangkai menjadi satu sitasi dalam kotaknya", () => {
  assert.equal(
    sourceCitation({
      id: "b",
      label: "Penulis B (2025)",
      note: "Judul sumber",
      url: "https://example.com/b",
    }),
    "Penulis B (2025). Judul sumber. https://example.com/b"
  );
});

test("dua kasus bawaan siap terbit dengan gambar, scaffolding, dan catatan kehati-hatian fakta", () => {
  const sugar = DISCUSSION_CASE_TEMPLATES.find((item) => item.templateId === "imperial-sugar");
  const ammonia = DISCUSSION_CASE_TEMPLATES.find((item) => item.templateId === "pupuk-kaltim");
  const defaults = defaultDiscussionCases();
  assert.ok(sugar);
  assert.ok(ammonia);
  assert.equal("published" in sugar, false);
  assert.equal("published" in ammonia, false);
  assert.equal(defaults.length, 2);
  assert.deepEqual(
    defaults.map((item) => item.id),
    ["default-imperial-sugar", "default-pupuk-kaltim"]
  );
  assert.ok(defaults.every((item) => item.published));
  assert.ok(defaults.every((item) => casePublishIssues(item).length === 0));
  assert.ok(defaults.every((item) => item.imageUrl?.startsWith("https://")));
  assert.ok(defaults.every((item) => item.imageCaption));
  assert.ok(defaults.every((item) => item.scaffolding?.problemHints?.length));
  assert.match(sugar.narrative ?? "", /bukan pengukuran konsentrasi saat insiden/i);
  assert.match(
    sugar.scientificEvidence?.find((item) => item.id === "housekeeping-criterion")?.content ?? "",
    /bukan konsentrasi ledakan/i
  );
  const sugarChart = sugar.scientificEvidence?.find(
    (item) => item.id === "particle-threshold"
  );
  assert.equal(sugarChart?.chartXAxisTitle, "Ukuran partikel");
  assert.match(sugarChart?.chartYAxisTitle ?? "", /konsentrasi minimum/i);
  assert.match(ammonia.narrative ?? "", /bukan data pengukuran pada lokasi kebocoran/i);
  assert.match(ammonia.narrative ?? "", /tidak menetapkan penyebab keausan gasket/i);
});

test("penyemaian kasus bawaan bersifat idempoten dan tidak menduplikasi judul lama", () => {
  const defaults = defaultDiscussionCases();
  assert.equal(missingDefaultDiscussionCases(undefined).length, 2);
  assert.equal(
    missingDefaultDiscussionCases({
      [defaults[0].id]: defaults[0],
    }).length,
    1
  );
  assert.equal(
    missingDefaultDiscussionCases({
      legacy: {
        ...discussionCase,
        title: defaults[0].title,
        published: true,
      },
    }).some((item) => item.defaultKey === defaults[0].defaultKey),
    false
  );
});

test("aturan RTDB memisahkan draft, submit-to-reveal, dan dua penulis berbeda", () => {
  const rules = JSON.parse(readFileSync("database.rules.json", "utf8")) as {
    rules: Record<string, unknown>;
  };
  const text = JSON.stringify(rules);
  assert.match(text, /query\.orderByChild == 'published'/);
  assert.match(text, /forumArguments/);
  assert.match(text, /forumArgumentAttempts/);
  assert.match(text, /forumPeerReviewAttempts/);
  assert.match(text, /child\('attemptId'\)\.val\(\) === \$attemptId/);
  assert.match(text, /data\.child\(auth\.uid\)\.exists\(\)/);
  assert.match(text, /\$targetId !== \$reviewerId/);
  assert.match(text, /!data\.exists\(\)/);
});

test("kasus yang baru diterbitkan ditambahkan ke rencana siswa tanpa menghapus urutan lama", () => {
  assert.deepEqual(
    mergePublishedCasePlan(["case-a", "case-b"], ["case-b", "case-c"]),
    ["case-a", "case-b", "case-c"]
  );
});

test("enter pada narasi menghasilkan paragraf terpisah", () => {
  assert.deepEqual(
    narrativeParagraphs("Paragraf pertama.\r\n\r\nParagraf kedua."),
    ["Paragraf pertama.", "Paragraf kedua."]
  );
});

test("format ilmiah pada narasi memisahkan subscript dan superscript secara aman", () => {
  assert.deepEqual(scientificTextSegments("H_{2}SO_{4} dan cm^{3}"), [
    { text: "H", script: "normal" },
    { text: "2", script: "subscript" },
    { text: "SO", script: "normal" },
    { text: "4", script: "subscript" },
    { text: " dan cm", script: "normal" },
    { text: "3", script: "superscript" },
  ]);
});
