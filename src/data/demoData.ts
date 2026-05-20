import type { NewsArticle, ValidationStatus, FollowUpStatus } from "@/types/news";
import { calculateRelevance, getRiskLevel, determineIssueType } from "@/lib/relevanceFilter";

const rawData = [
  {
    no: 1, tanggal: "15 januari 2025", bulan: "Januari", tahun: 2025,
    sumber: "media lokal", kategori: "Rokok Ilegal", media: "jejakkasuslive.com",
    wartawan: "Tim", judul: "Bos Rokok Ilegal FERY, Kalau Mau Bertemen Saya Wellcom, Tapi Berita Sudah Terbit",
    isi: "Bos rokok ilegal Fery menanggapi pemberitaan terkait peredaran rokok ilegal di Pangkalpinang",
    tone: "Negatif" as const, link: "https://jejakkasuslive.com/bos-rokok-ilegal-fery-kalau-mau-bertemen-saya-wellcom-tapi-berita-sudah-terbit/"
  },
  {
    no: 2, tanggal: "15 januari 2025", bulan: "Januari", tahun: 2025,
    sumber: "media lokal", kategori: "Rokok Ilegal", media: "langkahbabel.com",
    wartawan: "Tim", judul: "Bos Rokok Ilegal FERI, Akui Gudang Punya Saya, Kapan Bapak Bisa Ketemu Saya, Bawa Juga Nara Sumber nya",
    isi: "Bos rokok ilegal Feri mengakui gudang rokok ilegal miliknya dan menantang aparat",
    tone: "Negatif" as const, link: "https://langkahbabel.com/bos-rokok-ilegal-feri-akui-gudang-punya-saya-kapan-bapak-bisa-ketemu-saya-bawa-juga-nara-sumber-nya/"
  },
  {
    no: 3, tanggal: "16 januari 2025", bulan: "Januari", tahun: 2025,
    sumber: "media lokal", kategori: "Rokok Ilegal", media: "jejakkasus212.info",
    wartawan: "Tim", judul: "Aparat Penegak Hukum dan Bea Cukai Seharusnya Gercep terkait Maraknya Peredaran Rokok Ilegal di Pangkalpinang",
    isi: "Publik menuntut aparat dan Bea Cukai lebih tegas menangani rokok ilegal di Pangkalpinang",
    tone: "Negatif" as const, link: "https://jejakkasus212.info/aparat-penegak-hukum-dan-bea-cukai-seharusnya-gercep-terkait-maraknya-peredaran-rokok-ilegal-di-pangkalpinang/"
  },
  {
    no: 4, tanggal: "16 januari 2025", bulan: "Januari", tahun: 2025,
    sumber: "media lokal", kategori: "Rokok Ilegal", media: "mediapolisi.or.id",
    wartawan: "Muhammad Bonedi", judul: "penyimpanan rokok ilegal berada tidak jauh dari Markas Kepolisian Daerah Bangka Belitung (MAPOLDA BABEL)",
    isi: "Ditemukan lokasi penyimpanan rokok ilegal dekat Mapolda Babel, menunjukkan lemahnya pengawasan",
    tone: "Negatif" as const, link: "https://mediapolisi.or.id/penyimpanan-rokok-ilegal-berada-tidak-jauh-dari-markas-kepolisian-daerah-bangka-belitung-mapolda-babel/"
  },
  {
    no: 5, tanggal: "17 januari 2025", bulan: "Januari", tahun: 2025,
    sumber: "media lokal", kategori: "Event Kantor", media: "faktaberita.co.id",
    wartawan: "Tim", judul: "Bea Cukai Pangkalpinang Gelar ICD Virtual Run and Walk, Jaga Semangat Kerja di Tahun 2025",
    isi: "Kegiatan virtual run and walk untuk memperingati hari jadi Bea Cukai dan menjaga semangat kerja",
    tone: "Positif" as const, link: "https://www.faktaberita.co.id/bea-cukai-pangkalpinang-gelar-icd-virtual-run-and-walk-jaga-semangat-kerja-di-tahun-2025/"
  },
  {
    no: 6, tanggal: "16 januari 2025", bulan: "Januari", tahun: 2025,
    sumber: "media lokal", kategori: "Event Kantor", media: "bangka.tribunnews.com",
    wartawan: "Tim", judul: "Rayakan Hari Pabean Internasional, Bea Cukai Pangkalpinang Gelar Donor Darah",
    isi: "Bea Cukai Pangkalpinang menggelar donor darah dalam rangka Hari Pabean Internasional 2025",
    tone: "Positif" as const, link: "https://bangka.tribunnews.com/2025/01/16/rayakan-hari-pabean-internasional-bea-cukai-pangkalpinang-gelar-donor-darah"
  },
  {
    no: 7, tanggal: "16 januari 2025", bulan: "Januari", tahun: 2025,
    sumber: "media lokal", kategori: "Event Kantor", media: "belitung.tribunnews.com",
    wartawan: "Sela Agustika", judul: "Peringati Hari Pabean Internasional 2025, Bea Cukai Pangkalpinang Adakan Donor Darah",
    isi: "Peringatan Hari Pabean Internasional dengan kegiatan donor darah di Pangkalpinang",
    tone: "Positif" as const, link: "https://belitung.tribunnews.com/2025/01/16/peringati-hari-pabean-internasional-2025-bea-cukai-pangkalpinang-adakan-donor-darah"
  },
  {
    no: 8, tanggal: "21 Januari 2025", bulan: "Januari", tahun: 2025,
    sumber: "media lokal", kategori: "Rokok Ilegal", media: "bangka.tribunnews.com",
    wartawan: "Sepri Sumartono", judul: "10 Merek Rokok Ilegal Tanpa Cukai Beredar di Sungaiselan dan Lubukbesar Bangka Tengah",
    isi: "Ditemukan 10 merek rokok ilegal beredar di Bangka Tengah tanpa pita cukai",
    tone: "Negatif" as const, link: "https://bangka.tribunnews.com/2025/01/21/10-merek-rokok-ilegal-tanpa-cukai-beredar-di-sungaiselan-dan-lubukbesar-bangka-tengah"
  },
  {
    no: 9, tanggal: "24 Februari 2025", bulan: "Februari", tahun: 2025,
    sumber: "media nasional", kategori: "Dukungan UMKM", media: "supplychainindonesia.com",
    wartawan: "Tim", judul: "Bea Cukai Pangkalpinang Permudah Urus Izin Ekspor Pelaku UMKM",
    isi: "Bea Cukai Pangkalpinang memberikan kemudahan perizinan ekspor bagi pelaku UMKM",
    tone: "Positif" as const, link: "https://supplychainindonesia.com/bea-cukai-pangkalpinang-permudah-urus-izin-ekspor-pelaku-umkm/"
  },
  {
    no: 10, tanggal: "21 Februari 2025", bulan: "Februari", tahun: 2025,
    sumber: "media lokal", kategori: "Sosialisasi tusi BC sekolah dan perguruan tinggi", media: "faktaberita.co.id",
    wartawan: "Tim", judul: "Bea Cukai Pangkalpinang Kenalkan Peran dan Fungsinya kepada Mahasiswa UBB",
    isi: "Sosialisasi peran dan fungsi Bea Cukai kepada mahasiswa Universitas Bangka Belitung",
    tone: "Positif" as const, link: "https://www.faktaberita.co.id/bea-cukai-pangkalpinang-kenalkan-peran-dan-fungsinya-kepada-mahasiswa-ubb/"
  },
  {
    no: 11, tanggal: "25 Februari 2025", bulan: "Februari", tahun: 2025,
    sumber: "media lokal", kategori: "Dukungan UMKM", media: "bangka.tribunnews.com",
    wartawan: "Sela Agustika", judul: "Target Masuk Pasar Global, Bea Cukai Pangkalpinang Dampingi Asistensi Perizinan Keripik Cumi Nina",
    isi: "Pendampingan UMKM keripik cumi untuk memasuki pasar ekspor global",
    tone: "Positif" as const, link: "https://bangka.tribunnews.com/2025/02/25/target-masuk-pasar-global-bea-cukai-pangkalpinang-dampingi-asistensi-perizinan-keripik-cumi-nina"
  },
  {
    no: 12, tanggal: "20 Februari 2025", bulan: "Februari", tahun: 2025,
    sumber: "media lokal", kategori: "Dukungan UMKM", media: "faktaberita.co.id",
    wartawan: "Tim", judul: "Kopi Soedara Siap Tembus Pasar Malaysia, Bea Cukai Pangkalpinang Beri Pendampingan",
    isi: "UMKM kopi Soedara didampingi Bea Cukai untuk ekspor ke Malaysia",
    tone: "Positif" as const, link: "https://www.faktaberita.co.id/kopi-soedara-siap-tembus-pasar-malaysia-bea-cukai-pangkalpinang-beri-pendampingan/"
  },
  // Data 2026
  {
    no: 1, tanggal: "26/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal", kategori: "Media Massa", media: "unggahan.id",
    wartawan: "rendi unggahan", judul: "Oknum Bea Cukai Pangkalpinang Akhirnya Minta Maaf Usai Intimidasi Wartawan",
    isi: "Oknum Bea Cukai Pangkalpinang meminta maaf setelah terbukti mengintimidasi wartawan",
    tone: "Negatif" as const, link: "https://unggahan.id/oknum-bea-cukai-pangkalpinang-akhirnya-minta-maaf-usai-intimidasi-wartawan/"
  },
  {
    no: 2, tanggal: "29/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal", kategori: "Media Massa", media: "beritalain.id",
    wartawan: "Ara", judul: "Aliansi BEM SI Babel Layangkan 7 Tuntutan ke Bea Cukai Pangkalpinang Terkait Rokok Ilegal",
    isi: "Aliansi BEM SI Babel melontarkan 7 tuntutan terkait maraknya rokok ilegal di Bangka Belitung",
    tone: "Negatif" as const, link: "https://www.beritalain.id/detailpost/aliansi-bem-si-babel-layangkan-7-tuntutan-ke-bea-cukai-pangkalpinang-terkait-rokok-ilegal"
  },
  {
    no: 3, tanggal: "26/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal", kategori: "Penindakan", media: "babelaktual.com",
    wartawan: "Admin Tim", judul: "Misteri 25 Ton Timah Selundupan Tangkapan Bea Cukai: Aki Pemain Baru yang Berani Gerakkan Skala Besar",
    isi: "Penindakan penyelundupan 25 ton timah oleh Bea Cukai, diduga dalang bernama Aki",
    tone: "Positif" as const, link: "https://www.babelaktual.com/misteri-25-ton-timah-selundupan-tangkapan-bea-cukai-aki-pemain-baru-yang-berani-gerakkan-skala-besar/"
  },
  {
    no: 4, tanggal: "15/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media nasional", kategori: "Penindakan", media: "detik.com",
    wartawan: "Deni Wahyono", judul: "Satgas Halilintar-Bea Cukai Gagalkan Penyelundupan 25 Ton Pasir Timah",
    isi: "Satgas Halilintar bersama Bea Cukai berhasil menggagalkan penyelundupan 25 ton pasir timah",
    tone: "Positif" as const, link: "https://www.detik.com/sumbagsel/hukum-dan-kriminal/d-8307957/satgas-halilintar-bea-cukai-gagalkan-penyelundupan-25-ton-pasir-timah"
  },
  {
    no: 5, tanggal: "20/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal", kategori: "Media Massa", media: "babelhebat.com",
    wartawan: "Tim", judul: "Oknum Bea Cukai Pangkalpinang Minta Maaf ke Wartawan",
    isi: "Oknum Bea Cukai Pangkalpinang mengucapkan permintaan maaf kepada wartawan",
    tone: "Negatif" as const, link: "https://babelhebat.com/babelhebat/pangkalpinang/oknum-bea-cukai-pangkalpinang-minta-maaf-ke-wartawan/"
  },
  {
    no: 6, tanggal: "14/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal", kategori: "Penindakan", media: "radarbahtera.com",
    wartawan: "radarbahtera", judul: "25 Ton Timah Ilegal Dicegat di Laut Babel, Bea Cukai TNI AL Pasang Segel Resmi",
    isi: "Tim gabungan Bea Cukai dan TNI AL menangkap 25 ton timah ilegal di laut Babel",
    tone: "Positif" as const, link: "https://www.radarbahtera.com/25-ton-timah-ilegal-dicegat-di-laut-babel-bea-cukai-tni-al-pasang-segel-resmi/"
  },
  {
    no: 7, tanggal: "26/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal", kategori: "Rokok Ilegal", media: "faktaberita.co.id",
    wartawan: "Admin Tim", judul: "Bea Cukai Pangkalpinang Berantas Rokok Ilegal",
    isi: "Bea Cukai Pangkalpinang aktif memberantas peredaran rokok ilegal di wilayahnya",
    tone: "Positif" as const, link: "https://www.faktaberita.co.id/bea-cukai-pangkalpinang-berantas-rokok-ilegal-2/2/"
  },
  {
    no: 8, tanggal: "27/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal", kategori: "Penindakan", media: "babelupdate.com",
    wartawan: "Admin Tim", judul: "Manuver Aki Pemain Baru Diduga Dalang 25 Ton Timah Selundupan Tangkapan Bea Cukai Pangkalpinang dan Satgas",
    isi: "Identitas Aki sebagai dalang penyelundupan 25 ton timah terus diusut Bea Cukai",
    tone: "Positif" as const, link: "https://babelupdate.com/manuver-aki-pemain-baru-diduga-dalang-25-ton-timah-selundupan-tangkapan-bea-cukai-pangkalpinang-dan-satgas/"
  },
  {
    no: 9, tanggal: "27/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal", kategori: "Penindakan", media: "linesnews.co.id",
    wartawan: "Admin Tim", judul: "Dalang Penyelundupan 25 Ton Timah Dikenal Sebagai Aki, Publik Tunggu Aparat Berani Menelusuri Jaringannya?",
    isi: "Publik menunggu tindak lanjut aparat menelusuri jaringan dalang penyelundupan timah",
    tone: "Positif" as const, link: "https://linesnews.co.id/dalang-penyelundupan-25-ton-timah-dikenal-sebagai-aki-publik-tunggu-aparat-berani-menelusuri-jaringannya/"
  },
  {
    no: 10, tanggal: "29/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal", kategori: "Rokok Ilegal", media: "ayobangka.com",
    wartawan: "Admin Tim", judul: "Peredaran Rokok Ilegal Merajalela, Aliansi BEM SI Babel Pertanyakan Kinerja Bea Cukai Pangkalpinang",
    isi: "Aliansi BEM mempertanyakan kinerja Bea Cukai terkait maraknya rokok ilegal",
    tone: "Negatif" as const, link: "https://ayobangka.com/peredaran-rokok-ilegal-merajalela-aliansi-bem-si-babel-pertanyakan-kinerja-bea-cukai-pangkalpinang/"
  },
  {
    no: 11, tanggal: "15/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal", kategori: "Penindakan", media: "inlens.id",
    wartawan: "inlens", judul: "Bea Cukai belum puas, dalang penyelundupan 25 ton timah diburu",
    isi: "Bea Cukai terus memburu dalang penyelundupan 25 ton timah yang belum tertangkap",
    tone: "Positif" as const, link: "https://inlens.id/2026/01/15/bea-cukai-belum-puas-dalang-penyelundupan-25-ton-timah-diburu/"
  },
  {
    no: 12, tanggal: "14/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal", kategori: "Media Massa", media: "redaksibabel.com",
    wartawan: "Aby", judul: "Tim Gabungan Amankan Kapal Timah ke Malaysia, Wartawan Diduga Diintimidasi di Lokasi",
    isi: "Wartawan diduga diintimidasi saat meliput penindakan kapal timah ilegal",
    tone: "Negatif" as const, link: "https://redaksibabel.com/tim-gabungan-amankan-kapal-timah-ke-malaysia-wartawan-diduga-diintimidasi-di-lokasi/"
  },
  {
    no: 13, tanggal: "08/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal", kategori: "Penindakan", media: "inlens.id",
    wartawan: "inlens", judul: "IMM: Babel lolosnya 30 ton pasir zicron bukan kelalaian tapi kegagalan pengawasan",
    isi: "IMM menyatakan lolosnya 30 ton pasir zirkon akibat kegagalan pengawasan",
    tone: "Negatif" as const, link: "https://inlens.id/2026/01/08/imm-babel-lolosnya-30-ton-zirkon-bukan-kelalaian-tapi-kegagalan-pengawasan/"
  },
  {
    no: 14, tanggal: "20/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal", kategori: "Media Massa", media: "radarbahtera.com",
    wartawan: "Khamelia Marsha", judul: "Sempat Intimidasi Wartawan, Oknum Bea Cukai Pangkalpinang Akhirnya Minta Maaf Terbuka",
    isi: "Oknum Bea Cukai yang sempat intimidasi wartawan akhirnya minta maaf secara terbuka",
    tone: "Positif" as const, link: "https://www.liputan6.com/news/read/6258258/guru-besar-ipb-bangka-belitung-berpotensi-jadi-penghasil-blue-carbon-dengan-nilai-ekonomi-tinggi"
  },
  {
    no: 15, tanggal: "03/02/2026", bulan: "Februari", tahun: 2026,
    sumber: "media nasional", kategori: "Rokok Ilegal", media: "berita.rri.co.id",
    wartawan: "Deby Nirwandi", judul: "Bea Cukai Pangkalpinang Amankan 8.100 Batang Rokok Ilegal",
    isi: "Bea Cukai Pangkalpinang mengamankan 8.100 batang rokok ilegal di wilayah kerjanya",
    tone: "Positif" as const, link: "https://berita.rri.co.id/sungailiat/regional/2156147/bea-cukai-pangkalpinang-amankan-8-100-batang-rokok-ilegal"
  },
  {
    no: 16, tanggal: "25/02/2026", bulan: "Februari", tahun: 2026,
    sumber: "media lokal", kategori: "Dukungan UMKM", media: "realita.news",
    wartawan: "Admin Realita", judul: "Bea Cukai Permudah Layanan Ekspor Produk UMKM Bangka Belitung ke Luar Negeri",
    isi: "Bea Cukai memberikan kemudahan layanan ekspor produk UMKM Babel ke luar negeri",
    tone: "Positif" as const, link: "https://realita.news/bea-cukai-permudah-layanan-ekspor-produk-umkm-bangka-belitung-ke-luar-negeri/"
  },
  {
    no: 17, tanggal: "25/02/2026", bulan: "Februari", tahun: 2026,
    sumber: "media lokal", kategori: "Dukungan UMKM", media: "mediaqu.id",
    wartawan: "Ahmad Yusuf", judul: "Getas Bangka Produksi UMKM Lokal kembali diekspor, Bea Cukai Pangkalpinang beri Fasilitas Khusus",
    isi: "Produk Getas Bangka diekspor kembali dengan fasilitas khusus dari Bea Cukai",
    tone: "Positif" as const, link: "https://mediaqu.id/2026/02/25/getas-bangka-produksi-umkm-lokal-kembali-diekspor-bea-cukai-pangkalpinang-beri-fasilitas-khusus/"
  },
  {
    no: 18, tanggal: "05/02/2026", bulan: "Februari", tahun: 2026,
    sumber: "media nasional", kategori: "Rokok Ilegal", media: "m.jpnn.com",
    wartawan: "Sutresno Wahyudi", judul: "Tindaklanjuti Aduan Masyarakat, Bea Cukai Sita 8.100 Batang Rokok Ilegal di Pangkalpinang",
    isi: "Bea Cukai menyita rokok ilegal di Pangkalpinang berdasarkan aduan masyarakat",
    tone: "Positif" as const, link: "https://m.jpnn.com/news/tindaklanjuti-aduan-masyarakat-bea-cukai-sita-8100-batang-rokok-ilegal-di-pangkalpinang"
  },
  {
    no: 19, tanggal: "21/04/2026", bulan: "April", tahun: 2026,
    sumber: "media nasional", kategori: "Pengawasan", media: "regional.kompas.com",
    wartawan: "Heru Dahnur, Ihsanuddin", judul: "15 Kontainer Diduga Ilmenit Ditahan di Pelabuhan Pangkalbalam, Sampel Masih Diuji",
    isi: "15 kontainer diduga berisi ilmenit ditahan di Pelabuhan Pangkalbalam",
    tone: "Netral" as const, link: "https://regional.kompas.com/read/2026/04/21/122356778/15-kontainer-diduga-ilmenit-ditahan-di-pelabuhan-pangkalbalam-sampel-masih"
  },
  {
    no: 20, tanggal: "20/04/2026", bulan: "April", tahun: 2026,
    sumber: "media lokal", kategori: "Dukungan UMKM", media: "babel.antaranews.com",
    wartawan: "", judul: "UMKM kopi Babel: dari tren gaya hidup menuju pilar ekonomi daerah",
    isi: "UMKM kopi Babel berkembang dari tren gaya hidup menjadi pilar ekonomi daerah",
    tone: "Positif" as const, link: "https://babel.antaranews.com/berita/558883/umkm-kopi-babel-dari-tren-gaya-hidup-menuju-pilar-ekonomi-daerah"
  },
  {
    no: 21, tanggal: "14/05/2026", bulan: "Mei", tahun: 2026,
    sumber: "media lokal", kategori: "Rokok Ilegal", media: "satuju.com",
    wartawan: "", judul: "KBO Babel Desak Dirjen Bea Cukai Investigasi Dugaan Pembiaran Rokok Ilegal di Bangka Belitung",
    isi: "KBO Babel mendesak Dirjen Bea Cukai untuk menginvestigasi dugaan pembiaran rokok ilegal",
    tone: "Negatif" as const, link: "https://www.satuju.com/berita/15256/kbo-babel-desak-dirjen-bea-cukai-investigasi-dugaan-pembiaran-rokok-ilegal-di-bangka-belitung.html"
  },
  {
    no: 22, tanggal: "14/05/2026", bulan: "Mei", tahun: 2026,
    sumber: "media lokal", kategori: "Rokok Ilegal", media: "wartaindonesianews.co.id",
    wartawan: "", judul: "KBO Babel Laporkan Dugaan Maraknya Rokok Ilegal ke Dirjen Bea Cukai, Desak Investigasi Menyeluruh",
    isi: "KBO Babel melaporkan dugaan maraknya rokok ilegal ke Dirjen Bea Cukai",
    tone: "Negatif" as const, link: "https://www.wartaindonesianews.co.id/2026/05/kbo-babel-laporkan-dugaan-maraknya.html"
  },
  {
    no: 23, tanggal: "14/05/2026", bulan: "Mei", tahun: 2026,
    sumber: "media lokal", kategori: "Rokok Ilegal", media: "mapikornews.com",
    wartawan: "", judul: "KBO Babel Resmi Adukan Dugaan Pembiaran Rokok Ilegal ke Dirjen Bea Cukai",
    isi: "KBO Babel resmi mengadukan dugaan pembiaran rokok ilegal ke Dirjen Bea Cukai",
    tone: "Negatif" as const, link: "https://mapikornews.com/daerah/kbo-babel-resmi-adukan-dugaan-pembiaran-rokok-ilegal-ke-dirjen-bea-cukai"
  },
];

