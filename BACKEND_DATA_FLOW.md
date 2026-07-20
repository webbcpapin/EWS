# Backend Google Sheet EWS

Aplikasi membaca satu tab utama bernama `Berita`. Workbook Excel lama boleh tetap dipakai sebagai arsip per tahun, tetapi backend aplikasi lebih stabil jika data digabung dan dinormalisasi ke satu tabel.

Kolom minimum tab `Berita`:

`id`, `no`, `tanggal`, `tanggal_iso`, `tahun`, `bulan`, `sumber`, `kategori`, `media`, `wartawan`, `isi`, `tone`, `link_pdf`, `link`, `rekomendasi`, `status`, `source_upload`, `sender`, `created_at`, `updated_at`.

Aturan backend:

- `tanggal_iso` memakai format `yyyy-mm-dd` agar sort dan filter tanggal akurat.
- Data selalu dikirim dari yang terbaru berdasarkan `tanggal_terbit`, lalu `updated_at`.
- Endpoint mendukung filter `year`/`tahun`, `month`/`bulan`, `date`, `dateFrom`, dan `dateTo`.
- Import tulis lewat `POST` sebaiknya memakai Script Properties `API_KEY`; jangan simpan token rahasia di frontend GitHub Pages.
- Berita dari scraping atau chat wartawan ditolak jika tidak menyebut konteks Bea Cukai Pangkalpinang/Bangka Belitung atau isu kepabeanan/cukai yang berhubungan dengan wilayah kerja.

File `apps-script/Code.gs` adalah referensi backend untuk ditempel ke Google Apps Script yang terhubung ke spreadsheet. Set Script Properties berikut sebelum deploy production:

- `SHEET_ID`: ID spreadsheet Google Sheet.
- `SHEET_NAME`: `Berita` jika memakai nama default.
- `API_KEY`: token rahasia untuk operasi `POST`/import.


## Perbaikan tanggal published

Jika data lama terlanjur memakai tanggal scraping sebagai tanggal terbit, jalankan fungsi
epairPublishedDates(50) dari Apps Script editor. Fungsi ini mencari baris yang tanggalnya mencurigakan, mengambil metadata datePublished/tanggal artikel dari URL berita, lalu memperbarui 	anggal, 	anggal_iso, 	ahun, dan ulan. 	anggal_scraping tetap dipertahankan sebagai tanggal import/scraping.
