import { addDays } from "./dates.ts";
import type { Item } from "./types.ts";
function escapeICS(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}
function foldICS(line: string): string {
  let result = "";
  let bytes = 0;
  for (const char of line) {
    const length = new TextEncoder().encode(char).length;
    if (bytes + length > 75) {
      result += "\r\n ";
      bytes = 1;
    }
    result += char;
    bytes += length;
  }
  return result;
}
export function createICS(items: Item[], now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kigen Note//JA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const item of items.filter((row) => !row.done)) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeICS(item.id)}@kigen-note.local`,
      `DTSTAMP:${now
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "")}`,
      `DTSTART;VALUE=DATE:${item.due.replaceAll("-", "")}`,
      `DTEND;VALUE=DATE:${addDays(item.due, 1).replaceAll("-", "")}`,
      `SUMMARY:${escapeICS(item.name)}`,
      `LOCATION:${escapeICS(item.target)}`,
      `DESCRIPTION:${escapeICS(`担当: ${item.owner}\n${item.memo}`)}`,
    );
    for (const days of [90, 30, 0])
      lines.push(
        "BEGIN:VALARM",
        days === 0 ? "TRIGGER:PT0S" : `TRIGGER:-P${days}D`,
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeICS(`${item.name} の期限${days}日前`)}`,
        "END:VALARM",
      );
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldICS).join("\r\n") + "\r\n";
}
