import { Routes, Route } from "react-router";
import Layout from "@/components/custom/Layout";
import Home from "@/pages/Home";
import Berita from "@/pages/Berita";
import Analisis from "@/pages/Analisis";
import Alert from "@/pages/Alert";
import Aktivitas from "@/pages/Aktivitas";
import Laporan from "@/pages/Laporan";
import Pengaturan from "@/pages/Pengaturan";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/berita" element={<Berita />} />
        <Route path="/berita/:articleId" element={<Berita />} />
        <Route path="/analisis" element={<Analisis />} />
        <Route path="/alert" element={<Alert />} />
        <Route path="/aktivitas" element={<Aktivitas />} />
        <Route path="/laporan" element={<Laporan />} />
        <Route path="/pengaturan" element={<Pengaturan />} />
      </Route>
    </Routes>
  );
}
