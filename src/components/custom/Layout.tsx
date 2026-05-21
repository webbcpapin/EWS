import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ArticlesProvider } from "@/hooks/useArticles";

export default function Layout() {
  return (
    <ArticlesProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
          <Toaster />
        </main>
      </div>
    </ArticlesProvider>
  );
}