// Synthetic additional data for variety
const additionalData = [
  {
    no: 24, tanggal: "10/05/2026", bulan: "Mei", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Penindakan", media: "bangkapos.com",
    wartawan: "Ahmad Rizki", judul: "Bea Cukai Pangkalpinang Gagalkan Penyelundupan Rokok Ilegal Senilai 2 Miliar",
    isi: "Bea Cukai Pangkalpinang berhasil menggagalkan penyelundupan rokok ilegal senilai 2 miliar rupiah di Pelabuhan Pangkalbalam",
    tone: "Positif" as const, link: "https://bangkapos.com/read/2026/05/10/bea-cukai-pangkalpinang-gagalkan-penyelundupan-rokok-ilegal"
  },
  {
    no: 25, tanggal: "12/05/2026", bulan: "Mei", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Sinergi Instansi", media: "antarababel.com",
    wartawan: "Siti Nurhaliza", judul: "Bea Cukai Pangkalpinang Jalin Sinergi dengan Polres Bangka Selatan Perangi Rokok Ilegal",
    isi: "Penandatanganan MoU antara Bea Cukai Pangkalpinang dan Polres Bangka Selatan untuk perangi rokok ilegal",
    tone: "Positif" as const, link: "https://antarababel.com/berita/2026/05/sinergi-bea-cukai-polres-bangka-selatan"
  },
  {
    no: 26, tanggal: "08/05/2026", bulan: "Mei", tahun: 2026,
    sumber: "media nasional" as const, kategori: "Kebijakan Cukai", media: "kompas.com",
    wartawan: "Budi Santoso", judul: "Pemerintah Tinjau Ulang Tarif Cukai Rokok, Bea Cukai Pangkalpinang Siap Sosialisasikan",
    isi: "Pemerintah akan meninjau ulang tarif cukai rokok tahun ini, Bea Cukai Pangkalpinang bersiap melakukan sosialisasi",
    tone: "Netral" as const, link: "https://kompas.com/read/2026/05/08/tinjau-ulang-tarif-cukai-rokok"
  },
  {
    no: 27, tanggal: "05/05/2026", bulan: "Mei", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Layanan Publik", media: "babelpos.com",
    wartawan: "Dewi Kartika", judul: "Bea Cukai Pangkalpinang Luncurkan Layanan Digital untuk Eksportir UMKM",
    isi: "Peluncuran layanan digital untuk memudahkan UMKM mengurus perizinan ekspor",
    tone: "Positif" as const, link: "https://babelpos.com/2026/05/layanan-digital-bea-cukai-umkm"
  },
  {
    no: 28, tanggal: "01/05/2026", bulan: "Mei", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Rokok Ilegal", media: "satuju.com",
    wartawan: "Rendra Wijaya", judul: "Gudang Rokok Ilegal di Muntok Digerebek, Polisi Temukan Ribuan Slop",
    isi: "Penggerebekan gudang rokok ilegal di Muntok, polisi menemukan ribuan slop rokok tanpa pita cukai",
    tone: "Negatif" as const, link: "https://satuju.com/berita/2026/05/gudang-rokok-ilegal-muntok"
  },
  {
    no: 29, tanggal: "28/04/2026", bulan: "April", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Penindakan", media: "linesnews.co.id",
    wartawan: "Tim Redaksi", judul: "Tim Gabungan Bea Cukai-TNI AL Tangkap Kapal Bawa 10 Ton Pasir Timah Ilegal",
    isi: "Tim gabungan menangkap kapal membawa 10 ton pasir timah ilegal di perairan Bangka",
    tone: "Positif" as const, link: "https://linesnews.co.id/2026/04/tim-gabungan-tangkap-kapal-timah"
  },
  {
    no: 30, tanggal: "25/04/2026", bulan: "April", tahun: 2026,
    sumber: "media nasional" as const, kategori: "Ekspor Impor", media: "bisnis.com",
    wartawan: "Eko Prasetyo", judul: "Ekspor Lada Putih Bangka Melesat 40 Persen di Kuartal Pertama 2026",
    isi: "Nilai ekspor lada putih asal Bangka meningkat 40 persen pada kuartal pertama tahun ini",
    tone: "Positif" as const, link: "https://bisnis.com/read/20260425/ekspor-lada-bangka"
  },
  {
    no: 31, tanggal: "18/04/2026", bulan: "April", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Media Massa Negatif", media: "babelreview.com",
    wartawan: "Lina Susanti", judul: "Warga Pangkalpinang Keluhkan Maraknya Rokok Ilegal, Apakah Bea Cukai Lemah Pengawasan?",
    isi: "Warga Pangkalpinang mengeluhkan maraknya peredaran rokok ilegal dan mempertanyakan pengawasan Bea Cukai",
    tone: "Negatif" as const, link: "https://babelreview.com/2026/04/warga-keluhkan-rokok-ilegal"
  },
  {
    no: 32, tanggal: "15/04/2026", bulan: "April", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Event Kantor", media: "faktaberita.co.id",
    wartawan: "Tim", judul: "Bea Cukai Pangkalpinang Gelar Coffee Morning Bersama Media Massa",
    isi: "Kegiatan coffee morning bersama media massa untuk mempererat silaturahmi dan menyampaikan program kerja",
    tone: "Positif" as const, link: "https://faktaberita.co.id/coffee-morning-bea-cukai-media"
  },
  {
    no: 33, tanggal: "10/04/2026", bulan: "April", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Pengawasan", media: "kabarbangka.com",
    wartawan: "Agus Wijaya", judul: "Bea Cukai Pangkalpinang Perketat Pengawasan Barang Kiriman di Bandara Depati Amir",
    isi: "Pengawasan lebih ketat terhadap barang kiriman penumpang di Bandara Depati Amir Pangkalpinang",
    tone: "Netral" as const, link: "https://kabarbangka.com/2026/04/pengawatan-barang-kiriman"
  },
  {
    no: 34, tanggal: "05/04/2026", bulan: "April", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Tuduhan/Hoaks", media: "wowbabel.com",
    wartawan: "Siska Devi", judul: "Hoaks! Beredar Info Bea Cukai Pangkalpinang Tarik Pajak Ekspor UMKM",
    isi: "Klarifikasi terhadap beredar informasi palsu tentang pajak ekspor UMKM oleh Bea Cukai",
    tone: "Negatif" as const, link: "https://wowbabel.com/2026/04/hoaks-pajak-ekspor-umkm"
  },
  {
    no: 35, tanggal: "01/04/2026", bulan: "April", tahun: 2026,
    sumber: "media lokal" as const, kategori: "UMKM Ekspor", media: "bangkaterkini.com",
    wartawan: "Maya Anggraini", judul: "Getas Bangka Go International, Bea Cukai Fasilitasi Sertifikasi Ekspor",
    isi: "Bea Cukai membantu UMKM Getas Bangka mendapatkan sertifikasi untuk ekspor ke mancanegara",
    tone: "Positif" as const, link: "https://bangkaterkini.com/2026/04/getas-bangka-international"
  },
  {
    no: 36, tanggal: "25/03/2026", bulan: "Maret", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Penindakan", media: "radarbahtera.com",
    wartawan: "Rudi Hartono", judul: "Bea Cukai Pangkalpinang Sita 500 Ballpres Sarden Impor Ilegal di Pelabuhan Belinyu",
    isi: "Penindakan 500 ballpres sarden impor ilegal yang masuk melalui Pelabuhan Belinyu",
    tone: "Positif" as const, link: "https://radarbahtera.com/2026/03/sarden-impor-ilegal-belinyu"
  },
  {
    no: 37, tanggal: "20/03/2026", bulan: "Maret", tahun: 2026,
    sumber: "media nasional" as const, kategori: "Kebijakan Kepabeanan", media: "kontan.co.id",
    wartawan: "Diana Kusuma", judul: "Aturan Baru Kepabeanan 2026: Bea Cukai Pangkalpinang Siap Implementasikan",
    isi: "Bea Cukai Pangkalpinang bersiap mengimplementasikan aturan kepabeanan terbaru tahun 2026",
    tone: "Netral" as const, link: "https://kontan.co.id/2026/03/aturan-kepabeanan-baru"
  },
  {
    no: 38, tanggal: "15/03/2026", bulan: "Maret", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Sinergi Instansi", media: "babelpos.com",
    wartawan: "Andi Pratama", judul: "Bea Cukai-Kejaksaan Negeri Pangkalpinang Perkuat Kerja Sama Penegakan Hukum",
    isi: "Penguatan kerja sama antara Bea Cukai dan Kejaksaan Negeri Pangkalpinang dalam penegakan hukum",
    tone: "Positif" as const, link: "https://babelpos.com/2026/03/sinergi-bea-cukai-kejaksaan"
  },
  {
    no: 39, tanggal: "10/03/2026", bulan: "Maret", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Rokok Ilegal", media: "satuju.com",
    wartawan: "Beni Kurniawan", judul: "Jaringan Rokok Igal di Sungailiat Dibongkar, Polres Gandeng Bea Cukai",
    isi: "Pembongkaran jaringan peredaran rokok ilegal di Sungailiat dengan kerja sama Polres dan Bea Cukai",
    tone: "Positif" as const, link: "https://satuju.com/berita/2026/03/jaringan-rokok-sungailiat"
  },
  {
    no: 40, tanggal: "05/03/2026", bulan: "Maret", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Layanan Publik", media: "bangkapos.com",
    wartawan: "Citra Lestari", judul: "Bea Cukai Pangkalpinang Buka Layanan Konsultasi Ekspor Gratis Bagi UMKM",
    isi: "Layanan konsultasi gratis bagi UMKM yang ingin mengekspor produknya",
    tone: "Positif" as const, link: "https://bangkapos.com/read/2026/03/layanan-konsultasi-ekspor-umkm"
  },
  {
    no: 41, tanggal: "28/02/2026", bulan: "Februari", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Penindakan", media: "babelaktual.com",
    wartawan: "Tim", judul: "Bea Cukai Pangkalpinang Gagalkan Upaya Penyelundupan Kayu Gaharu ke Malaysia",
    isi: "Penyelundupan kayu gaharu asal Bangka ke Malaysia berhasil digagalkan di Pelabuhan Pangkalbalam",
    tone: "Positif" as const, link: "https://babelaktual.com/2026/02/penyelundupan-kayu-gaharu"
  },
  {
    no: 42, tanggal: "22/02/2026", bulan: "Februari", tahun: 2026,
    sumber: "media nasional" as const, kategori: "Pengawasan", media: "liputan6.com",
    wartawan: "Fajar Nugraha", judul: "Bea Cukai Pangkalpinang Perketat Pengawasan di Pelabuhan Muntok Pasca Penemuan Timah Ilegal",
    isi: "Pengawasan diperketat di Pelabuhan Muntok setelah penemuan penyelundupan timah",
    tone: "Netral" as const, link: "https://liputan6.com/read/2026/02/pengawasan-muntok-timah"
  },
  {
    no: 43, tanggal: "18/02/2026", bulan: "Februari", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Media Massa Negatif", media: "inlens.id",
    wartawan: "inlens", judul: "Diduga Ada Backing, Mafia Rokok Ilegal di Bangka Belitung Sulit Diberantas",
    isi: "Dugaan adanya backing kuat di balik peredaran rokok ilegal di Bangka Belitung",
    tone: "Negatif" as const, link: "https://inlens.id/2026/02/mafia-rokok-ilegal-backing"
  },
  {
    no: 44, tanggal: "12/02/2026", bulan: "Februari", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Dukungan UMKM", media: "babelpos.com",
    wartawan: "Hani Putri", judul: "Produk Lidi Nipah Bangka Tembus Pasar Timur Tengah Berkat Fasilitasi Bea Cukai",
    isi: "Ekspor lidi nipah asal Bangka berhasil tembus pasar Timur Tengah dengan fasilitasi Bea Cukai",
    tone: "Positif" as const, link: "https://babelpos.com/2026/02/lidi-nipah-ekspor-timur-tengah"
  },
  {
    no: 45, tanggal: "08/02/2026", bulan: "Februari", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Event Kantor", media: "faktaberita.co.id",
    wartawan: "Tim", judul: "Bea Cukai Pangkalpinang Gelar Sosialisasi Cukai di Kampus UBB",
    isi: "Sosialisasi tentang cukai dan kepabeanan kepada mahasiswa Universitas Bangka Belitung",
    tone: "Positif" as const, link: "https://faktaberita.co.id/sosialisasi-cukai-ubb"
  },
  {
    no: 46, tanggal: "03/02/2026", bulan: "Februari", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Rokok Ilegal", media: "langkahbabel.com",
    wartawan: "Tim", judul: "Ratusan Slop Rokok Ilegal Disita di Pasar Pangkalpinang, Pedagang Resah",
    isi: "Penyitaan ratusan slop rokok ilegal di pasar tradisional Pangkalpinang",
    tone: "Negatif" as const, link: "https://langkahbabel.com/rokok-ilegal-pasar-pangkalpinang"
  },
  {
    no: 47, tanggal: "28/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Sinergi Instansi", media: "negerilaskarpelangi.com",
    wartawan: "Rina Amelia", judul: "Satpol PP dan Bea Cukai Pangkalpinang Gelar Razia Rokok Ilegal di Sungailiat",
    isi: "Razia gabungan Satpol PP dan Bea Cukai terhadap peredaran rokok ilegal di Sungailiat",
    tone: "Positif" as const, link: "https://negerilaskarpelangi.com/razia-rokok-sungailiat"
  },
  {
    no: 48, tanggal: "22/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media nasional" as const, kategori: "Kebijakan Cukai", media: "cnnindonesia.com",
    wartawan: "Dimas Prasetyo", judul: "Pemerintah Naikkan Tarif Cukai Rokok 12 Persen Tahun 2026",
    isi: "Kenaikan tarif cukai rokok 12 persen berlaku mulai Januari 2026",
    tone: "Netral" as const, link: "https://cnnindonesia.com/ekonomi/2026012201/naikkan-tarif-cukai-rokok"
  },
  {
    no: 49, tanggal: "18/01/2026", bulan: "Januari", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Penindakan", media: "trasberita.com",
    wartawan: "Tim", judul: "Bea Cukai Pangkalpinang Amankan 2 Kontainer Barang Impor Ilegal dari China",
    isi: "Pengamanan 2 kontainer barang impor ilegal asal China di Pelabuhan Pangkalbalam",
    tone: "Positif" as const, link: "https://trasberita.com/kontainer-impor-ilegal-china"
  },
  {
    no: 50, tanggal: "05/05/2026", bulan: "Mei", tahun: 2026,
    sumber: "media lokal" as const, kategori: "Kebijakan Kepabeanan", media: "lensabangkabelitung.com",
    wartawan: "Putra Wijaya", judul: "Bea Cukai Pangkalpinang Sosialisasikan Aturan Baru Barang Kiriman ke Masyarakat Bangka",
    isi: "Sosialisasi aturan baru terkait barang kiriman kepada masyarakat Bangka",
    tone: "Positif" as const, link: "https://lensabangkabelitung.com/sosialisasi-barang-kiriman"
  },
];

