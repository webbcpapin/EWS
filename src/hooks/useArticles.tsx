import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { demoArticles } from "@/data/demoData";
import { calculateRelevance, determineCategory, determineIssueType, getRiskLevel } from "@/lib/relevanceFilter";
import type { ChatLinkCandidate } from "@/lib/chatImport";
import type { FollowUpStatus, NewsArticle, SourceType, ValidationStatus } from "@/types/news";

const EWS_BACKEND_URL = "https://script.google.com/macros/s/AKfycbzYKZJ9pjLwccrw-tKu8BJJQbYJf6bSRpYJXXPixL7TZ0nO6mMiJnVZ1jRvTZ0Tx4wmpw/exec";
const MANUAL_ARTICLES_KEY = "ews_manual_articles_v1";
const MAX_CHAT_IMPORT_ARTICLES = 1000;

type BackendRow = Record<string, unknown>;

type BackendResponse = {
  ok?: boolean;
  error?: string;
  data?: BackendRow[];
};

type ArticlesContextValue = {
  articles: NewsArticle[];
  manualArticles: NewsArticle[];
  source: "google-sheet" | "local";
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateArticle: (id: string, patch: Partial<NewsArticle>) => void;
  addManualArticle: (input: ManualArticleInput) => { article: NewsArticle; duplicate: boolean };
  importManualLinks: (links: string[], sourceLabel?: string) => { added: number; skipped: number };
  importManualCandidates: (candidates: ChatLinkCandidate[], sourceLabel?: string) => { added: number; skipped: number };
  clearManualArticles: () => void;
};

const ArticlesContext = createContext<ArticlesContextValue | null>(null);

export type ManualArticleInput = {
  link: string;
  title?: string;
  note?: string;
  sourceLabel?: string;
  receivedAt?: string;
  sender?: string;
};

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

function parseIndonesianDate(raw: string) {
  const normalized = raw.trim().toLowerCase();
  const months: Record<string, number> = {
    januari: 0,
    jan: 0,
    februari: 1,
    feb: 1,
    maret: 2,
    mar: 2,
    april: 3,
    apr: 3,
    mei: 4,
    juni: 5,
    jun: 5,
    juli: 6,
    jul: 6,
    agustus: 7,
    agu: 7,
    september: 8,
    sep: 8,
    oktober: 9,
    okt: 9,
    november: 10,
    nov: 10,
    desember: 11,
    des: 11,
  };

  const slash = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]) - 1;
    const yearRaw = Number(slash[3]);
    const year = yearRaw < 100 ? (yearRaw < 50 ? 2000 + yearRaw : 1900 + yearRaw) : yearRaw;
    return new Date(year, month, day);
  }

  const words = normalized.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (words && months[words[2]] !== undefined) {
    return new Date(Number(words[3]), months[words[2]], Number(words[1]));
  }

  return null;
}

function toDate(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return new Date();
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;
  const local = parseIndonesianDate(raw);
  if (local && !Number.isNaN(local.getTime())) return local;
  return new Date();
}


function monthName(date: Date) {
  return date.toLocaleDateString("id-ID", { month: "long" });
}

function articleTime(article: NewsArticle) {
  const time = new Date(article.tanggalTerbit).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortNewestFirst(list: NewsArticle[]) {
  return [...list].sort((a, b) => articleTime(b) - articleTime(a) || b.updatedAt.localeCompare(a.updatedAt));
}

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  parsed.hash = "";
  return parsed.toString();
}

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function domainFromUrl(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "manual";
  }
}

function titleFromUrl(link: string) {
  try {
    const parsed = new URL(link);
    const lastPath = parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname;
    return decodeURIComponent(lastPath)
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return link;
  }
}

function inferTone(text: string): NewsArticle["tone"] {
  const lower = text.toLowerCase();
  if (
    lower.includes("oknum") ||
    lower.includes("diduga") ||
    lower.includes("intimidasi") ||
    lower.includes("pembiaran") ||
    lower.includes("ilegal") ||
    lower.includes("gagal") ||
    lower.includes("demo")
  ) {
    return "Negatif";
  }
  if (lower.includes("gagalkan") || lower.includes("berhasil") || lower.includes("sosialisasi") || lower.includes("fasilitasi")) {
    return "Positif";
  }
  return "Netral";
}

