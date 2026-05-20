import { useMemo } from "react";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Filter,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { demoArticles } from "@/data/demoData";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "scraping" | "validasi" | "alert" | "tindak_lanjut" | "filter" | "review";
  description: string;
  detail: string;
  timestamp: string;
  user: string;
  articleId?: string;
  icon: typeof Activity;
  color: string;
  bgColor: string;
}

export default function Aktivitas() {
  const activities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    // Generate activity log from articles
    demoArticles.forEach((article) => {
      // Scraping activity
      items.push({
        id: `${article.id}-scraping`,
        type: "scraping",
        description: `Berita ter-scraping dari ${article.namaMedia}`,
        detail: article.judulBerita,
        timestamp: article.tanggalScraping,
        user: "Sistem",
        articleId: article.id,
        icon: RefreshCw,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      });

      // Validation activity for some
      if (article.validationStatus !== "Baru") {
        items.push({
          id: `${article.id}-validasi`,
          type: "validasi",
          description: `Validasi: ${article.validationStatus}`,
          detail: article.judulBerita,
          timestamp: article.updatedAt,
          user: article.pic,
          articleId: article.id,
          icon: article.validationStatus === "Valid" ? CheckCircle : article.validationStatus === "Selesai" ? ShieldCheck : Eye,
          color: article.validationStatus === "Valid" ? "text-emerald-600" : article.validationStatus === "Tidak Relevan" ? "text-red-600" : "text-amber-600",
          bgColor: article.validationStatus === "Valid" ? "bg-emerald-100" : article.validationStatus === "Tidak Relevan" ? "bg-red-100" : "bg-amber-100",
        });
      }

      // High risk alert
      if (article.levelRisiko === "Kritis" || article.levelRisiko === "Tinggi") {
        items.push({
          id: `${article.id}-alert`,
          type: "alert",
          description: `Alert risiko ${article.levelRisiko}`,
          detail: `${article.kategoriBerita} - ${article.judulBerita}`,
          timestamp: article.tanggalScraping,
          user: "Sistem",
          articleId: article.id,
          icon: AlertTriangle,
          color: "text-red-600",
          bgColor: "bg-red-100",
        });
      }

      // Filter evaluation
      items.push({
        id: `${article.id}-filter`,
        type: "filter",
        description: `Filter engine: Skor relevansi ${article.skorRelevansi}`,
        detail: article.statusRelevansi,
        timestamp: article.createdAt,
        user: "Filter Engine",
        articleId: article.id,
        icon: Filter,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      });
    });

    // Sort by timestamp descending
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return items.slice(0, 80);
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    activities.forEach((item) => {
      const date = new Date(item.timestamp).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  }, [activities]);

  const stats = useMemo(() => ({
    scraping: activities.filter((a) => a.type === "scraping").length,
    validasi: activities.filter((a) => a.type === "validasi").length,
    alert: activities.filter((a) => a.type === "alert").length,
    filter: activities.filter((a) => a.type === "filter").length,
  }), [activities]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Aktivitas Sistem</h1>
        <p className="text-sm text-slate-500 mt-0.5">Log aktivitas scraping, validasi, dan filter</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><RefreshCw className="w-4 h-4 text-blue-600" /></div>
            <div><p className="text-xs text-blue-600 font-medium">Scraping</p><p className="text-lg font-bold text-blue-700">{stats.scraping}</p></div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
            <div><p className="text-xs text-emerald-600 font-medium">Validasi</p><p className="text-lg font-bold text-emerald-700">{stats.validasi}</p></div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
            <div><p className="text-xs text-red-600 font-medium">Alert</p><p className="text-lg font-bold text-red-700">{stats.alert}</p></div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100"><Filter className="w-4 h-4 text-purple-600" /></div>
            <div><p className="text-xs text-purple-600 font-medium">Filter</p><p className="text-lg font-bold text-purple-700">{stats.filter}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Timeline Aktivitas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-xs font-medium text-slate-400 px-2">{date}</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", item.bgColor)}>
                        <item.icon className={cn("w-4 h-4", item.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-700">{item.description}</p>
                          <Badge variant="outline" className="text-[9px] h-4 px-1">
                            {item.user}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.detail}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
