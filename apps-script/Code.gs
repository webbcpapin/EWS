const DEFAULT_SHEET_NAME = "Berita";
const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const HEADER_ALIASES = {
  id: ["id", "id berita", "id_berita"],
  no: ["no", "nomor", "no sumber", "no_sumber"],
  tanggal: ["tanggal", "tanggal terbit", "tanggal_terbit", "date", "published_at"],
  bulan: ["bulan", "month"],
  tahun: ["tahun", "year"],
  sumber: ["sumber", "sumber konten berita", "sumber konten", "source"],
  kategori: ["kategori", "kategori berita", "kategori_berita", "category"],
  media: ["media", "nama media", "nama_media", "publisher"],
  wartawan: ["wartawan", "nama wartawan", "nama_wartawan", "author"],
  isi: ["isi", "isi berita", "isi_berita", "ringkasan", "content"],
  tone: ["tone", "sentimen", "sentiment"],
  linkPdf: ["link pdf", "link_pdf", "pdf", "arsip pdf"],
  link: ["link", "url", "link artikel", "link_artikel", "link berita"],
  rekomendasi: ["rekomendasi", "rekomendasi & tindak lanjut", "rekomendasi tindak lanjut"],
  status: ["status", "status validasi", "status_validasi", "validation_status"],
  sourceUpload: ["source_upload", "source upload", "asal data"],
  sender: ["sender", "pengirim", "nama pengirim"],
};

const CANONICAL_HEADERS = [
  "id",
  "no",
  "tanggal",
  "tanggal_iso",
  "tahun",
  "bulan",
  "sumber",
  "kategori",
  "media",
  "wartawan",
  "isi",
  "tone",
  "link_pdf",
  "link",
  "rekomendasi",
  "status",
  "source_upload",
  "sender",
  "created_at",
  "updated_at",
];

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const rows = getArticles(params);
    return jsonResponse({ ok: true, count: rows.length, data: rows });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function doPost(e) {
  try {
    requireWriteToken(e);
    const body = parseBody(e);
    const action = String(body.action || "appendArticle");

    if (action === "appendArticle") {
      const article = appendArticle(body.article || body);
      return jsonResponse({ ok: true, data: article });
    }

    if (action === "importArticles") {
      const rows = Array.isArray(body.articles) ? body.articles : [];
      const imported = rows.map(appendArticle).filter(Boolean);
      return jsonResponse({ ok: true, count: imported.length, data: imported });
    }

    return jsonResponse({ ok: false, error: "Action tidak dikenal" });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function getArticles(params) {
  const sheet = getSheet();
  ensureHeader(sheet);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(normalizeHeader);
  const rows = values.slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map((row, index) => normalizeRow(row, headers, index))
    .filter((row) => isRelevantToBcPangkalpinang([row.isi_berita, row.judul_berita, row.link_artikel, row.media].join(" ")));

  return rows
    .filter((row) => !params.year || Number(row.tahun) === Number(params.year))
    .filter((row) => !params.tahun || Number(row.tahun) === Number(params.tahun))
    .filter((row) => !params.month || String(row.bulan).toLowerCase() === String(params.month).toLowerCase())
    .filter((row) => !params.bulan || String(row.bulan).toLowerCase() === String(params.bulan).toLowerCase())
    .filter((row) => !params.date || row.tanggal_terbit === params.date)
    .filter((row) => !params.dateFrom || row.tanggal_terbit >= params.dateFrom)
    .filter((row) => !params.dateTo || row.tanggal_terbit <= params.dateTo)
    .sort((a, b) => b.tanggal_terbit.localeCompare(a.tanggal_terbit) || b.updated_at.localeCompare(a.updated_at));
}

function appendArticle(input) {
  const sheet = getSheet();
  ensureHeader(sheet);
  const now = new Date().toISOString();
  const date = normalizeDate(input.tanggal || input.tanggal_terbit || input.receivedAt || now);
  const searchable = [input.judul || input.judul_berita, input.isi || input.isi_berita, input.link || input.link_artikel, input.media].join(" ");

  if (!isRelevantToBcPangkalpinang(searchable)) {
    throw new Error("Artikel ditolak karena tidak terkait Bea Cukai Pangkalpinang/Bangka Belitung.");
  }

  const row = {
    id: input.id || Utilities.getUuid(),
    no: input.no || sheet.getLastRow(),
    tanggal: date.display,
    tanggal_iso: date.iso,
    tahun: date.year,
    bulan: date.monthName,
    sumber: input.sumber || input.sumber_konten || "media lokal",
    kategori: input.kategori || input.kategori_berita || "Lainnya",
    media: input.media || input.nama_media || "",
    wartawan: input.wartawan || input.nama_wartawan || input.sender || "",
    isi: input.isi || input.isi_berita || input.judul || input.judul_berita || "",
    tone: input.tone || "netral",
    link_pdf: input.link_pdf || input.linkPdf || "",
    link: input.link || input.link_artikel || input.url || "",
    rekomendasi: input.rekomendasi || input.rekomendasi_tindak_lanjut || "",
    status: input.status || "Perlu Review",
    source_upload: input.source_upload || input.sourceLabel || "manual/import",
    sender: input.sender || "",
    created_at: input.created_at || now,
    updated_at: now,
  };

  sheet.appendRow(CANONICAL_HEADERS.map((header) => row[header] || ""));
  return normalizeRow(CANONICAL_HEADERS.map((header) => row[header] || ""), CANONICAL_HEADERS, sheet.getLastRow() - 2);
}

function getSheet() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty("SHEET_ID");
  const spreadsheet = sheetId ? SpreadsheetApp.openById(sheetId) : SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = props.getProperty("SHEET_NAME") || DEFAULT_SHEET_NAME;
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  return sheet;
}

function ensureHeader(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), CANONICAL_HEADERS.length)).getValues()[0];
  if (firstRow.some((cell) => String(cell || "").trim())) return;
  sheet.getRange(1, 1, 1, CANONICAL_HEADERS.length).setValues([CANONICAL_HEADERS]);
}

