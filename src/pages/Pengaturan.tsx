import { useState } from "react";
import {
  Filter,
  Globe,
  Tag,
  ShieldAlert,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  scoringRules,
  mediaPriority1,
  mediaPriority2,
  mediaPriority3,
} from "@/lib/relevanceFilter";
import { cn } from "@/lib/utils";

type TabType = "filter" | "media" | "keyword" | "schedule";

export default function Pengaturan() {
  const [activeTab, setActiveTab] = useState<TabType>("filter");
  const [expandedRule, setExpandedRule] = useState<string | null>("office_direct");
  const [keywordInput, setKeywordInput] = useState("");
  const [customKeywords, setCustomKeywords] = useState<string[]>([
    "bea cukai pangkalpinang",
    "rokok ilegal pangkalpinang",
    "penyelundupan timah bangka",
  ]);

  const handleSave = () => {
    toast.success("Pengaturan berhasil disimpan");
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !customKeywords.includes(keywordInput.trim())) {
      setCustomKeywords([...customKeywords, keywordInput.trim()]);
      setKeywordInput("");
      toast.success("Keyword ditambahkan");
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setCustomKeywords(customKeywords.filter((k) => k !== kw));
    toast.success("Keyword dihapus");
  };

  const tabs = [
    { id: "filter" as TabType, label: "Filter Engine", icon: Filter },
    { id: "media" as TabType, label: "Media Prioritas", icon: Globe },
    { id: "keyword" as TabType, label: "Keyword", icon: Tag },
    { id: "schedule" as TabType, label: "Jadwal Scraping", icon: Clock },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan</h1>
          <p className="text-sm text-slate-500 mt-0.5">Konfigurasi sistem filter dan scraping</p>
        </div>
        <Button size="sm" className="text-xs h-8 bg-[#1e3a5f] hover:bg-[#152a45]" onClick={handleSave}>
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Simpan Perubahan
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-slate-100 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Engine Tab */}
      {activeTab === "filter" && (
        <div className="space-y-5">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#1e3a5f]" />
                Aturan Scoring Relevansi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-3 mb-4 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Sistem menggunakan aturan scoring berikut untuk menentukan relevansi berita.
                    Skor akhir 0-100 menentukan kategori: Prioritas Tinggi (80+), Relevan (60+), Perlu Review (40+), Tidak Relevan (&lt;40).
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {scoringRules.map((rule) => {
                  const isExpanded = expandedRule === rule.id;
                  return (
                    <div
                      key={rule.id}
                      className="border border-slate-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            className={cn(
                              "text-[10px] h-5 border-0",
                              rule.category === "office" ? "bg-blue-100 text-blue-700" :
                              rule.category === "location" ? "bg-emerald-100 text-emerald-700" :
                              rule.category === "issue" ? "bg-amber-100 text-amber-700" :
                              rule.category === "sensitive" ? "bg-red-100 text-red-700" :
                              "bg-slate-100 text-slate-600"
                            )}
                          >
                            {rule.score > 0 ? `+${rule.score}` : rule.score}
                          </Badge>
                          <span className="text-sm font-medium text-slate-800">{rule.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] h-5">
                            {rule.keywords.length} keywords
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-slate-100 bg-slate-50/50">
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {rule.keywords.map((kw) => (
                              <Badge
                                key={kw}
                                variant="outline"
                                className="text-[11px] font-normal border-slate-300 text-slate-600 bg-white"
                              >
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Risk Rules */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Aturan Penentuan Risiko
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <Badge className="text-[10px] h-5 bg-red-200 text-red-800 border-0 mb-2">Kritis</Badge>
                  <p className="text-xs text-red-700">Tone Negatif + terdapat kata sensitif (oknum, demo, intimidasi, pungli, viral)</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <Badge className="text-[10px] h-5 bg-orange-200 text-orange-800 border-0 mb-2">Tinggi</Badge>
                  <p className="text-xs text-orange-700">Tone Negatif + menyebut Bea Cukai Pangkalpinang langsung</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <Badge className="text-[10px] h-5 bg-amber-200 text-amber-800 border-0 mb-2">Sedang</Badge>
                  <p className="text-xs text-amber-700">Tone Netral + isu rokok ilegal atau skor relevansi menengah</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <Badge className="text-[10px] h-5 bg-emerald-200 text-emerald-800 border-0 mb-2">Rendah</Badge>
                  <p className="text-xs text-emerald-700">Tone Positif apapun</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Media Prioritas Tab */}
      {activeTab === "media" && (
        <div className="space-y-5">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#1e3a5f]" />
                Media Prioritas Scraping
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="text-[10px] h-5 bg-red-100 text-red-700 border-0">Prioritas 1</Badge>
                  <span className="text-xs text-slate-500">Media utama, skor +10</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mediaPriority1.map((m) => (
                    <Badge key={m} variant="outline" className="text-xs font-normal border-red-200 text-red-700 bg-red-50/50">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="text-[10px] h-5 bg-orange-100 text-orange-700 border-0">Prioritas 2</Badge>
                  <span className="text-xs text-slate-500">Media sekunder</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mediaPriority2.map((m) => (
                    <Badge key={m} variant="outline" className="text-xs font-normal border-orange-200 text-orange-700 bg-orange-50/50">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="text-[10px] h-5 bg-amber-100 text-amber-700 border-0">Prioritas 3</Badge>
                  <span className="text-xs text-slate-500">Media tambahan</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mediaPriority3.map((m) => (
                    <Badge key={m} variant="outline" className="text-xs font-normal border-amber-200 text-amber-700 bg-amber-50/50">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Keyword Tab */}
      {activeTab === "keyword" && (
        <div className="space-y-5">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#1e3a5f]" />
                Custom Keywords
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Tambah keyword baru..."
                  className="text-sm"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                />
                <Button size="sm" className="h-9 bg-[#1e3a5f] hover:bg-[#152a45]" onClick={handleAddKeyword}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {customKeywords.map((kw) => (
                  <Badge
                    key={kw}
                    variant="outline"
                    className="text-xs font-normal px-2 py-1 border-slate-300 text-slate-700 bg-white flex items-center gap-1"
                  >
                    {kw}
                    <button
                      onClick={() => handleRemoveKeyword(kw)}
                      className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === "schedule" && (
        <div className="space-y-5">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1e3a5f]" />
                Jadwal Scraping Otomatis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {[
                  { time: "07:00", label: "Pagi", desc: "Scraping awal hari, cek berita semalam", active: true },
                  { time: "12:00", label: "Siang", desc: "Update berita siang, pantau perkembangan", active: true },
                  { time: "16:00", label: "Sore", desc: "Scraping akhir hari, ringkasan harian", active: true },
                ].map((schedule) => (
                  <div
                    key={schedule.time}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#1e3a5f]">{schedule.time}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{schedule.label}</p>
                        <p className="text-xs text-slate-500">{schedule.desc}</p>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "text-[10px] h-5 border-0",
                        schedule.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {schedule.active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-start gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-blue-800">Auto-refresh</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Sistem akan otomatis melakukan scraping pada jadwal yang ditentukan.
                      Jika terdeteksi berita risiko tinggi, alert akan langsung dikirimkan.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
