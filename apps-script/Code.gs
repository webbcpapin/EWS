const DEFAULT_SHEET_NAME = "Berita";
const TIMEZONE = "Asia/Jakarta";
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

const MONTH_ALIASES = {
  januari: 0,
  jan: 0,
  february: 1,
  februari: 1,
  feb: 1,
  march: 2,
  maret: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  mei: 4,
  june: 5,
  juni: 5,
  jun: 5,
  july: 6,
  juli: 6,
  jul: 6,
  august: 7,
  agustus: 7,
  aug: 7,
  agu: 7,
  september: 8,
  sep: 8,
  october: 9,
  oktober: 9,
  oct: 9,
  okt: 9,
  november: 10,
  nov: 10,
  december: 11,
  desember: 11,
  dec: 11,
  des: 11,
};

const HEADER_ALIASES = {
  id: ["id", "id berita", "id_berita"],
  no: ["no", "nomor", "no sumber", "no_sumber"],
  tanggal: ["tanggal", "tanggal terbit", "tanggal_terbit", "date", "published_at"],
  tanggalIso: ["tanggal_iso", "tanggal iso", "published_date", "published date"],
  tanggalScraping: ["tanggal_scraping", "tanggal scraping", "scraped_at", "scraped at"],
  bulan: ["bulan", "month"],
  tahun: ["tahun", "year"],
  sumber: ["sumber", "sumber konten berita", "sumber konten", "source"],
  kategori: ["kategori", "kategori berita", "kategori_berita", "category"],
  media: ["media", "nama media", "nama_media", "publisher"],
  wartawan: ["wartawan", "nama wartawan", "nama_wartawan", "author"],
  judul: ["judul", "judul berita", "judul_berita", "title", "headline"],
  isi: ["isi", "isi berita", "isi_berita", "ringkasan", "content"],
  tone: ["tone", "sentimen", "sentiment"],
  linkPdf: ["link pdf", "link_pdf", "pdf", "arsip pdf"],
  link: ["link", "url", "link artikel", "link_artikel", "link berita", "link_berita"],
  rekomendasi: ["rekomendasi", "rekomendasi & tindak lanjut", "rekomendasi tindak lanjut"],
  status: ["status", "status validasi", "status_validasi", "validation_status"],
  sourceUpload: ["source_upload", "source upload", "asal data"],
  sender: ["sender", "pengirim", "nama pengirim"],
  createdAt: ["created_at", "created at"],
  updatedAt: ["updated_at", "updated at"],
};

