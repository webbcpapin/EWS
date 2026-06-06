const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
const TEXT_DECODER = new TextDecoder("utf-8");

function cleanUrl(url: string) {
  return url
    .replace(/[\u200e\u200f]/g, "")
    .replace(/[)\].,;!?]+$/g, "")
    .trim();
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
