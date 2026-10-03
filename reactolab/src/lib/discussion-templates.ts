import type { DiscussionCase } from "./types";

type DraftTemplate = Omit<
  DiscussionCase,
  "id" | "createdAt" | "updatedAt" | "published" | "order"
> & { templateId: string; templateLabel: string };

export type DefaultDiscussionCase = DiscussionCase & {
  id: string;
  defaultKey: string;
};

const IMPERIAL_SUGAR_IMAGE =
  "https://media.npr.org/assets/blogs/thetwo-way/images/2009/09/imperial-sugar-89b741180e9c4446d179d3739f4ee54e8d04b759.jpg?s=1200&c=85&f=webp";
const PUPUK_KALTIM_IMAGE =
  "https://eksposkaltim.com/images/img_blog/91simulasi.jpg";

const sugarSources = [
  {
    id: "csb-investigation",
    label:
      "U.S. Chemical Safety and Hazard Investigation Board, “Imperial Sugar Company Dust Explosion and Fire,” 2009",
    url: "https://www.csb.gov/imperial-sugar-company-dust-explosion-and-fire/",
    note: "Sumber primer kronologi, korban, penyebab, dan rekomendasi.",
  },
  {
    id: "csb-report",
    label:
      "U.S. Chemical Safety and Hazard Investigation Board, “Investigation Report: Sugar Dust Explosion and Fire,” Sep. 2009",
    url: "https://www.csb.gov/assets/1/20/imperial_sugar_report_final_updated.pdf?13902=",
    note: "Laporan final September 2009.",
  },
  {
    id: "sugar-dust-literature",
    label:
      "Büschgens and Pikhard, “Assessment of Dust Explosions in the Sugar Industry,” 2017",
    url: "https://www.rhewum.com/downloadFile/RG93bmxvYWQvUkhFV1VNX0R1c3RfZXhwbG9zaW9uc19pbl90aGVfc3VnYXJfaW5kdXN0cnktNWY5YWJkZmRjZmRlOS5wZGY=",
    note: "Angka 60 dan 750 g/m³ adalah angka literatur, bukan hasil pengukuran insiden Imperial Sugar.",
  },
  {
    id: "npr-imperial-photo",
    label: "NPR, “Imperial Sugar Factory Explosion,” 2009",
    url: "https://www.npr.org/sections/thetwo-way/2009/09/imperial_sugar_factory_explosi.html",
    note: "Sumber gambar kondisi pabrik pascaledakan.",
  },
];