const CANONICAL_HEADERS = [
  "id",
  "no",
  "tanggal",
  "tanggal_iso",
  "tanggal_scraping",
  "tahun",
  "bulan",
  "sumber",
  "kategori",
  "media",
  "wartawan",
  "judul",
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
    return jsonResponse({ ok: false, error: errorMessage(error) });
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

    if (action === "repairPublishedDates") {
      const result = repairPublishedDates(Number(body.limit || 25));
      return jsonResponse({ ok: true, data: result });
    }

    return jsonResponse({ ok: false, error: "Action tidak dikenal" });
  } catch (error) {
    return jsonResponse({ ok: false, error: errorMessage(error) });
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
    .filter((row) => isRelevantToBcPangkalpinang([row.isi_berita, row.judul_berita, row.link_artikel, row.nama_media].join(" ")));

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

  const now = new Date();
  const scrapingDate = normalizeDate(input.tanggal_scraping || input.scraped_at || input.created_at || now);
  const link = String(input.link || input.link_artikel || input.link_berita || input.url || "").trim();
  const searchable = [input.judul || input.judul_berita, input.isi || input.isi_berita, link, input.media || input.nama_media].join(" ");

  if (!isRelevantToBcPangkalpinang(searchable)) {
    throw new Error("Artikel ditolak karena tidak terkait Bea Cukai Pangkalpinang/Bangka Belitung.");
  }

  const publishedDate = resolvePublishedDate({
    tanggal: input.tanggal,
    tanggal_iso: input.tanggal_iso || input.tanggal_terbit || input.published_at || input.publishedAt,
    text: [input.tanggal_text, input.published_text, input.judul || input.judul_berita, input.isi || input.isi_berita].join(" "),
    link,
    fetchFromUrl: true,
  });

  if (!publishedDate) {
    throw new Error("Tanggal terbit tidak ditemukan. Kirim tanggal published dari scraper, atau pastikan halaman artikel punya metadata tanggal.");
  }

  const row = {
    id: input.id || Utilities.getUuid(),
    no: input.no || sheet.getLastRow(),
    tanggal: publishedDate.display,
    tanggal_iso: publishedDate.iso,
    tanggal_scraping: scrapingDate ? scrapingDate.iso : formatDateInfo(now).iso,
    tahun: publishedDate.year,
    bulan: publishedDate.monthName,
    sumber: input.sumber || input.sumber_konten || "media lokal",
    kategori: input.kategori || input.kategori_berita || "Lainnya",
    media: input.media || input.nama_media || mediaFromUrl(link),
    wartawan: input.wartawan || input.nama_wartawan || input.sender || "Tim Redaksi",
    judul: input.judul || input.judul_berita || titleFromUrl(link),
    isi: input.isi || input.isi_berita || input.judul || input.judul_berita || titleFromUrl(link),
    tone: input.tone || "netral",
    link_pdf: input.link_pdf || input.linkPdf || "",
    link,
    rekomendasi: input.rekomendasi || input.rekomendasi_tindak_lanjut || "",
    status: input.status || "Perlu Review",
    source_upload: input.source_upload || input.sourceLabel || "manual/import",
    sender: input.sender || "",
    created_at: input.created_at || now.toISOString(),
    updated_at: now.toISOString(),
  };

  sheet.appendRow(CANONICAL_HEADERS.map((header) => row[header] || ""));
  return normalizeRow(CANONICAL_HEADERS.map((header) => row[header] || ""), CANONICAL_HEADERS, sheet.getLastRow() - 2);
}

function repairPublishedDates(limit) {
  const sheet = getSheet();
  ensureHeader(sheet);
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return { checked: 0, repaired: 0, skipped: 0, failed: [] };

  const headers = values[0].map(normalizeHeader);
  const map = headerMap(headers);
  const max = Math.max(1, Number(limit || 25));
  const failed = [];
  let checked = 0;
  let repaired = 0;
  let skipped = 0;

  for (let rowIndex = 1; rowIndex < values.length && checked < max; rowIndex += 1) {
    const row = values[rowIndex];
    const raw = rowToObject(row, headers);
    const link = String(pick(raw, "link") || "").trim();
    if (!link) {
      skipped += 1;
      continue;
    }

    const currentDate = normalizeDate(pick(raw, "tanggalIso") || pick(raw, "tanggal"));
    const scrapingDate = normalizeDate(pick(raw, "tanggalScraping") || pick(raw, "createdAt"));
    const tahun = Number(pick(raw, "tahun") || 0);
    const bulan = String(pick(raw, "bulan") || "").trim();
    const suspicious = isSuspiciousPublishedDate(currentDate, scrapingDate, tahun, bulan);

    if (!suspicious) {
      skipped += 1;
      continue;
    }

    checked += 1;
    try {
      const publishedDate = resolvePublishedDate({
        tanggal: "",
        tanggal_iso: "",
        text: [pick(raw, "judul"), pick(raw, "isi")].join(" "),
        link,
        fetchFromUrl: true,
      });

      if (!publishedDate) {
        failed.push({ row: rowIndex + 1, link, reason: "Tanggal published tidak ditemukan" });
        continue;
      }

      setCell(row, map, "tanggal", publishedDate.display);
      setCell(row, map, "tanggalIso", publishedDate.iso);
      setCell(row, map, "tahun", publishedDate.year);
      setCell(row, map, "bulan", publishedDate.monthName);
      if (!pick(raw, "tanggalScraping")) setCell(row, map, "tanggalScraping", scrapingDate ? scrapingDate.iso : new Date().toISOString().slice(0, 10));
      setCell(row, map, "updatedAt", new Date().toISOString());
      sheet.getRange(rowIndex + 1, 1, 1, row.length).setValues([row]);
      repaired += 1;
      Utilities.sleep(250);
    } catch (error) {
      failed.push({ row: rowIndex + 1, link, reason: errorMessage(error) });
    }
  }

  return { checked, repaired, skipped, failed };
}

