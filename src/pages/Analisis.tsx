import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useArticles } from "@/hooks/useArticles";

import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Newspaper,
  ShieldAlert,
  CheckCircle,
  Activity,
} from "lucide-react";

export default function Analisis() {
  const { articles } = useArticles();
  const stats = useMemo(() => {
    const byKategori: Record<string, { count: number; positif: number; negatif: number; netral: number }> = {};
    const byMedia: Record<string, number> = {};
    const byBulan: Record<string, { positif: number; negatif: number; netral: number }> = {};
    const toneTrend: { bulan: string; positif: number; negatif: number; netral: number }[] = [];

    articles.forEach((a) => {
      // By Kategori
      if (!byKategori[a.kategoriBerita]) byKategori[a.kategoriBerita] = { count: 0, positif: 0, negatif: 0, netral: 0 };
      byKategori[a.kategoriBerita].count++;
      byKategori[a.kategoriBerita][a.tone.toLowerCase() as "positif" | "negatif" | "netral"]++;

      // By Media
      byMedia[a.namaMedia] = (byMedia[a.namaMedia] || 0) + 1;

      // By Bulan
      if (!byBulan[a.bulan]) byBulan[a.bulan] = { positif: 0, negatif: 0, netral: 0 };
      byBulan[a.bulan][a.tone.toLowerCase() as "positif" | "negatif" | "netral"]++;
    });

    // Build trend array in chronological order
    const bulanOrder = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    bulanOrder.forEach((b) => {
      if (byBulan[b]) {
        toneTrend.push({ bulan: b, ...byBulan[b] });
      }
    });

    const total = articles.length;
    const positif = articles.filter((a) => a.tone === "Positif").length;
    const negatif = articles.filter((a) => a.tone === "Negatif").length;
    const netral = articles.filter((a) => a.tone === "Netral").length;

    const avgRelevansi = articles.reduce((s, a) => s + a.skorRelevansi, 0) / total;

    return { byKategori, byMedia, toneTrend, total, positif, negatif, netral, avgRelevansi };
  }, [articles]);

  const topMedia = useMemo(() =>
    Object.entries(stats.byMedia).sort(([, a], [, b]) => b - a).slice(0, 10),
    [stats.byMedia]
  );

  const maxMedia = topMedia[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analisis Berita</h1>
        <p className="text-sm text-slate-500 mt-0.5">Analisis mendalam data berita media massa</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Newspaper className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Berita</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Berita Positif</p>
                <p className="text-xl font-bold text-emerald-600">{stats.positif}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <ShieldAlert className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Berita Negatif</p>
                <p className="text-xl font-bold text-red-600">{stats.negatif}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Rata-rata Relevansi</p>
                <p className="text-xl font-bold text-purple-600">{stats.avgRelevansi.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori Breakdown */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1e3a5f]" />
              Distribusi per Kategori
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {Object.entries(stats.byKategori)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([kategori, data]) => (
                  <div key={kategori}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-700">{kategori}</span>
                      <span className="text-xs font-bold text-slate-900">{data.count}</span>
                    </div>
                    <div className="flex gap-0.5 h-5 rounded-md overflow-hidden">
                      {data.positif > 0 && (
                        <div
                          className="bg-emerald-400 flex items-center justify-center text-[9px] text-white font-medium"
                          style={{ width: `${(data.positif / data.count) * 100}%` }}
                        >
                          {data.positif > 1 ? data.positif : ""}
                        </div>
                      )}
                      {data.netral > 0 && (
                        <div
                          className="bg-amber-400 flex items-center justify-center text-[9px] text-white font-medium"
                          style={{ width: `${(data.netral / data.count) * 100}%` }}
                        >
                          {data.netral > 1 ? data.netral : ""}
                        </div>
                      )}
                      {data.negatif > 0 && (
                        <div
                          className="bg-red-400 flex items-center justify-center text-[9px] text-white font-medium"
                          style={{ width: `${(data.negatif / data.count) * 100}%` }}
                        >
                          {data.negatif > 1 ? data.negatif : ""}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1">
                      {data.positif > 0 && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                          <TrendingUp className="w-2.5 h-2.5" /> {data.positif} Positif
                        </span>
                      )}
                      {data.negatif > 0 && (
                        <span className="text-[10px] text-red-600 flex items-center gap-0.5">
                          <TrendingDown className="w-2.5 h-2.5" /> {data.negatif} Negatif
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Media Breakdown */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-[#1e3a5f]" />
              Top Media Sumber
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {topMedia.map(([media, count]) => (
                <div key={media}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 truncate max-w-[70%]">{media}</span>
                    <span className="text-xs font-semibold text-slate-800">{count}</span>
                  </div>
                  <Progress value={(count / maxMedia) * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tone Trend by Month */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1e3a5f]" />
            Tren Tone Berita per Bulan
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <div className="flex items-end gap-3 min-w-[600px] pt-4 pb-2">
              {stats.toneTrend.map((t) => {
                const maxVal = Math.max(t.positif, t.negatif, t.netral, 1);
                const scale = Math.min(120, 120 / maxVal);
                return (
                  <div key={t.bulan} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="flex gap-1 items-end" style={{ height: `${maxVal * scale + 20}px` }}>
                      <div
                        className="w-5 bg-emerald-400 rounded-t-sm relative group"
                        style={{ height: `${t.positif * scale}px` }}
                      >
                        {t.positif > 0 && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            {t.positif}
                          </span>
                        )}
                      </div>
                      <div
                        className="w-5 bg-amber-400 rounded-t-sm relative group"
                        style={{ height: `${t.netral * scale}px` }}
                      >
                        {t.netral > 0 && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            {t.netral}
                          </span>
                        )}
                      </div>
                      <div
                        className="w-5 bg-red-400 rounded-t-sm relative group"
                        style={{ height: `${t.negatif * scale}px` }}
                      >
                        {t.negatif > 0 && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            {t.negatif}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{t.bulan.slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-400 rounded-sm" />
              <span className="text-[11px] text-slate-600">Positif</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-amber-400 rounded-sm" />
              <span className="text-[11px] text-slate-600">Netral</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-400 rounded-sm" />
              <span className="text-[11px] text-slate-600">Negatif</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
