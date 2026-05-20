import type { RelevanceResult, RelevanceStatus, ScoringRule } from "@/types/news";

// ============ SCORING RULES ============
export const scoringRules: ScoringRule[] = [
  // OFFICE KEYWORDS - High relevance direct mention
  {
    id: "office_direct",
    name: "Menyebut Kantor Langsung",
    keywords: [
      "bea cukai pangkalpinang",
      "bc pangkalpinang",
      "beacukai pangkalpinang",
      "bea cukai papin",
      "beacukaipapin",
      "kppbc pangkalpinang",
      "kantor bea cukai pangkalpinang",
      "bea cukai bangka",
      "bea cukai babel",
      "bea cukai tmp c pangkalpinang",
      "kppbc tmp c pangkalpinang",
    ],
    score: 50,
    category: "office",
  },
  // BANGKA LOCATIONS
  {
    id: "location_bangka",
    name: "Wilayah Pulau Bangka",
    keywords: [
      "pangkalpinang",
      "bangka",
      "sungailiat",
      "belinyu",
      "muntok",
      "bangka barat",
      "bangka tengah",
      "bangka selatan",
      "merawang",
      "puding besar",
      "pemali",
      "tua tunu",
      "air itam",
      "pangkalbalam",
      "pelabuhan pangkalbalam",
      "pelabuhan muntok",
      "pelabuhan belinyu",
      "toboali",
      "koba",
      "lumut",
      "sungai selan",
      "lubuk besar",
    ],
    score: 25,
    category: "location",
  },
  // CUSTOMS ISSUES
  {
    id: "issue_rokok",
    name: "Isu Rokok Ilegal",
    keywords: [
      "rokok ilegal",
      "rokok tanpa pita cukai",
      "rokok polos",
      "cukai ilegal",
      "pita cukai palsu",
      "hasil tembakau ilegal",
      "gudang rokok ilegal",
      "peredaran rokok ilegal",
      "rokok tanpa cukai",
      "rokok illegal",
      "rokok selundupan",
    ],
    score: 30,
    category: "issue",
  },
  {
    id: "issue_ekspor_impor",
    name: "Ekspor/Impor",
    keywords: [
      "ekspor",
      "impor",
      "komoditas ekspor",
      "barang kiriman",
      "kontainer",
      "kepabeanan",
      "penyelundupan",
      "penindakan",
      "pengawasan",
      "timah",
      "pasir timah",
      "balok timah",
      "sawit",
      "cangkang sawit",
      "lidi nipah",
      "lada",
      "umkm ekspor",
      "pelabuhan",
    ],
    score: 20,
    category: "issue",
  },
  // SENSITIVE WORDS - Reputation risk
  {
    id: "sensitive_reputation",
    name: "Isu Reputasi Sensitif",
    keywords: [
      "oknum bea cukai",
      "oknum",
      "pungli",
      "intimidasi",
      "wartawan",
      "demo",
      "demonstrasi",
      "tuntutan",
      "lemah pengawasan",
      "pembiaran",
      "diduga",
      "mafia",
      "backing",
      "koordinasi dengan oknum",
      "aph tidak tegas",
      "penyalahgunaan wewenang",
      "viral",
      "laporan masyarakat",
      "dugaan",
      "kesalahan prosedur",
      "indikasi",
    ],
    score: 30,
    category: "sensitive",
  },
  // PENALTIES
  {
    id: "penalty_national",
    name: "Berita Nasional Tanpa Lokasi",
    keywords: [
      "jakarta",
      "surabaya",
      "bandung",
      "medan",
      "makassar",
      "semarang",
      "yogyakarta",
      "denpasar",
      "palembang",
      "balikpapan",
      "manado",
      "ambon",
      "jayapura",
      "tanjung perak",
      "tanjung priok",
      "belawan",
      "soekarno hatta",
      "batam",
      "tanjung pinang",
      "bintan",
      "riau",
      "sumatera selatan",
      "lampung",
      "jawa barat",
      "jawa timur",
      "jawa tengah",
      "bali",
      "ntt",
      "ntb",
      "kalimantan",
      "sulawesi",
      "papua",
      "maluku",
      "gorontalo",
    ],
    score: -40,
    category: "penalty",
  },
  {
    id: "penalty_other_office",
    name: "Kantor Daerah Lain",
    keywords: [
      "bea cukai tanjung perak",
      "bea cukai tanjung priok",
      "bea cukai soetta",
      "bea cukai belawan",
      "bea cukai batam",
      "bea cukai medan",
      "bea cukai makassar",
      "bea cukai surabaya",
      "bea cukai bandung",
      "bea cukai semarang",
    ],
    score: -60,
    category: "penalty",
  },
];