function inferSourceType(domain: string): SourceType {
  const lower = domain.toLowerCase();
  const localHints = ["babel", "bangka", "belitung", "pangkalpinang", "sungailiat", "rri.co.id", "antarababel"];
  return localHints.some((hint) => lower.includes(hint)) ? "media lokal" : "media nasional";
}

function isBcPangkalpinangContext(text: string) {
  const lower = text.toLowerCase();
  const officeHints = [
    "bea cukai pangkalpinang",
    "bc pangkalpinang",
    "beacukai pangkalpinang",
    "bea cukai papin",
    "beacukaipapin",
    "kppbc pangkalpinang",
    "kppbc tmp c pangkalpinang",
    "bea cukai bangka",
    "bea cukai babel",
  ];
  const issueHints = [
    "bea cukai",
    "beacukai",
    "cukai",
    "kepabeanan",
    "pabean",
    "rokok ilegal",
    "rokok tanpa pita cukai",
    "rokok polos",
    "pita cukai",
    "penyelundupan",
    "penindakan",
    "barang kiriman",
    "ekspor",
    "impor",
    "timah",
  ];
  const locationHints = [
    "pangkalpinang",
    "pangkal pinang",
    "bangka",
    "babel",
    "pangkalbalam",
    "muntok",
    "belinyu",
    "sungailiat",
    "toboali",
    "koba",
  ];

  const directOffice = officeHints.some((hint) => lower.includes(hint));
  const hasIssue = issueHints.some((hint) => lower.includes(hint));
  const hasLocation = locationHints.some((hint) => lower.includes(hint));
  return directOffice || (hasIssue && hasLocation);
}

function shouldImportFromChat(article: NewsArticle, rawText = "") {
  const searchable = [
    article.judulBerita,
    article.isiBerita,
    article.namaMedia,
    article.namaWartawan,
    article.linkArtikel,
    rawText,
  ].join(" ");
  return isBcPangkalpinangContext(searchable) && article.statusRelevansi !== "Tidak Relevan";
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pick(row: BackendRow, aliases: string[]) {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeKey(key), value] as const);
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null) return row[alias];
    const normalizedAlias = normalizeKey(alias);
    const match = normalizedEntries.find(([key]) => key === normalizedAlias);
    if (match && match[1] !== undefined && match[1] !== null) return match[1];
  }
  return "";
}

function mapBackendRow(row: BackendRow, index: number): NewsArticle {
  const link = String(pick(row, ["link_berita", "link berita", "link_artikel", "link artikel", "url", "link"])).trim();
  const rawTitle = String(pick(row, ["judul_berita", "judul berita", "judul", "title", "headline"])).trim();
  const rawContent = String(pick(row, ["isi_berita", "isi berita", "isi", "ringkasan", "deskripsi", "content"])).trim();
  const fallbackTitle = link ? titleFromUrl(link) : "";
  const title = rawTitle || rawContent || fallbackTitle || "(Tanpa judul)";
  const content = rawContent || rawTitle || fallbackTitle || link || title;
  const tone = normalizeTone(pick(row, ["tone", "sentimen", "sentiment"]));
  const relevance = calculateRelevance(title, content);
  const riskLevel = getRiskLevel(tone, relevance.score, relevance.sensitiveMatches) as NewsArticle["levelRisiko"];
  const validationStatus = normalizeValidationStatus(pick(row, ["status_validasi", "status validasi", "validation_status", "status"]));
  const publishedDate = toDate(pick(row, ["tanggal_terbit", "tanggal terbit", "tanggal", "date", "published_at"]));
  const now = new Date().toISOString();

  return {
    id: String(pick(row, ["id", "id_berita", "id berita"]) || `sheet_${index + 1}`),
    idBerita: Number(pick(row, ["no_sumber", "no sumber", "nomor", "no"]) || index + 1),
    tanggalScraping: now,
    tanggalTerbit: publishedDate.toISOString().slice(0, 10),
    bulan: String(pick(row, ["bulan", "month"]) || monthName(publishedDate)).trim(),
    tahun: Number(pick(row, ["tahun", "year"]) || publishedDate.getFullYear()),
    sumberKonten: normalizeSource(pick(row, ["sumber", "source", "sumber_konten", "sumber konten"])),
    kategoriBerita: (String(pick(row, ["kategori", "kategori_berita", "kategori berita", "category"]) || "Lainnya").trim() || "Lainnya") as NewsArticle["kategoriBerita"],
    namaMedia: String(pick(row, ["media", "nama_media", "nama media", "publisher"]) || "").trim(),
    namaWartawan: String(pick(row, ["wartawan", "nama_wartawan", "nama wartawan", "author"]) || "Tim Redaksi").trim() || "Tim Redaksi",
    judulBerita: title,
    isiBerita: content,
    tone,
    linkArtikel: link,
    linkPdfArsip: String(pick(row, ["link_pdf", "link pdf", "pdf", "arsip_pdf", "arsip pdf"]) || "").trim(),
    skorRelevansi: relevance.score,
    statusRelevansi: relevance.status,
    levelRisiko: riskLevel,
    jenisIsu: determineIssueType(title, content),
    wilayahTerkait: relevance.locationMatches.join(", ") || "Pangkalpinang",
    rekomendasiTindakLanjut: String(pick(row, ["rekomendasi_tindak_lanjut", "rekomendasi tindak lanjut", "rekomendasi", "recommendation"]) || "").trim() || (riskLevel === "Kritis"
      ? "Segera lakukan klarifikasi publik dan koordinasi dengan pimpinan"
      : riskLevel === "Tinggi"
      ? "Pantau perkembangan berita dan siapkan keterangan resmi"
      : "Lakukan monitoring dan dokumentasi"),
    statusPenanganan: normalizeFollowUpStatus(pick(row, ["status_penanganan", "status penanganan", "tindak_lanjut", "tindak lanjut", "status"])),
    pic: "Tim Humas",
    catatanVerifikator: "",
    validationStatus,
    createdAt: now,
    updatedAt: now,
  };
}

