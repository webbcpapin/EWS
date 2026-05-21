import { useMemo, useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useArticles } from "@/hooks/useArticles";
import { cn } from "@/lib/utils";

type ReportType = "harian" | "mingguan" | "bulanan" | "khusus";

export default function Laporan() {
  const { articles } = useArticles();
  const [selectedReport, setSelectedReport] = useState<ReportType>("bulanan");

  const stats = useMemo(() => {
    const total = articles.length;
    const positif = articles.filter((a) => a.tone === "Positif").length;
    const negatif = articles.filter((a) => a.tone === "Negatif").length;
    const netral = articles.filter((a) => a.tone === "Netral").length;
    const kritis = articles.filter((a) => a.levelRisiko === "Kritis").length;
    const selesai = articles.filter((a) => a.validationStatus === "Selesai").length;
    const avgRelevansi = articles.reduce((s, a) => s + a.skorRelevansi, 0) / total;

    const byKategori: Record<string, number> = {};
    const byMedia: Record<string, number> = {};
    articles.forEach((a) => {
      byKategori[a.kategoriBerita] = (byKategori[a.kategoriBerita] || 0) + 1;
      byMedia[a.namaMedia] = (byMedia[a.namaMedia] || 0) + 1;
    });

    return { total, positif, negatif, netral, kritis, selesai, avgRelevansi, byKategori, byMedia };
  }, [articles]);

  const topIssues = useMemo(() =>
    articles
      .filter((a) => a.levelRisiko === "Kritis" || a.levelRisiko === "Tinggi")
      .slice(0, 5),
    []
  );

  const generateReport = (type: ReportType) => {
    setSelectedReport(type);
    toast.success("Laporan " + type + " berhasil digenerate");
  };

  const exportCSV = () => {
    const headers = [
      "ID", "Tanggal", "Media", "Wartawan", "Judul", "Kategori", "Tone",
      "Skor Relevansi", "Status Relevansi", "Level Risiko", "Jenis Isu",
      "Wilayah", "Status Validasi", "Status Tindak Lanjut", "Link"
    ].join(",");

    const rows = articles.map((a) => {
      const judul = '"' + a.judulBerita.replace(/"/g, '""') + '"';
      return [
        a.id, a.tanggalTerbit, a.namaMedia, a.namaWartawan, judul,
        a.kategoriBerita, a.tone, a.skorRelevansi, a.statusRelevansi,
        a.levelRisiko, a.jenisIsu, a.wilayahTerkait, a.validationStatus,
        a.statusPenanganan, a.linkArtikel,
      ].join(",");
    });

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "laporan-ews-bea-cukai-" + new Date().toISOString().split("T")[0] + ".csv";
    link.click();
    toast.success("File CSV berhasil diunduh");
  };

  const exportPDF = () => {
    toast.success("Laporan PDF sedang diproses...");
    setTimeout(() => {
      toast.success("Laporan PDF berhasil diunduh");
    }, 1500);
  };

  const positifPct = stats.total > 0 ? ((stats.positif / stats.total) * 100).toFixed(0) : "0";
  const netralPct = stats.total > 0 ? ((stats.netral / stats.total) * 100).toFixed(0) : "0";
  const negatifPct = stats.total > 0 ? ((stats.negatif / stats.total) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate dan unduh laporan analisis media</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button size="sm" className="text-xs h-8 bg-[#1e3a5f] hover:bg-[#152a45]" onClick={exportPDF}>
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["harian", "mingguan", "bulanan", "khusus"] as ReportType[]).map((type) => (
          <button
            key={type}
            onClick={() => generateReport(type)}
            className={cn(
              "p-4 rounded-xl border text-left transition-all",
              selectedReport === type
                ? "border-[#1e3a5f] bg-[#1e3a5f]/5 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className={cn("w-4 h-4", selectedReport === type ? "text-[#1e3a5f]" : "text-slate-400")} />
              <span className={cn(
                "text-xs font-medium capitalize",
                selectedReport === type ? "text-[#1e3a5f]" : "text-slate-600"
              )}>
                Laporan {type}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {type === "harian" && "Ringkasan harian"}
              {type === "mingguan" && "Agregat mingguan"}
              {type === "bulanan" && "Analisis bulanan"}
              {type === "khusus" && "Laporan isu khusus"}
            </p>
          </button>
        ))}
      </div>

      {/* Report Preview */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Laporan {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)}
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Periode: {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] h-6">
              <Clock className="w-3 h-3 mr-1" />
              Generated: {new Date().toLocaleDateString("id-ID")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-200">
            <h2 className="text-lg font-bold text-[#1e3a5f]">
              EARLY WARNING SYSTEM - KPPBC TMP C PANGKALPINANG
            </h2>
            <p className="text-sm text-slate-500 mt-1">Analisis Berita Media Massa</p>
            <p className="text-xs text-slate-400">
              Periode: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Executive Summary */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Ringkasan Eksekutif</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500 mt-0.5">Total Berita</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.positif}</p>
                <p className="text-xs text-emerald-600 mt-0.5">Berita Positif</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-center">
                <p className="text-2xl font-bold text-red-600">{stats.negatif}</p>
                <p className="text-xs text-red-600 mt-0.5">Berita Negatif</p>
              </div>
              <div className="p-4 rounded-lg bg-orange-50 border border-orange-100 text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.kritis}</p>
                <p className="text-xs text-orange-600 mt-0.5">Isu Kritis</p>
              </div>
            </div>
          </div>

          {/* Tone Breakdown */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Distribusi Tone</h3>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-600">Positif</span>
                  <span className="text-xs font-bold text-slate-800">{stats.positif} ({positifPct}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: positifPct + "%" }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-600">Netral</span>
                  <span className="text-xs font-bold text-slate-800">{stats.netral} ({netralPct}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: netralPct + "%" }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-600">Negatif</span>
                  <span className="text-xs font-bold text-slate-800">{stats.negatif} ({negatifPct}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: negatifPct + "%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Distribusi Kategori</h3>
            <div className="space-y-2">
              {Object.entries(stats.byKategori)
                .sort(([, a], [, b]) => b - a)
                .map(([kategori, count]) => (
                  <div key={kategori} className="flex items-center justify-between p-2 rounded-md bg-slate-50">
                    <span className="text-xs text-slate-700">{kategori}</span>
                    <span className="text-xs font-bold text-slate-900">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Top Issues */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Isu Prioritas</h3>
            <div className="space-y-2">
              {topIssues.map((article) => (
                <div
                  key={article.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    article.levelRisiko === "Kritis"
                      ? "bg-red-50 border-red-200"
                      : "bg-orange-50 border-orange-200"
                  )}
                >
                  <ShieldAlert className={cn(
                    "w-4 h-4 shrink-0 mt-0.5",
                    article.levelRisiko === "Kritis" ? "text-red-500" : "text-orange-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 line-clamp-1">{article.judulBerita}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[9px] h-4 px-1">{article.kategoriBerita}</Badge>
                      <span className="text-[9px] text-slate-400">{article.levelRisiko}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rekomendasi */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
            <h3 className="text-sm font-bold text-blue-800 mb-2 uppercase tracking-wider">Rekomendasi</h3>
            <ul className="space-y-1.5">
              <li className="text-xs text-blue-700 flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Intensifikan monitoring berita negatif terkait rokok ilegal
              </li>
              <li className="text-xs text-blue-700 flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Segera tindak lanjuti isu kritis terkait intimidasi wartawan
              </li>
              <li className="text-xs text-blue-700 flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Perkuat sinergi dengan instansi terkait untuk penindakan
              </li>
              <li className="text-xs text-blue-700 flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Optimalkan publikasi positif kegiatan kantor
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-dashed border-slate-200">
            <p className="text-[10px] text-slate-400">
              Dicetak oleh EWS Bea Cukai Pangkalpinang | {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
