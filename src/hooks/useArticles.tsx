import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { demoArticles } from "@/data/demoData";
import { calculateRelevance, determineIssueType, getRiskLevel } from "@/lib/relevanceFilter";
import type { FollowUpStatus, NewsArticle, SourceType, ValidationStatus } from "@/types/news";

const EWS_BACKEND_URL = "https://script.google.com/macros/s/AKfycbzIixHz2lDh9RriKyKhp5CR0f43ZXvW4NoBbo-9G2mCSKZ5kZYZwe0324F4-PsEdMW4Yw/exec";

type BackendRow = {
  id?: string;
  tahun?: string | number;
  no_sumber?: string | number;
  tanggal?: string;
  bulan?: string;
  sumber?: string;
  kategori?: string;
  media?: string;
  wartawan?: string;
  judul_berita?: string;
  tone?: string;
  link_pdf?: string;
  link_berita?: string;
  rekomendasi_tindak_lanjut?: string;
  status?: string;
  prioritas?: string;
};

type BackendResponse = {
  ok?: boolean;
  error?: string;
  data?: BackendRow[];
};

type ArticlesContextValue = {
  articles: NewsArticle[];
  source: "google-sheet" | "local";
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ArticlesContext = createContext<ArticlesContextValue | null>(null);

function normalizeTone(value: unknown): NewsArticle["tone"] {
  const tone = String(value || "").trim().toLowerCase();
  if (tone.includes("neg")) return "Negatif";
  if (tone.includes("pos")) return "Positif";
  return "Netral";
}

function normalizeSource(value: unknown): SourceType {
  const source = String(value || "").trim().toLowerCase();
  return source.includes("nasional") ? "media nasional" : "media lokal";
}

function normalizeValidationStatus(value: unknown): ValidationStatus {
  const status = String(value || "").trim().toLowerCase();
  if (status.includes("selesai") || status.includes("tindak")) return "Selesai";
  if (status.includes("review")) return "Perlu Review";
  if (status.includes("valid")) return "Valid";
  return "Baru";
}

function normalizeFollowUpStatus(value: unknown): FollowUpStatus {
  const status = String(value || "").trim().toLowerCase();
  if (status.includes("selesai") || status.includes("tindak")) return "Selesai";
  if (status.includes("koordinasi")) return "Koordinasi Internal";
  if (status.includes("klarifikasi")) return "Klarifikasi";
  if (status.includes("monitor")) return "Monitoring";
  return "Belum Ditindaklanjuti";
}

function toIsoDate(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return new Date().toISOString().slice(0, 10);
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return raw;
}

function mapBackendRow(row: BackendRow, index: number): NewsArticle {
  const title = String(row.judul_berita || "").trim();
  const tone = normalizeTone(row.tone);
  const relevance = calculateRelevance(title, title);
  const riskLevel = getRiskLevel(tone, relevance.score, relevance.sensitiveMatches) as NewsArticle["levelRisiko"];
  const validationStatus = normalizeValidationStatus(row.status);
  const now = new Date().toISOString();

  return {
    id: String(row.id || `sheet_${index + 1}`),
    idBerita: Number(row.no_sumber || index + 1),
    tanggalScraping: now,
    tanggalTerbit: toIsoDate(row.tanggal),
    bulan: String(row.bulan || "").trim(),
    tahun: Number(row.tahun || new Date().getFullYear()),
    sumberKonten: normalizeSource(row.sumber),
    kategoriBerita: (String(row.kategori || "Lainnya").trim() || "Lainnya") as NewsArticle["kategoriBerita"],
    namaMedia: String(row.media || "").trim(),
    namaWartawan: String(row.wartawan || "Tim Redaksi").trim() || "Tim Redaksi",
    judulBerita: title,
    isiBerita: title,
    tone,
    linkArtikel: String(row.link_berita || "").trim(),
    linkPdfArsip: String(row.link_pdf || "").trim(),
    skorRelevansi: relevance.score,
    statusRelevansi: relevance.status,
    levelRisiko: riskLevel,
    jenisIsu: determineIssueType(title, title),
    wilayahTerkait: relevance.locationMatches.join(", ") || "Pangkalpinang",
    rekomendasiTindakLanjut: String(row.rekomendasi_tindak_lanjut || "").trim() || (riskLevel === "Kritis"
      ? "Segera lakukan klarifikasi publik dan koordinasi dengan pimpinan"
      : riskLevel === "Tinggi"
      ? "Pantau perkembangan berita dan siapkan keterangan resmi"
      : "Lakukan monitoring dan dokumentasi"),
    statusPenanganan: normalizeFollowUpStatus(row.status),
    pic: "Tim Humas",
    catatanVerifikator: "",
    validationStatus,
    createdAt: now,
    updatedAt: now,
  };
}

export function ArticlesProvider({ children }: { children: React.ReactNode }) {
  const [articles, setArticles] = useState<NewsArticle[]>(demoArticles);
  const [source, setSource] = useState<ArticlesContextValue["source"]>("local");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(EWS_BACKEND_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as BackendResponse;
      if (!payload.ok) throw new Error(payload.error || "Backend Google Sheet belum siap");
      const rows = Array.isArray(payload.data) ? payload.data : [];
      if (rows.length === 0) throw new Error("Sheet Berita masih kosong");
      setArticles(rows.map(mapBackendRow));
      setSource("google-sheet");
      setError(null);
    } catch (err) {
      setArticles(demoArticles);
      setSource("local");
      setError(err instanceof Error ? err.message : "Gagal memuat Google Sheet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ articles, source, loading, error, refresh }), [articles, source, loading, error, refresh]);

  return <ArticlesContext.Provider value={value}>{children}</ArticlesContext.Provider>;
}

export function useArticles() {
  const value = useContext(ArticlesContext);
  if (!value) {
    throw new Error("useArticles must be used inside ArticlesProvider");
  }
  return value;
}