function createManualArticle(input: ManualArticleInput, index: number): NewsArticle {
  const link = normalizeUrl(input.link);
  const domain = domainFromUrl(link);
  const title = (input.title || titleFromUrl(link)).trim() || link;
  const content = [title, input.note, input.sender, input.sourceLabel, link].filter(Boolean).join(" ");
  const tone = inferTone(content);
  const relevance = calculateRelevance(title, content);
  const riskLevel = getRiskLevel(tone, relevance.score, relevance.sensitiveMatches) as NewsArticle["levelRisiko"];
  const receivedDate = input.receivedAt ? new Date(input.receivedAt) : new Date();
  const safeDate = Number.isNaN(receivedDate.getTime()) ? new Date() : receivedDate;
  const now = new Date().toISOString();

  return {
    id: `manual_${hashText(link)}`,
    idBerita: index + 1,
    tanggalScraping: now,
    tanggalTerbit: safeDate.toISOString().slice(0, 10),
    bulan: monthName(safeDate),
    tahun: safeDate.getFullYear(),
    sumberKonten: inferSourceType(domain),
    kategoriBerita: determineCategory(title, content) as NewsArticle["kategoriBerita"],
    namaMedia: domain,
    namaWartawan: input.sender || input.sourceLabel || "Input Manual",
    judulBerita: title,
    isiBerita: input.note?.trim() || "Link berita dari input manual / export chat WhatsApp.",
    tone,
    linkArtikel: link,
    linkPdfArsip: "",
    skorRelevansi: relevance.score,
    statusRelevansi: relevance.status,
    levelRisiko: riskLevel,
    jenisIsu: determineIssueType(title, content),
    wilayahTerkait: relevance.locationMatches.join(", ") || "Perlu verifikasi",
    rekomendasiTindakLanjut: riskLevel === "Kritis"
      ? "Segera verifikasi link manual dan siapkan respons penanganan"
      : riskLevel === "Tinggi"
      ? "Verifikasi isi berita, arsipkan link, dan koordinasikan tindak lanjut"
      : "Verifikasi link dan masukkan ke monitoring media",
    statusPenanganan: "Belum Ditindaklanjuti",
    pic: "Tim Humas",
    catatanVerifikator: [input.sourceLabel ? `Diimpor dari ${input.sourceLabel}` : "Input manual", input.sender ? `Pengirim: ${input.sender}` : ""].filter(Boolean).join(" | "),
    validationStatus: "Perlu Review",
    createdAt: now,
    updatedAt: now,
  };
}

function loadManualArticles() {
  try {
    const saved = window.localStorage.getItem(MANUAL_ARTICLES_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as NewsArticle[]) : [];
  } catch {
    return [];
  }
}

function saveManualArticles(articles: NewsArticle[]) {
  window.localStorage.setItem(MANUAL_ARTICLES_KEY, JSON.stringify(articles));
}