export const DISCUSSION_CASE_TEMPLATES: DraftTemplate[] = [
  {
    templateId: "imperial-sugar",
    templateLabel: "Ledakan Debu Imperial Sugar",
    schemaVersion: 2,
    title: "Ledakan Debu di Pabrik Gula",
    narrative:
      "Debu atau serbuk halus dari bahan organik dapat menjadi bahaya ledakan serius di lingkungan industri. Gula, tepung, atau serbuk kayu yang relatif aman dalam bentuk padat dapat mudah meledak ketika menjadi partikel halus yang tersebar di udara.\n\nPada 7 Februari 2008 terjadi rangkaian ledakan debu gula dan kebakaran di fasilitas Imperial Sugar Company, Port Wentworth, Georgia, Amerika Serikat. Investigasi U.S. Chemical Safety and Hazard Investigation Board (CSB) menyimpulkan ledakan awal terjadi di konveyor sabuk baja tertutup di bawah silo. Akumulasi debu kemudian memicu ledakan sekunder di area lain, menewaskan 14 pekerja dan melukai 36 orang.\n\nPembakaran sukrosa mengikuti reaksi C_{12}H_{22}O_{11}(s) + 12O_{2}(g) → 12CO_{2}(g) + 11H_{2}O(g) + energi panas. Reaksi berlangsung lambat pada bongkahan gula, tetapi debu halus memiliki luas permukaan total yang jauh lebih besar. Saat tersebar di udara, kontak partikel dengan oksigen menjadi lebih intensif sehingga reaksi dapat berlangsung sangat cepat.\n\nLiteratur mencatat partikel berukuran 0,063 mm memerlukan konsentrasi minimum sekitar 60 g/m^{3}, sedangkan partikel 0,4 mm memerlukan sekitar 750 g/m^{3}. Semakin kecil ukuran partikel, semakin sedikit debu yang diperlukan untuk mencapai ambang ledakan. Angka tersebut adalah angka literatur debu gula, bukan pengukuran konsentrasi saat insiden.\n\nCSB juga menemukan pelepasan dan akumulasi gula dari peralatan pengumpul debu, konveyor, serta peralatan penanganan yang tidak dirancang dan dipelihara secara memadai. Dalam ruang tertutup, konsentrasi debu dapat meningkat hingga memasuki rentang eksplosif dan ledakan awal dapat mengangkat endapan lain menjadi ledakan sekunder.",
    imageUrl: IMPERIAL_SUGAR_IMAGE,
    imageCaption: "Gambar 1. Kondisi pabrik Imperial Sugar pascaledakan.",
    sources: sugarSources,
    phenomenonQuestion: "Mengapa debu gula dapat memicu ledakan sebesar itu?",
    stakeholderPerspectives: [
      {
        id: "industry",
        stakeholder: "Industri/produsen (contoh perspektif)",
        argument:
          "Investasi pengendalian debu menambah biaya operasi dan perlu direncanakan agar produksi serta pekerjaan tetap berkelanjutan.",
      },
      {
        id: "workers",
        stakeholder: "Pekerja pabrik (contoh perspektif)",
        argument:
          "Keselamatan, pelatihan, pembersihan rutin, dan peringatan dini harus menjadi prioritas karena pekerja terpapar risiko harian.",
      },
      {
        id: "regulator",
        stakeholder: "Regulator (contoh perspektif)",
        argument:
          "Standar pengendalian debu dan kepatuhan perlu ditegakkan untuk mencegah korban berulang.",
      },
    ],
    otherStakeholderPrompt:
      "Menurutmu, adakah pihak lain yang juga mempunyai kepentingan dalam kasus ini? Jelaskan singkat.",
    problemGuide:
      "Rangkai pertanyaan dari faktor kimia (misalnya ukuran partikel, luas permukaan, atau konsentrasi), risiko/dampak ledakan, dan pertimbangan sosial-ekonomi atau pihak lain yang kamu pilih.",
    hypothesisPrompt:
      "Tuliskan dugaan atau posisi awal yang menjawab rumusan masalahmu, lalu jelaskan alasan awalmu.",
    scientificEvidence: [
      {
        id: "particle-threshold",
        title: "Ukuran partikel dan konsentrasi minimum literatur",
        content:
          "Literatur menyebut sekurang-kurangnya 60 g/m³ untuk partikel 0,063 mm dan 750 g/m³ untuk partikel 0,4 mm. Ini bukan pengukuran pada insiden Imperial Sugar.",
        sourceLabel: "Büschgens & Pikhard (2017)",
        sourceUrl: sugarSources[2].url,
        chartTitle: "Perbandingan angka literatur debu gula",
        chartXAxisTitle: "Ukuran partikel",
        chartYAxisTitle: "Konsentrasi minimum (g/m³)",
        chartPoints: [
          { label: "0,063 mm", value: 60, unit: "g/m³" },
          { label: "0,4 mm", value: 750, unit: "g/m³" },
        ],
      },
      {
        id: "csb-enclosure",
        title: "Konveyor tertutup dan ledakan sekunder",
        content:
          "CSB menemukan debu mencapai konsentrasi eksplosif di konveyor tertutup; ledakan awal mengangkat endapan lain dan memicu ledakan sekunder.",
        sourceLabel: "CSB Final Investigation Report",
        sourceUrl: sugarSources[1].url,
      },
      {
        id: "housekeeping-criterion",
        title: "Kriteria bahaya akumulasi lapisan debu",
        content:
          "Lapisan debu setebal 1/32 inci yang menutupi sekitar 5% luas permukaan diperlakukan sebagai kriteria bahaya pembersihan. Angka 5% bukan konsentrasi ledakan dan bukan jaminan bahwa ledakan pasti terjadi.",
        sourceLabel: "CSB/NFPA combustible-dust guidance",
        sourceUrl:
          "https://www.csb.gov/csb-chairman-john-bresland-calls-on-osha-to-adopt-csb-recommendation-on-comprehensive-combustible-dust-standard-says-imperial-sugar-explosion-shows-urgency-for-action-is-greater-than-ever/",
      },
    ],
    socioeconomicEvidence: [
      {
        id: "worker-impact",
        title: "Dampak terhadap pekerja",
        content: "CSB mencatat 14 pekerja meninggal dan 36 pekerja terluka.",
        sourceLabel: "CSB Final Investigation Report",
        sourceUrl: sugarSources[1].url,
      },
      {
        id: "prevention-investment",
        title: "Pertimbangan biaya dan pencegahan",
        content:
          "Pengendalian debu, pemeliharaan, pelatihan, dan evakuasi memerlukan investasi, sedangkan kegagalan pengendalian membawa risiko korban dan gangguan operasi.",
        sourceLabel: "CSB recommendations",
        sourceUrl: sugarSources[0].url,
      },
    ],
    evidencePrompt:
      "Pilih sekurang-kurangnya satu bukti ilmiah dan satu bukti sosial-ekonomi, atau tambahkan bukti sendiri beserta asal dan alasan pemilihannya. Belum perlu memutuskan apakah hipotesismu didukung.",
    conclusionPrompt:
      "Berdasarkan pemahaman tentang luas permukaan dan konsentrasi debu, solusi atau kebijakan apa yang kamu usulkan untuk mengurangi risiko ledakan debu di industri gula?",
    scaffolding: {
      problemHints: [
        "Perhatikan hubungan ukuran partikel atau luas permukaan dengan risiko ledakan.",
        "Tambahkan pertimbangan pihak yang terdampak, misalnya pekerja, industri, regulator, konsumen, atau pihak lain menurut penalaranmu.",
      ],
      hypothesisHints: [
        "Nyatakan dugaanmu tentang perubahan risiko saat partikel gula menjadi lebih halus.",
        "Sertakan alasan awal yang menghubungkan luas permukaan, kontak dengan oksigen, dan pertimbangan pemangku kepentingan.",
      ],
      evidenceHints: [
        "Bandingkan data ukuran partikel 0,063 mm dan 0,4 mm beserta konsentrasi minimumnya.",
        "Pilih juga bukti sosial-ekonomi yang relevan dengan rumusan masalahmu.",
      ],
      testingHints: [
        "Jelaskan apakah data yang dipilih mendukung atau tidak mendukung hipotesismu.",
        "Hubungkan angka pada data dengan teori luas permukaan dan laju reaksi.",
      ],
      conclusionHints: [
        "Jawab kembali rumusan masalahmu menggunakan bukti konkret dari kasus atau forum.",
        "Usulkan solusi yang menyeimbangkan pengendalian debu, keselamatan, dan konsekuensi bagi pihak terkait.",
      ],
    },
    articleUrl: sugarSources[0].url,
    articleNote: "",
    question: "Mengapa debu gula dapat memicu ledakan sebesar itu?",
    decisionPrompt:
      "Usulkan solusi atau kebijakan untuk mengurangi risiko ledakan debu berdasarkan bukti yang kamu pilih.",
  },
  {
    templateId: "pupuk-kaltim",
    templateLabel: "Kebocoran Amonia Pupuk Kaltim",
    schemaVersion: 2,
    title: "Kondisi Reaksi Ekstrem – Kebocoran Gas Amonia pada Produksi Pupuk",
    narrative:
      "Reaksi kimia industri berskala besar sering membutuhkan kondisi operasi yang dirancang secara presisi agar laju reaksinya memadai bagi kebutuhan produksi. Di sisi lain, kondisi tersebut menuntut peralatan dan material penyekat bekerja secara andal.\n\nPada 29 November 2016 terjadi kebocoran amonia di Amoniak Pabrik 2 PT Pupuk Kalimantan Timur, Bontang. Laporan perusahaan menyebut gasket pada flange 10 inci di bagian atas peralatan Top 120-C pecah. Tiga pekerja menjadi korban; dua mengalami sesak napas dan seorang pekerja meninggal setelah jatuh dari ketinggian saat menyelamatkan diri. Perusahaan menghentikan operasi pabrik dan mengevakuasi area sekitar.\n\nAmonia (NH_{3}) diproduksi melalui proses Haber–Bosch: N_{2}(g) + 3H_{2}(g) → 2NH_{3}(g). Ikatan rangkap tiga N≡N sangat kuat sehingga proses industri umumnya menggunakan suhu sekitar 400–500 °C, tekanan 150–350 atm, dan katalis besi (Fe). Permukaan katalis membantu nitrogen dan hidrogen bereaksi dengan jalur yang lebih mudah. Kondisi umum proses tersebut bukan data pengukuran pada lokasi kebocoran.\n\nPemeliharaan komponen seperti gasket dan sambungan pipa penting untuk menjaga keamanan proses. Penelitian Pratiwi membahas jadwal pemeliharaan dan keausan penggunaan terus-menerus sebagai faktor potensial kecelakaan kebocoran amonia di perusahaan secara umum; sumber itu tidak menetapkan penyebab keausan gasket pada insiden ini.",
    imageUrl: PUPUK_KALTIM_IMAGE,
    imageCaption: "Gambar 2. Penanganan di lokasi kebocoran gas amonia.",
    sources: [
      {
        id: "pkt-report",
        label:
          "PT Pupuk Kalimantan Timur, “Kecelakaan Industri Pupuk Kaltim Telan Korban Jiwa,” Nov. 29, 2016",
        url: "https://pupukkaltim.com/id/r/kecelakaan-industri-pupuk-kaltim-telan-korban-jiwa",
        note: "Sumber laporan tanggal, lokasi, gasket pecah, dan korban.",
      },
      {
        id: "unair-study",
        label:
          "Pratiwi, “Kecelakaan Kerja Akibat Kebocoran Amonia di PT Pupuk Kalimantan Timur,” Universitas Airlangga, 2017",
        url: "https://repository.unair.ac.id/62091/",
        note: "Sumber faktor potensial kebocoran amonia secara umum, bukan penetapan sebab gasket pada insiden.",
      },
      {
        id: "ekspos-kaltim-photo",
        label:
          "Ekspos Kaltim, “Kecelakaan Industri Pupuk Kaltim Telan Korban Jiwa,” 2016",
        url: "https://eksposkaltim.com/berita-2849-kecelakaan-industri-pupuk-kaltim-telan-korban-jiwa.html",
        note: "Sumber gambar penanganan di lokasi kebocoran gas amonia.",
      },
      {
        id: "haber-bosch-reference",
        label: "Encyclopaedia Britannica, “Haber-Bosch Process”",
        url: "https://www.britannica.com/technology/Haber-Bosch-process",
        note: "Rujukan konteks umum proses sintesis amonia.",
      },
    ],
    phenomenonQuestion: "Mengapa pembentukan amonia memerlukan kondisi operasi yang ekstrem?",
    stakeholderPerspectives: [
      {
        id: "company",
        stakeholder: "Perusahaan pupuk (contoh perspektif)",
        argument:
          "Produksi perlu menjaga laju dan pasokan pupuk, sambil merencanakan penghentian serta pemeliharaan dengan aman.",
      },
      {
        id: "community",
        stakeholder: "Pekerja dan masyarakat (contoh perspektif)",
        argument:
          "Mereka memerlukan perlindungan dari paparan, informasi dini, pemeliharaan ketat, dan jalur evakuasi yang jelas.",
      },
      {
        id: "regulator",
        stakeholder: "Pemerintah/regulator (contoh perspektif)",
        argument:
          "Jadwal pemeliharaan preventif dan standar operasi perlu diverifikasi serta ditegakkan.",
      },
    ],
    otherStakeholderPrompt:
      "Menurutmu, adakah pihak lain yang juga mempunyai kepentingan dalam kasus ini? Jelaskan singkat.",
    problemGuide:
      "Rangkai pertanyaan dari faktor kimia proses amonia, risiko/dampak, dan pertimbangan sosial-ekonomi atau pihak lain yang kamu pilih.",
    hypothesisPrompt:
      "Tuliskan dugaan atau posisi awal yang menjawab rumusan masalahmu, lalu jelaskan alasan awalmu.",
    scientificEvidence: [
      {
        id: "haber-bosch-general",
        title: "Kondisi umum proses Haber–Bosch",
        content:
          "Bahan ajar umumnya membahas kisaran suhu 400–500 °C, tekanan 150–350 atm, dan katalis besi. Ini adalah konteks umum proses, bukan pengukuran kondisi insiden.",
        sourceLabel: "Konteks pembelajaran Haber–Bosch pada storyboard",
        sourceUrl: "https://www.britannica.com/technology/Haber-Bosch-process",
      },
      {
        id: "reported-gasket",
        title: "Fakta yang dilaporkan pada insiden",
        content:
          "Laporan perusahaan menyebut gasket flange 10 inci di bagian atas Top 120-C pecah pada 29 November 2016.",
        sourceLabel: "PT Pupuk Kalimantan Timur",
        sourceUrl:
          "https://pupukkaltim.com/id/r/kecelakaan-industri-pupuk-kaltim-telan-korban-jiwa",
      },
      {
        id: "potential-factors",
        title: "Faktor potensial dari penelitian",
        content:
          "Pratiwi melaporkan jadwal pemeliharaan kurang memadai dan keausan penggunaan terus-menerus sebagai faktor potensial kecelakaan kebocoran amonia secara umum. Temuan ini tidak membuktikan sebab gasket pada insiden tertentu.",
        sourceLabel: "Pratiwi (2017), Universitas Airlangga",
        sourceUrl: "https://repository.unair.ac.id/62091/",
      },
    ],
    socioeconomicEvidence: [
      {
        id: "victims-response",
        title: "Korban dan penghentian operasi",
        content:
          "Tiga pekerja menjadi korban; pabrik Amoniak 2 dinonaktifkan dan area dikosongkan saat penanggulangan.",
        sourceLabel: "PT Pupuk Kalimantan Timur",
        sourceUrl:
          "https://pupukkaltim.com/id/r/kecelakaan-industri-pupuk-kaltim-telan-korban-jiwa",
      },
      {
        id: "maintenance-warning",
        title: "Pemeliharaan dan sistem peringatan",
        content:
          "Penelitian merekomendasikan penjadwalan pemeliharaan yang baik dan integrasi sistem peringatan kebocoran.",
        sourceLabel: "Pratiwi (2017), Universitas Airlangga",
        sourceUrl: "https://repository.unair.ac.id/62091/",
      },
    ],
    evidencePrompt:
      "Pilih sekurang-kurangnya satu bukti ilmiah dan satu bukti sosial-ekonomi, atau tambahkan bukti sendiri beserta asal dan alasan pemilihannya. Bedakan fakta insiden, kondisi umum proses, dan faktor potensial penelitian.",
    conclusionPrompt:
      "Berdasarkan pemahaman ilmiah tentang kondisi pembentukan amonia, solusi atau kebijakan apa yang kamu usulkan untuk mencegah kecelakaan serupa di industri pupuk?",
    scaffolding: {
      problemHints: [
        "Perhatikan peran suhu, tekanan, atau katalis pada proses pembentukan amonia.",
        "Bandingkan dampak ilmiahnya dengan beban atau kepentingan pihak yang menurutmu relevan.",
      ],
      hypothesisHints: [
        "Nyatakan dugaanmu tentang alasan proses Haber-Bosch memerlukan kondisi operasi tertentu.",
        "Sertakan alasan awal serta konsekuensinya bagi keselamatan atau keberlanjutan produksi.",
      ],
      evidenceHints: [
        "Bedakan kondisi umum proses, fakta insiden, dan faktor potensial dari penelitian.",
        "Pilih juga bukti sosial-ekonomi yang benar-benar membantu menguji hipotesismu.",
      ],
      testingHints: [
        "Hubungkan bukti pilihanmu dengan teori suhu, energi aktivasi, dan katalis.",
        "Jelaskan mengapa bukti tersebut mendukung atau tidak mendukung hipotesismu.",
      ],
      conclusionHints: [
        "Jawab kembali rumusan masalahmu menggunakan fakta konkret dari kasus atau forum.",
        "Usulkan kebijakan yang mempertimbangkan keselamatan, pemeliharaan peralatan, dan kebutuhan produksi.",
      ],
    },
    articleUrl:
      "https://pupukkaltim.com/id/r/kecelakaan-industri-pupuk-kaltim-telan-korban-jiwa",
    articleNote: "",
    question: "Mengapa pembentukan amonia memerlukan kondisi operasi yang ekstrem?",
    decisionPrompt:
      "Usulkan solusi atau kebijakan untuk mencegah kecelakaan serupa berdasarkan bukti yang kamu pilih.",
  },
];

