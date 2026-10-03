import type {
  DiscussionCase,
  DiscussionCaseScaffolding,
  DiscussionScaffoldStage,
  DiscussionSource,
  ForumArgument,
  ForumPost,
  ForumPeerReview,
  Module5CaseResponse,
} from "./types";

export const LEGACY_DISCUSSION_ATTEMPT_ID = "legacy";

/** Firebase-safe ID for one complete run of Module 5. */
export function createDiscussionAttemptId(now = Date.now()): string {
  return `attempt-${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Historical records only belong to the legacy run, never to a reset run. */
export function discussionAttemptMatches(
  recordAttemptId: string | undefined,
  activeAttemptId: string
): boolean {
  const normalizedRecord =
    recordAttemptId ?? LEGACY_DISCUSSION_ATTEMPT_ID;
  return normalizedRecord === activeAttemptId;
}

export const REQUIRED_PEER_REVIEWS = 2;

const DISCUSSION_SCAFFOLD_HINT_KEYS: Record<
  DiscussionScaffoldStage,
  keyof DiscussionCaseScaffolding
> = {
  problem: "problemHints",
  hypothesis: "hypothesisHints",
  evidence: "evidenceHints",
  testing: "testingHints",
  conclusion: "conclusionHints",
};

const DEFAULT_DISCUSSION_SCAFFOLD_HINTS: Record<
  DiscussionScaffoldStage,
  string[]
> = {
  problem: [
    "Perjelas hubungan antara faktor kimia, risiko atau dampak, dan perspektif lain yang kamu pilih.",
    "Baca kembali kasus lalu pastikan setiap bagian rumusan masalah menyebut gagasan yang cukup spesifik.",
  ],
  hypothesis: [
    "Nyatakan dugaanmu dan tambahkan alasan yang menjelaskan mengapa hal tersebut dapat terjadi.",
    "Hubungkan faktor kimia pada kasus dengan risiko atau dampak yang kamu perkirakan.",
  ],
  evidence: [
    "Jelaskan mengapa bukti ilmiah dan bukti sosial-ekonomi yang dipilih relevan dengan rumusan masalahmu.",
    "Bandingkan fungsi setiap bukti: data mana yang menjelaskan proses ilmiah dan data mana yang menunjukkan dampaknya.",
  ],
  testing: [
    "Hubungkan keputusan terhadap hipotesis dengan data atau bukti yang telah kamu pilih.",
    "Sebutkan pola atau temuan pada bukti, lalu jelaskan mengapa temuan itu mendukung atau tidak mendukung hipotesismu.",
  ],
  conclusion: [
    "Pastikan keputusanmu menjawab masalah, menawarkan solusi, dan menyebut dasar buktinya.",
    "Perjelas hubungan antara bukti, alasan ilmiah, dan dampak solusi bagi pihak yang berkepentingan.",
  ],
};

export function mergePublishedCasePlan(
  currentPlan: string[],
  publishedCaseIds: string[]
): string[] {
  return [
    ...currentPlan,
    ...publishedCaseIds.filter((caseId) => !currentPlan.includes(caseId)),
  ];
}

export function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function narrativeParagraphs(value: string | undefined): string[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function sourceCitation(source: DiscussionSource): string {
  return [source.label, source.note, source.url].filter(hasText).join(". ");
}

function normalizedSources(discussionCase: DiscussionCase): DiscussionSource[] {
  if (discussionCase.sources?.length) return discussionCase.sources;

  return (discussionCase.bibliography ?? "")
    .split(/\r?\n/)
    .map((citation) => citation.trim())
    .filter(Boolean)
    .map((citation, index) => ({
      id: `bibliography-${index + 1}`,
      label: citation,
      url: "",
      note: "",
    }));
}

export type ScientificTextSegment = {
  text: string;
  script: "normal" | "subscript" | "superscript";
};

export function scientificTextSegments(value: string): ScientificTextSegment[] {
  const segments: ScientificTextSegment[] = [];
  const scriptPattern = /(_|\^)\{([^{}\r\n]+)\}/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = scriptPattern.exec(value)) !== null) {
    if (match.index > cursor) {
      segments.push({ text: value.slice(cursor, match.index), script: "normal" });
    }
    segments.push({
      text: match[2],
      script: match[1] === "_" ? "subscript" : "superscript",
    });
    cursor = match.index + match[0].length;
  }

  if (cursor < value.length) {
    segments.push({ text: value.slice(cursor), script: "normal" });
  }

  return segments;
}

function isHttpUrl(value: unknown): boolean {
  if (!hasText(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizedCase(discussionCase: DiscussionCase): DiscussionCase {
  const legacyScientific = discussionCase.articleUrl
    ? [
        {
          id: "legacy-article-evidence",
          title: "Sumber kasus pada format lama",
          content:
            discussionCase.articleNote ||
            discussionCase.question ||
            "Telaah sumber kasus yang disediakan guru.",
          sourceLabel: "Artikel kasus dari guru",
          sourceUrl: discussionCase.articleUrl,
        },
      ]
    : [];
  const legacySocioeconomic = discussionCase.articleUrl
    ? [
        {
          id: "legacy-decision-evidence",
          title: "Pertimbangan keputusan pada format lama",
          content:
            discussionCase.decisionPrompt ||
            "Pertimbangkan dampak keputusan bagi pihak yang terlibat.",
          sourceLabel: "Kasus dari guru",
          sourceUrl: discussionCase.articleUrl,
        },
      ]
    : [];
  return {
    ...discussionCase,
    schemaVersion: 2,
    narrative: discussionCase.narrative ?? discussionCase.articleNote ?? "",
    imageCaption:
      discussionCase.imageCaption ?? discussionCase.imageAttribution ?? "",
    phenomenonQuestion:
      discussionCase.phenomenonQuestion ?? discussionCase.question ?? "",
    problemGuide:
      discussionCase.problemGuide ??
      "Rangkai pertanyaanmu dari faktor kimia, risiko/dampak, dan pertimbangan pemangku kepentingan.",
    hypothesisPrompt:
      discussionCase.hypothesisPrompt ??
      "Tuliskan posisi atau dugaan awal beserta alasan yang merujuk rumusan masalahmu.",
    evidencePrompt:
      discussionCase.evidencePrompt ??
      "Pilih bukti yang relevan dan jelaskan alasan pemilihannya. Pada tahap ini belum perlu menilai hipotesis.",
    conclusionPrompt:
      discussionCase.conclusionPrompt ?? discussionCase.decisionPrompt ?? "",
    scaffolding: {
      problemHints: discussionCase.scaffolding?.problemHints ?? [],
      hypothesisHints: discussionCase.scaffolding?.hypothesisHints ?? [],
      evidenceHints: discussionCase.scaffolding?.evidenceHints ?? [],
      testingHints: discussionCase.scaffolding?.testingHints ?? [],
      conclusionHints: discussionCase.scaffolding?.conclusionHints ?? [],
    },
    otherStakeholderPrompt:
      discussionCase.otherStakeholderPrompt ??
      "Adakah pihak lain yang juga mempunyai kepentingan dalam kasus ini?",
    sources: normalizedSources(discussionCase),
    stakeholderPerspectives: discussionCase.stakeholderPerspectives ?? [],
    scientificEvidence:
      discussionCase.scientificEvidence?.length
        ? discussionCase.scientificEvidence
        : legacyScientific,
    socioeconomicEvidence:
      discussionCase.socioeconomicEvidence?.length
        ? discussionCase.socioeconomicEvidence
        : legacySocioeconomic,
  };
}

export function casePublishIssues(value: DiscussionCase): string[] {
  const c = normalizedCase(value);
  const issues: string[] = [];
  if (!hasText(c.title)) issues.push("judul kasus");
  if (!hasText(c.narrative)) issues.push("narasi orientasi");
  if (!isHttpUrl(c.imageUrl)) issues.push("URL foto yang valid");
  if (!hasText(c.imageCaption)) issues.push("caption foto");
  if (!c.sources?.length || c.sources.some((source) => !hasText(sourceCitation(source))))
    issues.push("sumber rujukan");
  if (!hasText(c.phenomenonQuestion)) issues.push("pertanyaan pemantik");
  if (
    !c.stakeholderPerspectives?.length ||
    c.stakeholderPerspectives.some(
      (p) => !hasText(p.stakeholder) || !hasText(p.argument)
    )
  )
    issues.push("contoh perspektif pemangku kepentingan");
  if (!hasText(c.otherStakeholderPrompt)) issues.push("pemantik pihak lain");
  if (!hasText(c.problemGuide)) issues.push("panduan rumusan masalah");
  if (!hasText(c.hypothesisPrompt)) issues.push("panduan hipotesis");
  if (!c.scientificEvidence?.length) issues.push("data ilmiah");
  if (!c.socioeconomicEvidence?.length) issues.push("data sosial-ekonomi");
  const allEvidence = [
    ...(c.scientificEvidence ?? []),
    ...(c.socioeconomicEvidence ?? []),
  ];
  if (
    allEvidence.some(
      (item) =>
        !hasText(item.title) ||
        !hasText(item.content) ||
        !hasText(item.sourceLabel) ||
        !isHttpUrl(item.sourceUrl)
    )
  )
    issues.push("judul, isi, dan sumber setiap bukti");
  if (
    allEvidence.some(
      (item) =>
        Boolean(item.chartPoints?.length) &&
        (!hasText(item.chartTitle) ||
          item.chartPoints!.some(
            (point) => !hasText(point.label) || !Number.isFinite(point.value)
          ))
    )
  )
    issues.push("judul dan titik data grafik");
  if (!hasText(c.evidencePrompt)) issues.push("panduan pemilihan bukti");
  if (!hasText(c.conclusionPrompt) && !hasText(c.decisionPrompt))
    issues.push("prompt keputusan");
  if (c.allowPeerReviewException && !hasText(c.peerReviewExceptionNote))
    issues.push("alasan pengecualian ulasan teman");
  return Array.from(new Set(issues));
}

export function problemQuestionFromParts(
  value: Module5CaseResponse["problem"]
): string {
  const chemicalFactor = value?.chemicalFactor?.trim() || "......";
  const impactRisk = value?.impactRisk?.trim() || "......";
  const stakeholderConsideration =
    value?.stakeholderConsideration?.trim() || "......";

  return `Bagaimana pengaruh ${chemicalFactor} terhadap ${impactRisk}, dibandingkan dengan ${stakeholderConsideration}?`;
}

export function problemValidationIssues(
  response: Module5CaseResponse
): string[] {
  const value = response.problem;
  if (!value) {
    return [
      "Sisi ilmiah belum diisi.",
      "Sisi sosial-ekonomi atau perspektif lain belum diisi.",
    ];
  }

  const issues: string[] = [];
  if (!hasText(value.chemicalFactor)) {
    issues.push("Tuliskan faktor kimia dari kasus sebagai sisi ilmiah.");
  }
  if (!hasText(value.impactRisk)) {
    issues.push("Tuliskan risiko atau dampak yang berkaitan dengan faktor kimia.");
  }
  if (!hasText(value.stakeholderConsideration)) {
    issues.push(
      "Tuliskan beban sosial-ekonomi atau perspektif pihak lain yang kamu pilih sendiri."
    );
  }
  if (!hasText(value.question)) {
    issues.push("Rumusan pertanyaan penelitian belum terbentuk.");
  }

  // Responses completed under the former four-field flow remain valid.
  if (value.completedAt && issues.length === 0) return [];

  if (hasText(value.question)) {
    const question = value.question.toLocaleLowerCase("id-ID");
    if (
      hasText(value.chemicalFactor) &&
      !question.includes(value.chemicalFactor.trim().toLocaleLowerCase("id-ID"))
    ) {
      issues.push("Pertanyaan belum memuat faktor kimia secara eksplisit.");
    }
    if (
      hasText(value.impactRisk) &&
      !question.includes(value.impactRisk.trim().toLocaleLowerCase("id-ID"))
    ) {
      issues.push("Pertanyaan belum memuat risiko atau dampak secara eksplisit.");
    }
    if (
      hasText(value.stakeholderConsideration) &&
      !question.includes(
        value.stakeholderConsideration.trim().toLocaleLowerCase("id-ID")
      )
    ) {
      issues.push(
        "Pertanyaan belum memuat sisi sosial-ekonomi atau perspektif lain secara eksplisit."
      );
    }
  }

  return issues;
}

export function problemComplete(response: Module5CaseResponse): boolean {
  return problemValidationIssues(response).length === 0;
}

export function hypothesisDraftText(response: Module5CaseResponse): string {
  const position = response.hypothesis?.position ?? "";
  const reason = response.hypothesis?.reason ?? "";
  if (position && reason) return `${position}\n\nAlasan: ${reason}`;
  return position || reason;
}

export function hypothesisResponseText(response: Module5CaseResponse): string {
  return hypothesisDraftText(response).trim();
}

export function hypothesisComplete(response: Module5CaseResponse): boolean {
  return hasText(hypothesisResponseText(response));
}

function hasMinimumDetail(value: unknown, minimumCharacters: number): boolean {
  return hasText(value) && value.trim().length >= minimumCharacters;
}

export function looksLikePlaceholderText(value: unknown): boolean {
  if (!hasText(value)) return false;
  const text = value.trim().toLocaleLowerCase("id-ID");
  const letters = text.match(/[a-z]/g)?.join("") ?? "";
  if (letters.length < 8) return false;

  const hasLongRepeatedCharacter = /(.)\1{4,}/.test(letters);
  const hasRepeatedShortPattern = /(.{1,3})\1{3,}/.test(letters);
  const uniqueLetterRatio = new Set(letters).size / letters.length;
  const isLongSingleToken = !/\s/.test(text) && letters.length >= 20;

  return (
    hasLongRepeatedCharacter ||
    hasRepeatedShortPattern ||
    (isLongSingleToken && uniqueLetterRatio < 0.35)
  );
}

const REASONING_CUE = /\b(karena|sebab|sehingga|akibat|didasarkan|berdasarkan)\b/i;
const EVIDENCE_CUE =
  /\b(data|bukti|grafik|angka|hasil|sumber|menunjukkan|berdasarkan|temuan)\b/i;

/**
 * Advisory checks for Module 5. These only identify parts worth revisiting;
 * they never decide whether the student's reasoning is scientifically correct.
 */
export function discussionScaffoldWarnings(
  stage: DiscussionScaffoldStage,
  response: Module5CaseResponse
): string[] {
  const warnings: string[] = [];

  if (stage === "problem") {
    const value = response.problem;
    if (
      !hasMinimumDetail(value?.chemicalFactor, 5) ||
      !hasMinimumDetail(value?.impactRisk, 5) ||
      !hasMinimumDetail(value?.stakeholderConsideration, 5)
    ) {
      warnings.push(
        "Salah satu bagian rumusan masalah masih sangat singkat. Pertimbangkan untuk memperjelasnya."
      );
    }
  }

  if (stage === "hypothesis") {
    const answer = hypothesisResponseText(response);
    if (!hasMinimumDetail(answer, 25)) {
      warnings.push(
        "Hipotesis masih sangat singkat. Pertimbangkan untuk memperjelas dugaan dan alasannya."
      );
    }
    if (hasText(answer) && !REASONING_CUE.test(answer)) {
      warnings.push(
        "Alasan belum tampak eksplisit. Kamu dapat menggunakan penghubung seperti “karena” atau “berdasarkan”."
      );
    }
  }

  if (stage === "evidence") {
    if (!hasMinimumDetail(response.evidence?.selectionReason, 20)) {
      warnings.push(
        "Alasan pemilihan bukti masih singkat. Pertimbangkan untuk menjelaskan kaitannya dengan rumusan masalah."
      );
    }
    const evidenceTexts = [
      response.evidence?.selectionReason,
      ...(response.evidence?.ownEvidence ?? []).flatMap((item) => [
        item.content,
        item.selectionReason,
      ]),
    ];
    if (evidenceTexts.some(looksLikePlaceholderText)) {
      warnings.push(
        "Isian bukti tampak mengandung karakter atau pola yang berulang. Tuliskan alasan atau informasi bukti dengan kata-katamu sendiri."
      );
    }
  }

  if (stage === "testing") {
    const argument = response.testing?.argument ?? "";
    if (!hasMinimumDetail(argument, 30)) {
      warnings.push(
        "Argumen masih singkat. Pertimbangkan untuk menjelaskan hubungan hipotesis dengan bukti."
      );
    }
    if (hasText(argument) && !EVIDENCE_CUE.test(argument)) {
      warnings.push(
        "Argumen belum merujuk data atau bukti secara eksplisit."
      );
    }
  }

  if (stage === "conclusion") {
    const value = response.conclusion;
    if (!hasMinimumDetail(value?.problemAnswer, 15)) {
      warnings.push("Jawaban rumusan masalah masih sangat singkat.");
    }
    if (!hasMinimumDetail(value?.policySolution, 15)) {
      warnings.push("Solusi atau kebijakan masih sangat singkat.");
    }
    if (!hasMinimumDetail(value?.evidenceBasis, 20)) {
      warnings.push("Dasar bukti masih sangat singkat.");
    } else if (!EVIDENCE_CUE.test(value?.evidenceBasis ?? "")) {
      warnings.push(
        "Dasar keputusan belum menyebut data, bukti, sumber, atau temuan secara eksplisit."
      );
    }
  }

  return warnings;
}

export function discussionScaffoldHint(
  discussionCase: DiscussionCase,
  stage: DiscussionScaffoldStage,
  attempt: number
): string {
  const key = DISCUSSION_SCAFFOLD_HINT_KEYS[stage];
  const customHints = (discussionCase.scaffolding?.[key] ?? []).filter(hasText);
  const hints = customHints.length
    ? customHints
    : DEFAULT_DISCUSSION_SCAFFOLD_HINTS[stage];
  return hints[Math.min(Math.max(attempt - 1, 0), hints.length - 1)];
}

export function evidenceComplete(response: Module5CaseResponse): boolean {
  const value = response.evidence;
  if (!value || !hasText(value.selectionReason)) return false;
  const own = value.ownEvidence ?? [];
  const hasScientific =
    Boolean(value.selectedScientificIds?.length) ||
    own.some(
      (item) =>
        item.category === "scientific" &&
        hasText(item.content) &&
        hasText(item.source) &&
        hasText(item.selectionReason)
    );
  const hasSocioeconomic =
    Boolean(value.selectedSocioeconomicIds?.length) ||
    own.some(
      (item) =>
        item.category === "socioeconomic" &&
        hasText(item.content) &&
        hasText(item.source) &&
        hasText(item.selectionReason)
    );
  return hasScientific && hasSocioeconomic;
}

export function distinctPeerReviewCount(
  reviews: Record<string, ForumPeerReview> | undefined
): number {
  return new Set(
    Object.values(reviews ?? {})
      .filter(
        (review) =>
          hasText(review.differenceReason) &&
          hasText(review.response) &&
          review.targetStudentId !== review.reviewerId
      )
      .map((review) => review.targetStudentId)
  ).size;
}

export function peerReviewComplete(
  response: Module5CaseResponse,
  discussionCase: DiscussionCase
): boolean {
  return (
    distinctPeerReviewCount(response.peerReviews) >= REQUIRED_PEER_REVIEWS ||
    Boolean(
      discussionCase.allowPeerReviewException &&
        hasText(discussionCase.peerReviewExceptionNote) &&
        response.peerExceptionUsedAt
    )
  );
}

export function conclusionComplete(response: Module5CaseResponse): boolean {
  const value = response.conclusion;
  return Boolean(
    value?.submittedAt &&
      hasText(value.problemAnswer) &&
      hasText(value.policySolution) &&
      hasText(value.evidenceBasis)
  );
}

export function caseCompleted(response: Module5CaseResponse | undefined): boolean {
  return Boolean(response?.conclusion?.submittedAt || response?.decisionSubmittedAt);
}

export function forumPostLabel(post: ForumPost | ForumArgument): string {
  return post.format === "hypothesis_argument"
    ? post.verdict === "supported"
      ? "Hipotesis didukung"
      : "Hipotesis tidak didukung"
    : "Post CER lama";
}

export function forumPostBody(post: ForumPost | ForumArgument): string {
  if (post.format === "hypothesis_argument") return post.argument;
  return [
    post.claim ? `Claim: ${post.claim}` : "",
    post.evidence ? `Evidence: ${post.evidence}` : "",
    post.reasoning ? `Reasoning: ${post.reasoning}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