function resolvePublishedDate(options) {
  const direct = normalizeDate(options.tanggal_iso || options.tanggal);
  const textDate = parseDateFromText(options.text || "");
  const urlDate = parseDateFromUrl(options.link || "");
  const fetchedDate = options.fetchFromUrl ? fetchPublishedDateFromUrl(options.link || "") : null;
  return direct || textDate || urlDate || fetchedDate;
}

function fetchPublishedDateFromUrl(url) {
  if (!url) return null;
  try {
    const response = UrlFetchApp.fetch(url, {
      followRedirects: true,
      muteHttpExceptions: true,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EWS-BC-Pangkalpinang/1.0)",
      },
    });
    const code = response.getResponseCode();
    if (code < 200 || code >= 400) return null;
    const html = response.getContentText();
    return parseDateFromHtml(html);
  } catch (error) {
    return null;
  }
}

function parseDateFromHtml(html) {
  if (!html) return null;
  const patterns = [
    /"datePublished"\s*:\s*"([^"]+)"/i,
    /"dateCreated"\s*:\s*"([^"]+)"/i,
    /property=["']article:published_time["'][^>]*content=["']([^"']+)/i,
    /content=["']([^"']+)["'][^>]*property=["']article:published_time["']/i,
    /itemprop=["']datePublished["'][^>]*content=["']([^"']+)/i,
    /<time[^>]+datetime=["']([^"']+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const parsed = normalizeDate(decodeHtml(match[1]));
      if (parsed) return parsed;
    }
  }

  return parseDateFromText(stripTags(html).slice(0, 5000));
}

function parseDateFromUrl(url) {
  const normalized = String(url || "");
  const slash = normalized.match(/\/(20\d{2})\/(\d{1,2})\/(\d{1,2})(?:\/|$)/);
  if (slash) return formatDateInfo(new Date(Number(slash[1]), Number(slash[2]) - 1, Number(slash[3])));
  const dash = normalized.match(/(20\d{2})[-/](\d{1,2})[-/](\d{1,2})/);
  if (dash) return formatDateInfo(new Date(Number(dash[1]), Number(dash[2]) - 1, Number(dash[3])));
  return null;
}

function parseDateFromText(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const iso = normalized.match(/(20\d{2})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (iso) return formatDateInfo(new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), Number(iso[4] || 0), Number(iso[5] || 0), Number(iso[6] || 0)));

  const local = normalized.match(/(\d{1,2})\s+(Januari|Jan|Februari|Feb|Maret|Mar|April|Apr|Mei|May|Juni|Jun|Juli|Jul|Agustus|Agu|Aug|September|Sep|Oktober|Okt|Oct|November|Nov|Desember|Des|Dec)\s+(20\d{2})(?:\s+(\d{1,2})[:.](\d{2}))?/i);
  if (local) {
    const month = MONTH_ALIASES[local[2].toLowerCase()];
    if (month !== undefined) return formatDateInfo(new Date(Number(local[3]), month, Number(local[1]), Number(local[4] || 0), Number(local[5] || 0)));
  }

  const slash = normalized.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (slash) {
    const yearRaw = Number(slash[3]);
    const year = yearRaw < 100 ? (yearRaw < 50 ? 2000 + yearRaw : 1900 + yearRaw) : yearRaw;
    return formatDateInfo(new Date(year, Number(slash[2]) - 1, Number(slash[1])));
  }

  return null;
}

function normalizeDate(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return formatDateInfo(value);
  const raw = String(value || "").trim();
  if (!raw) return null;

  const direct = new Date(raw);
  if (!isNaN(direct.getTime())) return formatDateInfo(direct);

  return parseDateFromText(raw);
}

function formatDateInfo(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;
  return {
    date,
    iso: Utilities.formatDate(date, TIMEZONE, "yyyy-MM-dd"),
    display: Utilities.formatDate(date, TIMEZONE, "dd/MM/yyyy"),
    year: Number(Utilities.formatDate(date, TIMEZONE, "yyyy")),
    monthName: MONTHS_ID[Number(Utilities.formatDate(date, TIMEZONE, "M")) - 1],
  };
}

function isSuspiciousPublishedDate(currentDate, scrapingDate, tahun, bulan) {
  if (!currentDate) return true;
  if (scrapingDate && currentDate.iso === scrapingDate.iso) return true;
  if (tahun && currentDate.year !== tahun) return true;
  if (bulan) {
    const monthIndex = MONTH_ALIASES[bulan.toLowerCase()];
    if (monthIndex !== undefined && currentDate.monthName !== MONTHS_ID[monthIndex]) return true;
  }
  return false;
}

function normalizeRow(row, headers, index) {
  const raw = rowToObject(row, headers);
  const date = normalizeDate(pick(raw, "tanggalIso") || pick(raw, "tanggal"));
  const scrapingDate = normalizeDate(pick(raw, "tanggalScraping") || pick(raw, "createdAt"));
  const link = String(pick(raw, "link") || "").trim();
  const title = String(pick(raw, "judul") || pick(raw, "isi") || titleFromUrl(link));

  return {
    id: String(pick(raw, "id") || `sheet_${index + 1}`),
    no_sumber: Number(pick(raw, "no") || index + 1),
    tanggal_terbit: date ? date.iso : "",
    tanggal_scraping: scrapingDate ? scrapingDate.iso : "",
    bulan: String(pick(raw, "bulan") || (date ? date.monthName : "")),
    tahun: Number(pick(raw, "tahun") || (date ? date.year : "")),
    sumber: String(pick(raw, "sumber") || "media lokal"),
    kategori: String(pick(raw, "kategori") || "Lainnya"),
    nama_media: String(pick(raw, "media") || mediaFromUrl(link)),
    nama_wartawan: String(pick(raw, "wartawan") || pick(raw, "sender") || "Tim Redaksi"),
    judul_berita: title,
    isi_berita: String(pick(raw, "isi") || title),
    tone: String(pick(raw, "tone") || "netral"),
    link_pdf: String(pick(raw, "linkPdf") || ""),
    link_artikel: link,
    rekomendasi_tindak_lanjut: String(pick(raw, "rekomendasi") || ""),
    status_validasi: String(pick(raw, "status") || "Baru"),
    source_upload: String(pick(raw, "sourceUpload") || ""),
    sender: String(pick(raw, "sender") || ""),
    created_at: toIsoString(pick(raw, "createdAt") || new Date()),
    updated_at: toIsoString(pick(raw, "updatedAt") || new Date()),
  };
}

function getSheet() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty("SHEET_ID");
  const spreadsheet = sheetId ? SpreadsheetApp.openById(sheetId) : SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = props.getProperty("SHEET_NAME") || DEFAULT_SHEET_NAME;
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function ensureHeader(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), CANONICAL_HEADERS.length)).getValues()[0];
  if (firstRow.some((cell) => String(cell || "").trim())) return;
  sheet.getRange(1, 1, 1, CANONICAL_HEADERS.length).setValues([CANONICAL_HEADERS]);
}

function headerMap(headers) {
  const map = {};
  headers.forEach((header, index) => {
    map[normalizeHeader(header)] = index;
  });
  return map;
}

function rowToObject(row, headers) {
  const raw = {};
  headers.forEach((header, columnIndex) => {
    raw[normalizeHeader(header)] = row[columnIndex];
  });
  return raw;
}

function setCell(row, map, canonical, value) {
  const aliases = HEADER_ALIASES[canonical] || [canonical];
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    if (map[key] !== undefined) {
      row[map[key]] = value;
      return;
    }
  }
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

function titleFromUrl(link) {
  try {
    const parsed = new URL(link);
    const lastPath = parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname;
    return decodeURIComponent(lastPath).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  } catch (error) {
    return String(link || "");
  }
}

function mediaFromUrl(link) {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch (error) {
    return "";
  }
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

function stripTags(html) {
  return String(html || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'");
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

function errorMessage(error) {
  return String(error && error.message ? error.message : error);
}
