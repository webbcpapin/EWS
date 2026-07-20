import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getDateTime(value: string | null | undefined) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function formatDateId(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback = "Belum ada tanggal"
) {
  const time = getDateTime(value);
  if (!time) return fallback;
  return new Date(time).toLocaleDateString("id-ID", options);
}