export function ArticlesProvider({ children }: { children: React.ReactNode }) {
  const [remoteArticles, setRemoteArticles] = useState<NewsArticle[]>(demoArticles);
  const [manualArticles, setManualArticles] = useState<NewsArticle[]>([]);
  const [source, setSource] = useState<ArticlesContextValue["source"]>("local");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setManualArticles(loadManualArticles());
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(EWS_BACKEND_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as BackendResponse;
      if (!payload.ok) throw new Error(payload.error || "Backend Google Sheet belum siap");
      const rows = Array.isArray(payload.data) ? payload.data : [];
      if (rows.length === 0) throw new Error("Sheet Berita masih kosong");
      setRemoteArticles(rows.map(mapBackendRow));
      setSource("google-sheet");
      setError(null);
    } catch (err) {
      setRemoteArticles(demoArticles);
      setSource("local");
      setError(err instanceof Error ? err.message : "Gagal memuat Google Sheet");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateArticle = useCallback((id: string, patch: Partial<NewsArticle>) => {
    const update = (current: NewsArticle[]) =>
      current.map((article) =>
        article.id === id ? { ...article, ...patch, updatedAt: new Date().toISOString() } : article
      );

    setRemoteArticles(update);
    setManualArticles((current) => {
      const updated = update(current);
      saveManualArticles(updated);
      return updated;
    });
  }, []);

  const addManualArticle = useCallback((input: ManualArticleInput) => {
    const article = createManualArticle(input, manualArticles.length);
    const duplicate = manualArticles.some((item) => item.linkArtikel.toLowerCase() === article.linkArtikel.toLowerCase());

    if (!duplicate) {
      setManualArticles((current) => {
        const updated = [article, ...current];
        saveManualArticles(updated);
        return updated;
      });
    }

    return { article, duplicate };
  }, [manualArticles]);

  const importManualCandidates = useCallback((candidates: ChatLinkCandidate[], sourceLabel?: string) => {
    let added = 0;
    let skipped = 0;

    setManualArticles((current) => {
      const seen = new Set(current.map((article) => article.linkArtikel.toLowerCase()));
      const imported: NewsArticle[] = [];

      candidates.forEach((candidate, index) => {
        if (imported.length >= MAX_CHAT_IMPORT_ARTICLES) {
          skipped += 1;
          return;
        }

        try {
          const article = createManualArticle(
            {
              link: candidate.url,
              note: candidate.context,
              sourceLabel: candidate.sourceLabel || sourceLabel,
              receivedAt: candidate.receivedAt,
              sender: candidate.sender,
            },
            current.length + index
          );
          const key = article.linkArtikel.toLowerCase();
          if (seen.has(key) || !shouldImportFromChat(article, candidate.rawMessage)) {
            skipped += 1;
            return;
          }
          seen.add(key);
          imported.push(article);
          added += 1;
        } catch {
          skipped += 1;
        }
      });

      const updated = sortNewestFirst([...imported, ...current]);
      saveManualArticles(updated);
      return updated;
    });

    return { added, skipped };
  }, []);

  const importManualLinks = useCallback((links: string[], sourceLabel?: string) => {
    const candidates = links.map((link) => ({
      url: link,
      context: "Link berita dari input manual / export chat WhatsApp.",
      rawMessage: link,
      sourceLabel,
    }));
    return importManualCandidates(candidates, sourceLabel);
  }, [importManualCandidates]);

  const clearManualArticles = useCallback(() => {
    setManualArticles([]);
    saveManualArticles([]);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const articles = useMemo(() => sortNewestFirst([...manualArticles, ...remoteArticles]), [manualArticles, remoteArticles]);

  const value = useMemo(
    () => ({
      articles,
      manualArticles,
      source,
      loading,
      error,
      refresh,
      updateArticle,
      addManualArticle,
      importManualLinks,
      importManualCandidates,
      clearManualArticles,
    }),
    [
      articles,
      manualArticles,
      source,
      loading,
      error,
      refresh,
      updateArticle,
      addManualArticle,
      importManualLinks,
      importManualCandidates,
      clearManualArticles,
    ]
  );

  return <ArticlesContext.Provider value={value}>{children}</ArticlesContext.Provider>;
}

export function useArticles() {
  const value = useContext(ArticlesContext);
  if (!value) {
    throw new Error("useArticles must be used inside ArticlesProvider");
  }
  return value;
}