function generateId(index: number): string {
  return `BC-PP-${String(index + 1).padStart(4, "0")}`;
}

function parseDate(tanggal: string): string {
  // Try DD/MM/YYYY format
  const parts = tanggal.split("/");
  if (parts.length === 3) {
    return `20${parts[2].slice(-2)}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  // Try various date formats and return a default
  return "2026-01-15";
}

const allRawData = [...rawData, ...additionalData];

export const demoArticles: NewsArticle[] = allRawData.map((item, index) => {
  const relevance = calculateRelevance(item.judul, item.isi);
  const riskLevel = getRiskLevel(item.tone, relevance.score, relevance.sensitiveMatches) as "Rendah" | "Sedang" | "Tinggi" | "Kritis";
  const issueType = determineIssueType(item.judul, item.isi);

  const now = new Date().toISOString();
  const date = parseDate(item.tanggal);

  let validationStatus: ValidationStatus;
  if (index < 10) validationStatus = "Valid";
  else if (index < 15) validationStatus = "Selesai";
  else if (index < 20) validationStatus = "Baru";
  else if (index < 25) validationStatus = "Perlu Review";
  else if (index < 30) validationStatus = "Valid";
  else if (index < 35) validationStatus = "Valid";
  else if (index < 40) validationStatus = "Baru";
  else if (index < 45) validationStatus = "Selesai";
  else validationStatus = "Valid";

  const followUpStatus: FollowUpStatus =
    validationStatus === "Selesai" ? "Selesai" :
    index >= 20 && index < 25 ? "Monitoring" :
    index >= 25 && index < 30 ? "Koordinasi Internal" :
    index % 7 === 0 ? "Klarifikasi" :
    index % 5 === 0 ? "Publikasi Balasan" :
    "Belum Ditindaklanjuti";

  return {
    id: generateId(index),
    idBerita: item.no,
    tanggalScraping: now,
    tanggalTerbit: date,
    bulan: item.bulan,
    tahun: item.tahun,
    sumberKonten: item.sumber as "media lokal" | "media nasional",
    kategoriBerita: item.kategori as NewsArticle["kategoriBerita"],
    namaMedia: item.media,
    namaWartawan: item.wartawan || "Tim Redaksi",
    judulBerita: item.judul,
    isiBerita: item.isi,
    tone: item.tone,
    linkArtikel: item.link,
    linkPdfArsip: "",
    skorRelevansi: relevance.score,
    statusRelevansi: relevance.status,
    levelRisiko: riskLevel,
    jenisIsu: issueType,
    wilayahTerkait: relevance.locationMatches.join(", ") || "Pangkalpinang",
    rekomendasiTindakLanjut: riskLevel === "Kritis"
      ? "Segera lakukan klarifikasi publik dan koordinasi dengan pimpinan"
      : riskLevel === "Tinggi"
      ? "Pantau perkembangan berita dan siapkan keterangan resmi"
      : riskLevel === "Sedang"
      ? "Lakukan monitoring dan dokumentasi"
      : "Dokumentasi dan arsipkan",
    statusPenanganan: followUpStatus,
    pic: index % 3 === 0 ? "Tim Humas" : index % 3 === 1 ? "Kepala Seksi" : "Koordinator",
    catatanVerifikator: "",
    validationStatus,
    createdAt: now,
    updatedAt: now,
  };
});

export function getFilteredArticles(articles: NewsArticle[], filters: Partial<NewsArticle>): NewsArticle[] {
  return articles.filter((a) => {
    for (const [key, value] of Object.entries(filters)) {
      if (value && a[key as keyof NewsArticle] !== value) return false;
    }
    return true;
  });
}