// ============ MEDIA PRIORITY ============
export const mediaPriority1 = [
  "Bangka Pos",
  "Pos Belitung",
  "Antara Babel",
  "RRI Sungailiat",
  "Babel Pos",
  "Rakyat Pos",
  "bangka.tribunnews.com",
  "belitung.tribunnews.com",
  "babel.antaranews.com",
  "berita.rri.co.id",
];

export const mediaPriority2 = [
  "Babel Aktual",
  "Babel Review",
  "Kabar Bangka",
  "WowBabel",
  "Negeri Laskar Pelangi",
  "Lensabangkabelitung",
  "Bangka Terkini",
  "babelaktual.com",
  "babelreview.com",
  "kabarbangka.com",
];

export const mediaPriority3 = [
  "Forum Keadilan Babel",
  "FKB News",
  "Fakta Berita",
  "Inlens",
  "Trasberita",
  "Linesnews",
  "Jejak Kasus",
  "Langkah Babel",
  "Media Polisi",
  "Beritalain",
  "Unggahan",
  "forumkeadilanbabel.com",
  "fkbnews.com",
  "faktaberita.co.id",
  "inlens.id",
  "trasberita.com",
  "linesnews.co.id",
  "jejakkasuslive.com",
  "langkahbabel.com",
  "mediapolisi.or.id",
  "beritalain.id",
  "unggahan.id",
];

export function getMediaPriority(mediaName: string): number {
  const lower = mediaName.toLowerCase();
  if (mediaPriority1.some((m) => lower.includes(m.toLowerCase()))) return 1;
  if (mediaPriority2.some((m) => lower.includes(m.toLowerCase()))) return 2;
  if (mediaPriority3.some((m) => lower.includes(m.toLowerCase()))) return 3;
  return 0;
}

// ============ RELEVANCE CALCULATION ============
export function calculateRelevance(title: string, content: string = ""): RelevanceResult {
  const text = `${title} ${content}`.toLowerCase();
  let score = 0;
  const matchedRules: string[] = [];
  const locationMatches: string[] = [];
  const issueMatches: string[] = [];
  const sensitiveMatches: string[] = [];

  // Apply scoring rules
  for (const rule of scoringRules) {
    const matches = rule.keywords.filter((kw) => text.includes(kw.toLowerCase()));
    if (matches.length > 0) {
      score += rule.score;
      matchedRules.push(rule.name);

      // Track specific matches
      if (rule.category === "location") {
        locationMatches.push(...matches);
      }
      if (rule.category === "issue") {
        issueMatches.push(...matches);
      }
      if (rule.category === "sensitive") {
        sensitiveMatches.push(...matches);
      }
    }
  }

  // Media priority bonus
  const mediaScore = getMediaPriority(text) > 0 ? 10 : 0;
  score += mediaScore;
  if (mediaScore > 0) matchedRules.push("Media Prioritas (+10)");

  // Deduplicate matches
  const uniqueLocations = [...new Set(locationMatches)];
  const uniqueIssues = [...new Set(issueMatches)];
  const uniqueSensitive = [...new Set(sensitiveMatches)];

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine status
  let status: RelevanceStatus;
  if (score >= 80) status = "Prioritas Tinggi";
  else if (score >= 60) status = "Relevan";
  else if (score >= 40) status = "Perlu Review";
  else status = "Tidak Relevan";

  return {
    score,
    status,
    matchedRules,
    locationMatches: uniqueLocations,
    issueMatches: uniqueIssues,
    sensitiveMatches: uniqueSensitive,
  };
}

