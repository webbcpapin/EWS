import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  ChevronRight,
  Eye,
  CheckCircle,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useArticles } from "@/hooks/useArticles";
import { cn } from "@/lib/utils";

export default function Alert() {
  const { articles } = useArticles();
  const navigate = useNavigate();
  const [riskFilter, setRiskFilter] = useState("Semua");
  const [sortField, setSortField] = useState<"skorRelevansi" | "tanggalTerbit">("skorRelevansi");
  const [sortDesc, setSortDesc] = useState(true);

  const alertArticles = useMemo(() => {
    let data = articles.filter(
      (a) => a.levelRisiko === "Kritis" || a.levelRisiko === "Tinggi" || a.skorRelevansi >= 60
    );

    if (riskFilter !== "Semua") {
      data = data.filter((a) => a.levelRisiko === riskFilter);
    }

    data.sort((a, b) => {
      if (sortField === "skorRelevansi") {
        return sortDesc ? b.skorRelevansi - a.skorRelevansi : a.skorRelevansi - b.skorRelevansi;
      }
      return sortDesc
        ? new Date(b.tanggalTerbit).getTime() - new Date(a.tanggalTerbit).getTime()
        : new Date(a.tanggalTerbit).getTime() - new Date(b.tanggalTerbit).getTime();
    });

    return data;
  }, [riskFilter, sortField, sortDesc]);

  const summary = useMemo(() => {
    const kritis = articles.filter((a) => a.levelRisiko === "Kritis").length;
    const tinggi = articles.filter((a) => a.levelRisiko === "Tinggi").length;
    const sedang = articles.filter((a) => a.levelRisiko === "Sedang").length;
    const menunggu = articles.filter(
      (a) => (a.levelRisiko === "Kritis" || a.levelRisiko === "Tinggi") && a.validationStatus === "Baru"
    ).length;
    return { kritis, tinggi, sedang, menunggu };
  }, [articles]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Alert & Risiko</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Pantau berita dengan risiko tinggi dan kritis
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-600 font-medium">Risiko Kritis</p>
                <p className="text-2xl font-bold text-red-700">{summary.kritis}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-medium">Risiko Tinggi</p>
                <p className="text-2xl font-bold text-orange-700">{summary.tinggi}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-600 font-medium">Risiko Sedang</p>
                <p className="text-2xl font-bold text-amber-700">{summary.sedang}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Menunggu Validasi</p>
                <p className="text-2xl font-bold text-blue-700">{summary.menunggu}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert List */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold">Daftar Alert</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="text-xs h-8 w-[150px]">
                  <SelectValue placeholder="Filter Risiko" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Risiko</SelectItem>
                  <SelectItem value="Kritis">Kritis</SelectItem>
                  <SelectItem value="Tinggi">Tinggi</SelectItem>
                  <SelectItem value="Sedang">Sedang</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => { setSortField("skorRelevansi"); setSortDesc(!sortDesc); }}
              >
                <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
                Skor
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => { setSortField("tanggalTerbit"); setSortDesc(!sortDesc); }}
              >
                <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
                Tanggal
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {alertArticles.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm text-slate-400">Tidak ada alert yang sesuai filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => navigate(`/berita/${article.id}`)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group",
                    article.levelRisiko === "Kritis"
                      ? "bg-red-50/60 border-red-200 hover:bg-red-50 hover:border-red-300"
                      : article.levelRisiko === "Tinggi"
                      ? "bg-orange-50/60 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                      : "bg-amber-50/40 border-amber-100 hover:bg-amber-50 hover:border-amber-200"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    article.levelRisiko === "Kritis" ? "bg-red-100" :
                    article.levelRisiko === "Tinggi" ? "bg-orange-100" : "bg-amber-100"
                  )}>
                    {article.levelRisiko === "Kritis" ? (
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-[#1e3a5f]">
                        {article.judulBerita}
                      </p>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5 group-hover:text-[#1e3a5f]" />
                    </div>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{article.isiBerita}</p>

                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <Badge
                        className={cn(
                          "text-[10px] h-5 border-0",
                          article.levelRisiko === "Kritis" ? "bg-red-200 text-red-800" :
                          article.levelRisiko === "Tinggi" ? "bg-orange-200 text-orange-800" :
                          "bg-amber-200 text-amber-800"
                        )}
                      >
                        {article.levelRisiko}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {article.kategoriBerita}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-[10px] h-5 border-0",
                          article.tone === "Positif" ? "bg-emerald-100 text-emerald-700" :
                          article.tone === "Negatif" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        )}
                      >
                        {article.tone}
                      </Badge>
                      <span className="text-[10px] text-slate-400">{article.namaMedia}</span>
                      <span className="text-[10px] text-slate-300">|</span>
                      <span className="text-[10px] text-slate-400">
                        Skor: <span className="font-semibold text-slate-600">{article.skorRelevansi}</span>
                      </span>
                      <span className="text-[10px] text-slate-300">|</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(article.tanggalTerbit).toLocaleDateString("id-ID")}
                      </span>
                    </div>

                    {/* Recommendation */}
                    {article.rekomendasiTindakLanjut && (
                      <div className="mt-2 p-2 rounded-md bg-white/60 border border-slate-200/60 text-[11px] text-slate-600">
                        <span className="font-medium">Rekomendasi:</span> {article.rekomendasiTindakLanjut}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => { e.stopPropagation(); navigate(`/berita/${article.id}`); }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    {article.validationStatus === "Baru" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-emerald-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          article.validationStatus = "Valid";
                        }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
