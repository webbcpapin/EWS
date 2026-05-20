export type Tone = "Positif" | "Netral" | "Negatif";

export type RiskLevel = "Rendah" | "Sedang" | "Tinggi" | "Kritis";

export type RelevanceStatus = "Tidak Relevan" | "Perlu Review" | "Relevan" | "Prioritas Tinggi";

export type ValidationStatus =
  | "Baru"
  | "Valid"
  | "Tidak Relevan"
  | "Duplikat"
  | "Perlu Review"
  | "Selesai";

export type FollowUpStatus =
  | "Belum Ditindaklanjuti"
  | "Monitoring"
  | "Koordinasi Internal"
  | "Klarifikasi"
  | "Publikasi Balasan"
  | "Selesai";

export type NewsCategory =
  | "Rokok Ilegal"
  | "Penindakan"
  | "Ekspor Impor"
  | "UMKM Ekspor"
  | "Layanan Publik"
  | "Event Kantor"
  | "Sinergi Instansi"
  | "Media Massa Negatif"
  | "Tuduhan/Hoaks"
  | "Kebijakan Cukai"
  | "Kebijakan Kepabeanan"
  | "Dukungan UMKM"
  | "Pengawasan"
  | "Sosialisasi tusi BC sekolah dan perguruan tinggi"
  | "Lainnya";

export type SourceType = "media lokal" | "media nasional";

export interface NewsArticle {
  id: string;
  idBerita: number;
  tanggalScraping: string;
  tanggalTerbit: string;
  bulan: string;
  tahun: number;
  sumberKonten: SourceType;
  kategoriBerita: NewsCategory;
  namaMedia: string;
  namaWartawan: string;
  judulBerita: string;
  isiBerita: string;
  tone: Tone;
  linkArtikel: string;
  linkPdfArsip: string;
  skorRelevansi: number;
  statusRelevansi: RelevanceStatus;
  levelRisiko: RiskLevel;
  jenisIsu: string;
  wilayahTerkait: string;
  rekomendasiTindakLanjut: string;
  statusPenanganan: FollowUpStatus;
  pic: string;
  catatanVerifikator: string;
  validationStatus: ValidationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  search: string;
  kategori: NewsCategory | "Semua";
  tone: Tone | "Semua";
  riskLevel: RiskLevel | "Semua";
  validationStatus: ValidationStatus | "Semua";
  sumber: SourceType | "Semua";
  bulan: string;
  tahun: number | "Semua";
  statusRelevansi: RelevanceStatus | "Semua";
  dateFrom: string;
  dateTo: string;
  mediaPrioritas: number | "Semua";
}

export interface DashboardStats {
  totalBerita: number;
  beritaRelevan: number;
  beritaPrioritas: number;
  beritaKritis: number;
  beritaBaru: number;
  beritaSelesai: number;
  beritaPerluReview: number;
  byKategori: Record<string, number>;
  byTone: Record<string, number>;
  byRisk: Record<string, number>;
  byBulan: Record<string, number>;
  byMedia: Record<string, number>;
  trendHarian: { date: string; count: number; relevan: number; kritis: number }[];
}

export interface ScoringRule {
  id: string;
  name: string;
  keywords: string[];
  score: number;
  category: "office" | "location" | "issue" | "sensitive" | "penalty";
}

export interface RelevanceResult {
  score: number;
  status: RelevanceStatus;
  matchedRules: string[];
  locationMatches: string[];
  issueMatches: string[];
  sensitiveMatches: string[];
}