function normalizeRow(row, headers, index) {
  const raw = {};
  headers.forEach((header, columnIndex) => {
    raw[normalizeHeader(header)] = row[columnIndex];
  });

  const date = normalizeDate(pick(raw, "tanggal") || pick(raw, "tanggal_iso") || new Date());
  return {
    id: String(pick(raw, "id") || `sheet_${index + 1}`),
    no_sumber: Number(pick(raw, "no") || index + 1),
    tanggal_terbit: date.iso,
    bulan: String(pick(raw, "bulan") || date.monthName),
    tahun: Number(pick(raw, "tahun") || date.year),
    sumber: String(pick(raw, "sumber") || "media lokal"),
    kategori: String(pick(raw, "kategori") || "Lainnya"),
    nama_media: String(pick(raw, "media") || ""),
    nama_wartawan: String(pick(raw, "wartawan") || pick(raw, "sender") || "Tim Redaksi"),
    judul_berita: String(pick(raw, "isi") || "").slice(0, 140),
    isi_berita: String(pick(raw, "isi") || ""),
    tone: String(pick(raw, "tone") || "netral"),
    link_pdf: String(pick(raw, "linkPdf") || ""),
    link_artikel: String(pick(raw, "link") || ""),
    rekomendasi_tindak_lanjut: String(pick(raw, "rekomendasi") || ""),
    status_validasi: String(pick(raw, "status") || "Baru"),
    source_upload: String(pick(raw, "sourceUpload") || ""),
    sender: String(pick(raw, "sender") || ""),
    created_at: toIsoString(pick(raw, "created_at") || new Date()),
    updated_at: toIsoString(pick(raw, "updated_at") || new Date()),
  };
}

function pick(row, canonical) {
  const aliases = HEADER_ALIASES[canonical] || [canonical];
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") return row[key];
  }
  return "";
}

function normalizeHeader(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeDate(value) {
  const date = value instanceof Date ? value : parseDate(String(value || ""));
  const safeDate = date && !isNaN(date.getTime()) ? date : new Date();
  return {
    iso: Utilities.formatDate(safeDate, "Asia/Jakarta", "yyyy-MM-dd"),
    display: Utilities.formatDate(safeDate, "Asia/Jakarta", "dd/MM/yyyy"),
    year: Number(Utilities.formatDate(safeDate, "Asia/Jakarta", "yyyy")),
    monthName: MONTHS_ID[Number(Utilities.formatDate(safeDate, "Asia/Jakarta", "M")) - 1],
  };
}

function parseDate(raw) {
  const normalized = String(raw || "").trim().toLowerCase();
  const direct = new Date(normalized);
  if (!isNaN(direct.getTime())) return direct;

  const slash = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const yearRaw = Number(slash[3]);
    const year = yearRaw < 100 ? (yearRaw < 50 ? 2000 + yearRaw : 1900 + yearRaw) : yearRaw;
    return new Date(year, Number(slash[2]) - 1, Number(slash[1]));
  }

  const monthMap = MONTHS_ID.reduce((acc, name, index) => {
    acc[name.toLowerCase()] = index;
    return acc;
  }, {});
  const words = normalized.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (words && monthMap[words[2]] !== undefined) return new Date(Number(words[3]), monthMap[words[2]], Number(words[1]));
  return null;
}

function toIsoString(value) {
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function isRelevantToBcPangkalpinang(text) {
  const lower = String(text || "").toLowerCase();
  const officeHints = ["bea cukai pangkalpinang", "bc pangkalpinang", "beacukai pangkalpinang", "bea cukai papin", "kppbc pangkalpinang", "bea cukai bangka", "bea cukai babel"];
  const issueHints = ["bea cukai", "beacukai", "cukai", "kepabeanan", "pabean", "rokok ilegal", "rokok polos", "pita cukai", "penyelundupan", "penindakan", "barang kiriman", "ekspor", "impor", "timah"];
  const locationHints = ["pangkalpinang", "pangkal pinang", "bangka", "babel", "pangkalbalam", "muntok", "belinyu", "sungailiat", "toboali", "koba"];
  return officeHints.some((hint) => lower.includes(hint)) || (issueHints.some((hint) => lower.includes(hint)) && locationHints.some((hint) => lower.includes(hint)));
}

function parseBody(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function requireWriteToken(e) {
  const expected = PropertiesService.getScriptProperties().getProperty("API_KEY");
  if (!expected) return;
  const body = parseBody(e);
  const provided = body.apiKey || ((e.parameter || {}).apiKey);
  if (provided !== expected) throw new Error("API key tidak valid untuk operasi tulis.");
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
