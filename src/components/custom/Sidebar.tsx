import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Newspaper,
  BarChart3,
  ShieldAlert,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Activity,
  FileText,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    label: "Berita",
    icon: Newspaper,
    path: "/berita",
    children: [
      { label: "Semua Berita", path: "/berita" },
      { label: "Prioritas Tinggi", path: "/berita?status=Prioritas Tinggi" },
      { label: "Perlu Review", path: "/berita?status=Perlu Review" },
    ],
  },
  {
    label: "Analisis",
    icon: BarChart3,
    path: "/analisis",
  },
  {
    label: "Alert & Risiko",
    icon: ShieldAlert,
    path: "/alert",
  },
  {
    label: "Aktivitas",
    icon: Activity,
    path: "/aktivitas",
  },
  {
    label: "Laporan",
    icon: FileText,
    path: "/laporan",
  },
  {
    label: "Pengaturan",
    icon: Settings,
    path: "/pengaturan",
    children: [
      { label: "Filter Engine", path: "/pengaturan" },
      { label: "Media Prioritas", path: "/pengaturan?tab=media" },
      { label: "Keyword", path: "/pengaturan?tab=keyword" },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>("Berita");

  const toggleExpand = (label: string) => {
    setExpandedMenu((prev) => (prev === label ? null : label));
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path.split("?")[0]);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-[#2980b9]">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-sidebar-foreground leading-tight truncate">
            EWS BC Pangkalpinang
          </h1>
          <p className="text-[10px] text-sidebar-foreground/60 leading-tight">
            Early Warning System
          </p>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="px-4 py-3 mx-3 mt-3 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-200/30">
        <div className="flex items-center gap-2 mb-1.5">
          <Bell className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wide">
            Alert Aktif
          </span>
        </div>
        <p className="text-lg font-bold text-sidebar-foreground">3</p>
        <p className="text-[10px] text-sidebar-foreground/60">Berita risiko kritis</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          const hasChildren = item.children && item.children.length > 0;
          const expanded = expandedMenu === item.label;

          return (
            <div key={item.label}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {expanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {expanded && (
                    <div className="ml-6 mt-0.5 space-y-0.5">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] transition-all",
                            location.pathname + location.search === child.path
                              ? "text-sidebar-accent-foreground font-medium bg-sidebar-accent/60"
                              : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  <span>{item.label}</span>
                  {item.label === "Alert & Risiko" && (
                    <span className="ml-auto flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                      3
                    </span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center">
            <span className="text-xs font-bold text-white">HU</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">Tim Humas</p>
            <p className="text-[10px] text-sidebar-foreground/50">KPPBC TMP C Pangkalpinang</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-[#1e3a5f] text-white shadow-lg"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-[260px] bg-[#0f172a] text-slate-100 transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Spacer for desktop */}
      <div className="hidden lg:block w-[260px] shrink-0" />
    </>
  );
}
