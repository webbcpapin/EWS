const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
const TEXT_DECODER = new TextDecoder("utf-8");

export type ChatLinkCandidate = {
  url: string;
  context: string;
  rawMessage: string;
  sourceLabel?: string;
  receivedAt?: string;
  sender?: string;
};

type ChatMessage = {
  body: string;
  raw: string;
  receivedAt?: string;
  sender?: string;
};

function cleanText(value: string) {
  return value
    .replace(/[\u200e\u200f]/g, "")
    .replace(/\u202f/g, " ")
    .trim();
}

function cleanUrl(url: string) {
  return cleanText(url)
    .replace(/[)\].,;!?]+$/g, "")
    .trim();
}

function normalizeTwoDigitYear(year: number) {
  return year < 50 ? 2000 + year : 1900 + year;
}

function parseWhatsAppTimestamp(datePart: string, timePart: string) {
  const [dayRaw, monthRaw, yearRaw] = datePart.split(/[/-]/).map((part) => Number(part));
  if (!dayRaw || !monthRaw || !yearRaw) return undefined;

  const [hourRaw, minuteRaw, secondRaw = 0] = timePart.split(/[.:]/).map((part) => Number(part));
  const year = yearRaw < 100 ? normalizeTwoDigitYear(yearRaw) : yearRaw;
  const date = new Date(year, monthRaw - 1, dayRaw, hourRaw || 0, minuteRaw || 0, secondRaw || 0);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function parseMessageStart(line: string) {
  const normalized = cleanText(line);
  const match = normalized.match(/^\[?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}),\s*(\d{1,2}[.:]\d{2}(?:[.:]\d{2})?)\]?\s+-?\s*([^:]+?)\s*:\s*(.*)$/);
  if (!match) return null;

  return {
    receivedAt: parseWhatsAppTimestamp(match[1], match[2]),
    sender: cleanText(match[3]),
    body: cleanText(match[4]),
  };
}

function parseWhatsAppMessages(text: string) {
  const messages: ChatMessage[] = [];
  let current: ChatMessage | null = null;

  for (const line of text.split(/\r?\n/)) {
    const parsed = parseMessageStart(line);
    if (parsed) {
      if (current) messages.push(current);
      current = {
        body: parsed.body,
        raw: cleanText(line),
        receivedAt: parsed.receivedAt,
        sender: parsed.sender,
      };
      continue;
    }

    if (current) {
      const addition = cleanText(line);
      if (addition) {
        current.body = `${current.body}\n${addition}`.trim();
        current.raw = `${current.raw}\n${addition}`.trim();
      }
    }
  }

  if (current) messages.push(current);
  return messages;
}

export function extractUrlsFromText(text: string) {
  const matches = text.match(URL_PATTERN) || [];
  const urls = matches.map(cleanUrl).filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  });

  return [...new Set(urls)];
}

export function extractLinkCandidatesFromChatText(text: string, sourceLabel?: string): ChatLinkCandidate[] {
  const messages = parseWhatsAppMessages(text);
  const candidates: ChatLinkCandidate[] = [];
  const seen = new Set<string>();

  const addCandidate = (candidate: ChatLinkCandidate) => {
    const key = candidate.url.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(candidate);
  };

  messages.forEach((message) => {
    const urls = extractUrlsFromText(message.body);
    urls.forEach((url) => {
      addCandidate({
        url,
        context: message.body,
        rawMessage: message.raw,
        receivedAt: message.receivedAt,
        sender: message.sender,
        sourceLabel,
      });
    });
  });

  if (candidates.length > 0) return candidates;

  extractUrlsFromText(text).forEach((url) => {
    addCandidate({
      url,
      context: "Link ditemukan dari teks export WhatsApp.",
      rawMessage: url,
      sourceLabel,
    });
  });

  return candidates;
}

async function inflateRaw(data: Uint8Array) {
  if (!("DecompressionStream" in window)) {
    throw new Error("Browser belum mendukung ekstraksi ZIP otomatis. Ekstrak ZIP lalu upload _chat.txt.");
  }

  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const stream = new Blob([arrayBuffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function extractTextFromZip(file: File) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const texts: string[] = [];
  let offset = 0;

  while (offset + 30 < buffer.byteLength) {
    const signature = view.getUint32(offset, true);
    if (signature !== 0x04034b50) break;

    const method = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLength;
    const dataStart = nameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (dataEnd > buffer.byteLength) break;

    const fileName = TEXT_DECODER.decode(new Uint8Array(buffer, nameStart, fileNameLength));
    const compressed = new Uint8Array(buffer, dataStart, compressedSize);

    if (fileName.toLowerCase().endsWith(".txt")) {
      if (method === 0) {
        texts.push(TEXT_DECODER.decode(compressed));
      } else if (method === 8) {
        texts.push(TEXT_DECODER.decode(await inflateRaw(compressed)));
      }
    }

    offset = dataEnd;
  }

  if (texts.length === 0) {
    throw new Error("Tidak menemukan file .txt di dalam ZIP WhatsApp.");
  }

  return texts.join("\n");
}

export async function readChatTextFile(file: File) {
  if (file.name.toLowerCase().endsWith(".zip")) {
    return extractTextFromZip(file);
  }

  return file.text();
}