export function templateCase(templateId: string): DraftTemplate | undefined {
  return DISCUSSION_CASE_TEMPLATES.find((item) => item.templateId === templateId);
}

/**
 * Returns fresh objects so Firebase/editor mutations never modify the bundled
 * definitions. IDs are deterministic to make seeding idempotent per class.
 */
export function defaultDiscussionCases(): DefaultDiscussionCase[] {
  return DISCUSSION_CASE_TEMPLATES.map((template, index) => {
    const { templateId, templateLabel: _templateLabel, ...caseValue } = template;
    return {
      ...JSON.parse(JSON.stringify(caseValue)),
      id: `default-${templateId}`,
      defaultKey: templateId,
      published: true,
      order: index + 1,
      createdAt: index + 1,
    } as DefaultDiscussionCase;
  });
}

const DEFAULT_CASE_TITLE_ALIASES: Record<string, string[]> = {
  "imperial-sugar": ["Ledakan Debu di Pabrik Gula"],
  "pupuk-kaltim": [
    "Kebocoran Amonia pada Produksi Pupuk",
    "Kondisi Reaksi Ekstrem – Kebocoran Gas Amonia pada Produksi Pupuk",
  ],
};

/** Do not duplicate a default that was seeded earlier or made from its template. */
export function missingDefaultDiscussionCases(
  existing: Record<string, DiscussionCase> | null | undefined
): DefaultDiscussionCase[] {
  const values = Object.entries(existing ?? {});
  return defaultDiscussionCases().filter(
    (defaultCase) =>
      !values.some(
        ([id, value]) =>
          id === defaultCase.id ||
          value.defaultKey === defaultCase.defaultKey ||
          (!value.defaultKey &&
            value.published &&
            (DEFAULT_CASE_TITLE_ALIASES[defaultCase.defaultKey] ?? []).includes(
              value.title.trim()
            ))
      )
  );
}