export function getRiskLevel(tone: string, relevanceScore: number, sensitiveMatches: string[]): string {
  const toneLower = tone.toLowerCase();
  const hasSensitive = sensitiveMatches.length > 0;

  // Kritis: Negatif + oknum/demo/intimidasi/pungli/viral
  if (toneLower === "negatif" && hasSensitive) return "Kritis";

  // Tinggi: Negatif + menyebut Bea Cukai Pangkalpinang
  if (toneLower === "negatif" && relevanceScore >= 50) return "Tinggi";

  // Sedang: Netral + rokok ilegal or relevance medium
  if (toneLower === "netral" && (relevanceScore >= 40 || hasSensitive)) return "Sedang";

  // Rendah: Positif + relevansi tinggi
  if (toneLower === "positif") return "Rendah";

  if (toneLower === "negatif") return "Tinggi";

  return "Sedang";
}

// ============ DETERMINE CATEGORY ============
export function determineCategory(title: string, content: string = ""): string {
  const text = `${title} ${content}`.toLowerCase();

  if (text.includes("rokok ilegal") || text.includes("rokok tanpa") || text.includes("cukai ilegal"))
    return "Rokok Ilegal";
  if (text.includes("penyelundupan") || text.includes("penindakan") || text.includes("sita") || text.includes("gagalkan"))
    return "Penindakan";
  if (text.includes("umkm") && text.includes("ekspor")) return "UMKM Ekspor";
  if (text.includes("ekspor") || text.includes("impor")) return "Ekspor Impor";
  if (text.includes("layanan") || text.includes("pelayanan") || text.includes("publik"))
    return "Layanan Publik";
  if (
    text.includes("event") ||
    text.includes("donor darah") ||
    text.includes("virtual run") ||
    text.includes("hari pabean")
  )
    return "Event Kantor";
  if (text.includes("sinergi") || text.includes("instansi") || text.includes("mitra"))
    return "Sinergi Instansi";
  if (
    text.includes("oknum") ||
    text.includes("demo") ||
    text.includes("tuntutan") ||
    text.includes("pungli") ||
    text.includes("intimidasi")
  )
    return "Media Massa Negatif";
  if (text.includes("tuduhan") || text.includes("hoaks") || text.includes("dugaan")) return "Tuduhan/Hoaks";
  if (text.includes("pengawasan")) return "Pengawasan";
  if (text.includes("sosialisasi") && text.includes("sekolah")) return "Sosialisasi tusi BC sekolah dan perguruan tinggi";
  if (text.includes("dukungan umkm") || (text.includes("umkm") && text.includes("bantu")))
    return "Dukungan UMKM";

  return "Lainnya";
}

// ============ DETERMINE ISSUE TYPE ============
export function determineIssueType(title: string, content: string = ""): string {
  const category = determineCategory(title, content);
  const text = `${title} ${content}`.toLowerCase();

  switch (category) {
    case "Rokok Ilegal":
      return "Peredaran rokok ilegal";
    case "Penindakan":
      if (text.includes("timah")) return "Penyelundupan timah";
      if (text.includes("rokok")) return "Penindakan rokok ilegal";
      return "Penindakan umum";
    case "Ekspor Impor":
    case "UMKM Ekspor":
      return "Pemantauan ekspor impor";
    case "Media Massa Negatif":
    case "Tuduhan/Hoaks":
      return "Isu reputasi";
    case "Pengawasan":
      return "Kegagalan pengawasan";
    default:
      return "Lainnya";
  }
}
