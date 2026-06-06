import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import {
  Search,
  Filter,
  SlidersHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  RefreshCw,
  Check,
  X,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Upload,
  Link,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useArticles } from "@/hooks/useArticles";
import type { NewsArticle, ValidationStatus, FollowUpStatus } from "@/types/news";
import { cn } from "@/lib/utils";
import { extractUrlsFromText, readChatTextFile } from "@/lib/chatImport";

const PAGE_SIZE = 10;

const VALIDATION_OPTIONS: ValidationStatus[] = ["Baru", "Valid", "Tidak Relevan", "Duplikat", "Perlu Review", "Selesai"];
const FOLLOWUP_OPTIONS: FollowUpStatus[] = ["Belum Ditindaklanjuti", "Monitoring", "Koordinasi Internal", "Klarifikasi", "Publikasi Balasan", "Selesai"];

export default function Berita() {
  const {
    articles,
    manualArticles,
    loading,
    error,
    source,
    refresh,
    updateArticle,
    addManualArticle,
    importManualLinks,
    clearManualArticles,
  } = useArticles();
  const navigate = useNavigate();
  const { articleId } = useParams();
  const [search, setSearch] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [importingChat, setImportingChat] = useState(false);
  const [importSummary, setImportSummary] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof NewsArticle>("tanggalTerbit");
  const [sortDesc, setSortDesc] = useState(true);
  const [detailArticle, setDetailArticle] = useState<NewsArticle | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    kategori: "Semua",
    tone: "Semua",
    riskLevel: "Semua",
    validationStatus: "Semua",
    sumber: "Semua",
    statusRelevansi: "Semua",
    tahun: "Semua",
  });

  const filtered = useMemo(() => {
    let data = [...articles];

    // Search
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (a) =>
          a.judulBerita.toLowerCase().includes(q) ||
          a.isiBerita.toLowerCase().includes(q) ||
          a.namaMedia.toLowerCase().includes(q) ||
          a.namaWartawan.toLowerCase().includes(q)
      );
    }

    // Category filters
    if (filters.kategori !== "Semua") data = data.filter((a) => a.kategoriBerita === filters.kategori);
    if (filters.tone !== "Semua") data = data.filter((a) => a.tone === filters.tone);
    if (filters.riskLevel !== "Semua" && filters.riskLevel !== "Prioritas Tinggi" && filters.riskLevel !== "Perlu Review")
      data = data.filter((a) => a.levelRisiko === filters.riskLevel);
    if (filters.riskLevel === "Prioritas Tinggi")
      data = data.filter((a) => a.statusRelevansi === "Prioritas Tinggi");
    if (filters.riskLevel === "Perlu Review")
      data = data.filter((a) => a.statusRelevansi === "Perlu Review");
    if (filters.validationStatus !== "Semua")
      data = data.filter((a) => a.validationStatus === filters.validationStatus);
    if (filters.sumber !== "Semua") data = data.filter((a) => a.sumberKonten === filters.sumber);
    if (filters.statusRelevansi !== "Semua")
      data = data.filter((a) => a.statusRelevansi === filters.statusRelevansi);
    if (filters.tahun !== "Semua") data = data.filter((a) => a.tahun === Number(filters.tahun));

    // Sort
    data.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (typeof va === "string" && typeof vb === "string") {
        return sortDesc ? vb.localeCompare(va) : va.localeCompare(vb);
      }
      if (typeof va === "number" && typeof vb === "number") {
        return sortDesc ? vb - va : va - vb;
      }
      return 0;
    });

    return data;
  }, [articles, search, filters, sortField, sortDesc]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (field: keyof NewsArticle) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const openArticle = (article: NewsArticle) => {
    setDetailArticle(article);
    navigate(`/berita/${article.id}`);
  };

  const closeDetail = () => {
    setDetailArticle(null);
    if (articleId) navigate("/berita");
  };

  const handleValidation = (article: NewsArticle, status: ValidationStatus) => {
    updateArticle(article.id, { validationStatus: status });
    setDetailArticle({ ...article, validationStatus: status });
    toast.success(`Berita ditandai sebagai "${status}"`);
  };

  const handleFollowUp = (article: NewsArticle, status: FollowUpStatus) => {
    updateArticle(article.id, { statusPenanganan: status });
    setDetailArticle({ ...article, statusPenanganan: status });
    toast.success(`Status tindak lanjut diperbarui: "${status}"`);
  };

  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast.success("Link artikel disalin");
  };

  const submitManualLink = () => {
    if (!manualLink.trim()) {
      toast.error("Masukkan link berita terlebih dahulu");
      return;
    }

    try {
      const result = addManualArticle({
        link: manualLink,
        title: manualTitle,
        note: manualNote,
        sourceLabel: "Input manual",
      });

      if (result.duplicate) {
        toast.info("Link ini sudah ada di data manual");
      } else {
        toast.success("Link manual ditambahkan ke daftar berita");
        setSearch(result.article.namaMedia);
        setCurrentPage(1);
      }

      setManualLink("");
      setManualTitle("");
      setManualNote("");
    } catch {
      toast.error("Format link belum valid");
    }
  };

  const handleChatUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImportingChat(true);

    try {
      let totalUrls = 0;
      let totalAdded = 0;
      let totalSkipped = 0;

      for (const file of Array.from(files)) {
        const text = await readChatTextFile(file);
        const urls = extractUrlsFromText(text);
        const result = importManualLinks(urls, file.name);
        totalUrls += urls.length;
        totalAdded += result.added;
        totalSkipped += result.skipped;
      }

      setImportSummary(`${totalAdded} link relevan/lokal ditambahkan, ${totalSkipped} duplikat/tidak relevan/tidak valid dari ${totalUrls} link ditemukan.`);
      toast.success(`${totalAdded} link berita dari WhatsApp masuk ke daftar`);
      setCurrentPage(1);
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "Gagal membaca export chat WhatsApp");
    } finally {
      setImportingChat(false);
    }
  };

  useEffect(() => {
    if (!articleId) return;
    const article = articles.find((item) => item.id === articleId);
    if (article) setDetailArticle(article);
  }, [articleId, articles]);

  const kategoriList = [...new Set(articles.map((a) => a.kategoriBerita))];
  const tahunList = [...new Set(articles.map((a) => a.tahun))].sort().reverse();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daftar Berita</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola dan validasi berita media yang ter-scraping
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
            <span className={cn("inline-flex h-2 w-2 rounded-full", source === "google-sheet" ? "bg-emerald-500" : "bg-amber-500")} />
            <span>{source === "google-sheet" ? "Terhubung Google Sheet" : "Memakai data lokal"}</span>
            <span>|</span>
            <span>{manualArticles.length} input manual/chat</span>
            {error && <span className="text-amber-600">({error})</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
            {loading ? "Memuat..." : "Scraping Ulang"}
          </Button>
          <Button size="sm" className="text-xs h-8 bg-[#1e3a5f] hover:bg-[#152a45]">
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Generate Laporan
          </Button>
        </div>
      </div>

      {/* Manual & WhatsApp Import */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-[#1e3a5f]" />
                <h2 className="text-sm font-semibold text-slate-800">Input Link Manual</h2>
                <Badge variant="outline" className="text-[10px] h-5">Masuk Analisis</Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">
                <Input
                  value={manualLink}
                  onChange={(event) => setManualLink(event.target.value)}
                  placeholder="Tempel link berita dari wartawan/grup WhatsApp"
                  className="text-sm"
                />
                <Input
                  value={manualTitle}
                  onChange={(event) => setManualTitle(event.target.value)}
                  placeholder="Judul opsional"
                  className="text-sm"
                />
              </div>
              <Textarea
                value={manualNote}
                onChange={(event) => setManualNote(event.target.value)}
                placeholder="Catatan singkat opsional, misalnya nama wartawan, grup, atau konteks isu"
                className="min-h-[70px] text-sm"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" className="h-8 text-xs bg-[#1e3a5f] hover:bg-[#152a45]" onClick={submitManualLink}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Tambah Link
                </Button>
                {manualArticles.length > 0 && (
                  <Button variant="outline" size="sm" className="h-8 text-xs text-red-600" onClick={clearManualArticles}>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Bersihkan Manual
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-800">Upload Export WhatsApp</h2>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Terima file .zip atau .txt export chat. URL diekstrak, deduplikasi, lalu link lokal/relevan masuk daftar berita.
              </p>
              <Input
                type="file"
                accept=".zip,.txt,text/plain,application/zip"
                multiple
                disabled={importingChat}
                onChange={(event) => void handleChatUpload(event.target.files)}
                className="text-xs file:mr-3 file:border-0 file:bg-white file:text-slate-700"
              />
              {importSummary && (
                <p className="text-[11px] text-emerald-700 mt-2">{importSummary}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filter Bar */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Cari judul, media, wartawan..."
                className="pl-9 text-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className={cn("h-9 text-xs", filterOpen && "bg-slate-100")}
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
              Filter
            </Button>
          </div>

          {filterOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100">
              <Select
                value={filters.kategori}
                onValueChange={(v) => { setFilters((f) => ({ ...f, kategori: v })); setCurrentPage(1); }}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Kategori</SelectItem>
                  {kategoriList.map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.tone}
                onValueChange={(v) => { setFilters((f) => ({ ...f, tone: v })); setCurrentPage(1); }}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Tone</SelectItem>
                  <SelectItem value="Positif">Positif</SelectItem>
                  <SelectItem value="Netral">Netral</SelectItem>
                  <SelectItem value="Negatif">Negatif</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.riskLevel}
                onValueChange={(v) => { setFilters((f) => ({ ...f, riskLevel: v })); setCurrentPage(1); }}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Risiko" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Risiko</SelectItem>
                  <SelectItem value="Kritis">Kritis</SelectItem>
                  <SelectItem value="Tinggi">Tinggi</SelectItem>
                  <SelectItem value="Sedang">Sedang</SelectItem>
                  <SelectItem value="Rendah">Rendah</SelectItem>
                  <SelectItem value="Prioritas Tinggi">Prioritas Tinggi</SelectItem>
                  <SelectItem value="Perlu Review">Perlu Review</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.validationStatus}
                onValueChange={(v) => { setFilters((f) => ({ ...f, validationStatus: v })); setCurrentPage(1); }}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Validasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Status</SelectItem>
                  {VALIDATION_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.sumber}
                onValueChange={(v) => { setFilters((f) => ({ ...f, sumber: v })); setCurrentPage(1); }}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Sumber" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Sumber</SelectItem>
                  <SelectItem value="media lokal">Media Lokal</SelectItem>
                  <SelectItem value="media nasional">Media Nasional</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.tahun}
                onValueChange={(v) => { setFilters((f) => ({ ...f, tahun: v })); setCurrentPage(1); }}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Tahun</SelectItem>
                  {tahunList.map((t) => (
                    <SelectItem key={t} value={String(t)}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  <button onClick={() => toggleSort("judulBerita")} className="flex items-center gap-1 hover:text-slate-900">
                    Judul <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell">Media</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Kategori</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  <button onClick={() => toggleSort("tone")} className="flex items-center gap-1 hover:text-slate-900">
                    Tone <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Risiko</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">Skor</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  <button onClick={() => toggleSort("tanggalTerbit")} className="flex items-center gap-1 hover:text-slate-900">
                    Tanggal <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider w-12">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Tidak ada berita yang sesuai filter</p>
                  </td>
                </tr>
              )}
              {paginated.map((article) => (
                <tr
                  key={article.id}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  onClick={() => openArticle(article)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "w-1 rounded-full shrink-0 mt-1 self-stretch min-h-[20px]",
                        article.tone === "Positif" ? "bg-emerald-400" :
                        article.tone === "Negatif" ? "bg-red-400" : "bg-amber-400"
                      )} />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 line-clamp-1 text-[13px] group-hover:text-[#1e3a5f]">
                          {article.judulBerita}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 lg:hidden">
                          {article.namaMedia} | {article.wilayahTerkait}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 hidden md:table-cell">
                    {article.namaMedia}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal border-slate-300 text-slate-600">
                      {article.kategoriBerita}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={cn(
                        "text-[10px] h-5 px-1.5 font-medium border-0",
                        article.tone === "Positif" ? "bg-emerald-100 text-emerald-700" :
                        article.tone === "Negatif" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      )}
                    >
                      {article.tone}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={cn(
                        "text-[10px] h-5 px-1.5 font-medium border-0",
                        article.levelRisiko === "Kritis" ? "bg-red-100 text-red-700" :
                        article.levelRisiko === "Tinggi" ? "bg-orange-100 text-orange-700" :
                        article.levelRisiko === "Sedang" ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {article.levelRisiko}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            article.skorRelevansi >= 80 ? "bg-emerald-500" :
                            article.skorRelevansi >= 60 ? "bg-blue-500" :
                            article.skorRelevansi >= 40 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${article.skorRelevansi}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-600">{article.skorRelevansi}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={cn(
                      "text-[11px] font-medium px-1.5 py-0.5 rounded",
                      article.validationStatus === "Valid" ? "bg-emerald-50 text-emerald-700" :
                      article.validationStatus === "Baru" ? "bg-blue-50 text-blue-700" :
                      article.validationStatus === "Selesai" ? "bg-slate-100 text-slate-600" :
                      article.validationStatus === "Tidak Relevan" ? "bg-red-50 text-red-700" :
                      "bg-amber-50 text-amber-700"
                    )}>
                      {article.validationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(article.tanggalTerbit).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); openArticle(article); }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Menampilkan {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filtered.length)} dari {filtered.length} berita
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, i, arr) => (
                  <div key={p} className="flex items-center">
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <span className="text-xs text-slate-400 px-1">...</span>
                    )}
                    <Button
                      variant={currentPage === p ? "default" : "ghost"}
                      size="sm"
                      className={cn("h-7 w-7 p-0 text-xs", currentPage === p && "bg-[#1e3a5f]")}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  </div>
                ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailArticle} onOpenChange={(open) => { if (!open) closeDetail(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailArticle && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-1 rounded-full shrink-0 self-stretch min-h-[30px] mt-1",
                    detailArticle.tone === "Positif" ? "bg-emerald-400" :
                    detailArticle.tone === "Negatif" ? "bg-red-400" : "bg-amber-400"
                  )} />
                  <div className="flex-1">
                    <DialogTitle className="text-base leading-snug pr-4">{detailArticle.judulBerita}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] h-5">{detailArticle.namaMedia}</Badge>
                      <Badge variant="outline" className="text-[10px] h-5">{detailArticle.namaWartawan}</Badge>
                      <span className="text-[11px] text-slate-400">
                        {new Date(detailArticle.tanggalTerbit).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Score & Risk */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Skor Relevansi</p>
                    <p className={cn(
                      "text-xl font-bold mt-0.5",
                      detailArticle.skorRelevansi >= 80 ? "text-emerald-600" :
                      detailArticle.skorRelevansi >= 60 ? "text-blue-600" :
                      detailArticle.skorRelevansi >= 40 ? "text-amber-600" : "text-red-600"
                    )}>{detailArticle.skorRelevansi}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Level Risiko</p>
                    <p className={cn(
                      "text-sm font-bold mt-1.5",
                      detailArticle.levelRisiko === "Kritis" ? "text-red-600" :
                      detailArticle.levelRisiko === "Tinggi" ? "text-orange-600" :
                      detailArticle.levelRisiko === "Sedang" ? "text-amber-600" : "text-emerald-600"
                    )}>{detailArticle.levelRisiko}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tone</p>
                    <Badge className={cn(
                      "mt-1 text-[10px] h-5 border-0",
                      detailArticle.tone === "Positif" ? "bg-emerald-100 text-emerald-700" :
                      detailArticle.tone === "Negatif" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    )}>{detailArticle.tone}</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Validasi</p>
                    <p className="text-sm font-semibold text-slate-700 mt-1.5">{detailArticle.validationStatus}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2">Isi Berita</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{detailArticle.isiBerita}</p>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400">Kategori:</span>{" "}
                      <span className="font-medium text-slate-700">{detailArticle.kategoriBerita}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Jenis Isu:</span>{" "}
                      <span className="font-medium text-slate-700">{detailArticle.jenisIsu}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Wilayah:</span>{" "}
                      <span className="font-medium text-slate-700">{detailArticle.wilayahTerkait}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400">Sumber:</span>{" "}
                      <span className="font-medium text-slate-700">{detailArticle.sumberKonten}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Status Relevansi:</span>{" "}
                      <span className="font-medium text-slate-700">{detailArticle.statusRelevansi}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Tindak Lanjut:</span>{" "}
                      <span className="font-medium text-slate-700">{detailArticle.statusPenanganan}</span>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                {detailArticle.rekomendasiTindakLanjut && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider mb-1">Rekomendasi</p>
                    <p className="text-sm text-blue-800">{detailArticle.rekomendasiTindakLanjut}</p>
                  </div>
                )}

                {/* Link */}
                {detailArticle.linkArtikel ? (
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">Link Artikel</p>
                    <a
                      href={detailArticle.linkArtikel}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block text-xs text-blue-600 hover:underline break-all"
                    >
                      {detailArticle.linkArtikel}
                    </a>
                    <div className="flex items-center gap-2 mt-3">
                      <Button variant="outline" size="sm" className="h-7 text-[11px]" asChild>
                        <a href={detailArticle.linkArtikel} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Buka Link
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => void copyLink(detailArticle.linkArtikel)}>
                        <Copy className="w-3 h-3 mr-1" />
                        Salin
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
                    Link artikel belum terbaca dari hasil scraping. Periksa kolom link/url pada sumber data.
                  </div>
                )}

                {/* Actions */}
                <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 mr-1">Validasi:</span>
                    {VALIDATION_OPTIONS.map((status) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "text-[11px] h-7 px-2",
                          detailArticle.validationStatus === status && "bg-slate-100 border-slate-300"
                        )}
                        onClick={() => handleValidation(detailArticle, status)}
                      >
                        {status === "Valid" && <Check className="w-3 h-3 mr-1 text-emerald-500" />}
                        {status === "Tidak Relevan" && <X className="w-3 h-3 mr-1 text-red-500" />}
                        {status === "Duplikat" && <XCircle className="w-3 h-3 mr-1 text-slate-400" />}
                        {status === "Selesai" && <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />}
                        {status}
                      </Button>
                    ))}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-[11px] h-7">
                        <MoreHorizontal className="w-3 h-3 mr-1" />
                        Tindak Lanjut
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {FOLLOWUP_OPTIONS.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleFollowUp(detailArticle, status)}
                          className="text-xs"
                        >
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
