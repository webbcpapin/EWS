import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Newspaper,
  AlertTriangle,
  ShieldCheck,
  Eye,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  Clock,
  Activity,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useArticles } from "@/hooks/useArticles";
import { cn } from "@/lib/utils";

export default function Home() {
  const { articles } = useArticles();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const total = articles.length;
    const relevan = articles.filter((a) => a.skorRelevansi >= 60).length;
    const prioritas = articles.filter((a) => a.statusRelevansi === "Prioritas Tinggi").length;
    const kritis = articles.filter((a) => a.levelRisiko === "Kritis").length;
    const baru = articles.filter((a) => a.validationStatus === "Baru").length;
    const selesai = articles.filter((a) => a.validationStatus === "Selesai").length;

    const byKategori: Record<string, number> = {};
    const byTone: Record<string, number> = {};
    const byRisk: Record<string, number> = {};

    articles.forEach((a) => {
      byKategori[a.kategoriBerita] = (byKategori[a.kategoriBerita] || 0) + 1;
      byTone[a.tone] = (byTone[a.tone] || 0) + 1;
      byRisk[a.levelRisiko] = (byRisk[a.levelRisiko] || 0) + 1;
    });

    return { total, relevan, prioritas, kritis, baru, selesai, byKategori, byTone, byRisk };
  }, [articles]);

  const topRisks = useMemo(
    () => articles.filter((a) => a.levelRisiko === "Kritis" || a.levelRisiko === "Tinggi").slice(0, 5),
    []
  );

  const recentNews = useMemo(
    () => [...articles].sort((a, b) => new Date(b.tanggalTerbit).getTime() - new Date(a.tanggalTerbit).getTime()).slice(0, 8),
    []
  );

  const statCards = [
    {
      title: "Total Berita",
      value: stats.total,
      icon: Newspaper,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      desc: "Semua berita ter-scraping",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Relevan",
      value: stats.relevan,
      icon: ShieldCheck,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      desc: "Berita melewati filter",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Prioritas Tinggi",
      value: stats.prioritas,
      icon: AlertTriangle,
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
      desc: "Butuh perhatian segera",
      trend: "-2",
      trendUp: false,
    },
    {
      title: "Risiko Kritis",
      value: stats.kritis,
      icon: AlertTriangle,
      color: "bg-red-500",
      lightColor: "bg-red-50",
      textColor: "text-red-600",
      desc: "Segera tangani",
      trend: "+1",
      trendUp: false,
    },
  ];

  const kategoriEntries = useMemo(() =>
    Object.entries(stats.byKategori)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8),
    [stats.byKategori]
  );

  const maxKategori = kategoriEntries[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pantau berita media dan analisis reputasi BC Pangkalpinang
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Scraping: 07:00, 12:00, 16:00</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => navigate("/berita")}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium flex items-center gap-0.5",
                        card.trendUp ? "text-emerald-600" : "text-red-500"
                      )}
                    >
                      {card.trendUp ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {card.trend}
                    </span>
                    <span className="text-xs text-slate-400">vs bulan lalu</span>
                  </div>
                </div>
                <div className={cn("p-2.5 rounded-xl", card.lightColor)}>
                  <card.icon className={cn("w-5 h-5", card.textColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Alerts & Recent News */}
        <div className="xl:col-span-2 space-y-6">
          {/* Risk Alerts */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" />
                  <CardTitle className="text-base font-semibold">Alert Risiko Tinggi</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => navigate("/alert")}
                >
                  Lihat Semua
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {topRisks.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/berita/${article.id}`)}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    <div className={cn(
                      "mt-0.5 w-2 h-2 rounded-full shrink-0 mt-2",
                      article.levelRisiko === "Kritis" ? "bg-red-500" : "bg-orange-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 line-clamp-1 group-hover:text-[#1e3a5f]">
                        {article.judulBerita}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-5 px-1.5",
                            article.levelRisiko === "Kritis"
                              ? "border-red-300 text-red-700 bg-red-50"
                              : "border-orange-300 text-orange-700 bg-orange-50"
                          )}
                        >
                          {article.levelRisiko}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-slate-300 text-slate-600">
                          {article.kategoriBerita}
                        </Badge>
                        <span className="text-[10px] text-slate-400">
                          {article.namaMedia}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 mt-1 group-hover:text-[#1e3a5f] transition-colors" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent News */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1e3a5f]" />
                  <CardTitle className="text-base font-semibold">Berita Terbaru</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => navigate("/berita")}
                >
                  Lihat Semua
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-slate-100">
                {recentNews.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/berita/${article.id}`)}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer group hover:bg-slate-50/50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className={cn(
                      "w-1.5 rounded-full shrink-0 mt-1.5 self-stretch",
                      article.tone === "Positif" ? "bg-emerald-400" :
                      article.tone === "Negatif" ? "bg-red-400" : "bg-amber-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 line-clamp-1 group-hover:text-[#1e3a5f]">
                        {article.judulBerita}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-500">{article.namaMedia}</span>
                        <span className="text-[11px] text-slate-300">|</span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(article.tanggalTerbit).toLocaleDateString("id-ID")}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] h-4 px-1 ml-auto",
                            article.tone === "Positif" ? "border-emerald-300 text-emerald-700 bg-emerald-50" :
                            article.tone === "Negatif" ? "border-red-300 text-red-700 bg-red-50" :
                            "border-amber-300 text-amber-700 bg-amber-50"
                          )}
                        >
                          {article.tone}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Categories & Breakdown */}
        <div className="space-y-6">
          {/* Tone Distribution */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Distribusi Tone</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {Object.entries(stats.byTone).map(([tone, count]) => (
                  <div key={tone}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600">{tone}</span>
                      <span className="text-xs font-bold text-slate-800">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          tone === "Positif" ? "bg-emerald-500" :
                          tone === "Negatif" ? "bg-red-500" : "bg-amber-500"
                        )}
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Distribusi Risiko</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(stats.byRisk).map(([risk, count]) => (
                  <div
                    key={risk}
                    className={cn(
                      "p-3 rounded-lg border text-center",
                      risk === "Kritis" ? "bg-red-50 border-red-200" :
                      risk === "Tinggi" ? "bg-orange-50 border-orange-200" :
                      risk === "Sedang" ? "bg-amber-50 border-amber-200" :
                      "bg-emerald-50 border-emerald-200"
                    )}
                  >
                    <p className={cn(
                      "text-lg font-bold",
                      risk === "Kritis" ? "text-red-700" :
                      risk === "Tinggi" ? "text-orange-700" :
                      risk === "Sedang" ? "text-amber-700" :
                      "text-emerald-700"
                    )}>{count}</p>
                    <p className="text-[10px] font-medium text-slate-600 mt-0.5">{risk}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Kategori Terbanyak</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {kategoriEntries.map(([kategori, count]) => (
                  <div key={kategori}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600 truncate max-w-[70%]">{kategori}</span>
                      <span className="text-xs font-semibold text-slate-800">{count}</span>
                    </div>
                    <Progress
                      value={(count / maxKategori) * 100}
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-[#1e3a5f] to-[#2980b9] text-white">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-1">Aksi Cepat</h3>
              <p className="text-xs text-white/70 mb-4">Kelola berita dan validasi konten</p>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={() => navigate("/berita")}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Validasi Berita
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={() => navigate("/laporan")}
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Generate Laporan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
