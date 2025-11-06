import type { WordRow } from "./supabase";

export function toCsv(rows: WordRow[]): string {
    const header = ["id","user_id","word","meaning","examples","notes","created_at"];
    const lines = [header.join(",")];
    for (const r of rows) {
        const examples = r.examples == null ? "" : JSON.stringify(r.examples).replaceAll('"', '""');
        const values = [
            r.id,
            r.user_id,
            safe(r.word),
            safe(r.meaning ?? ""),
            `"${examples}"`,
            safe(r.notes ?? ""),
            r.created_at,
        ];
        lines.push(values.join(","));
    }
    return lines.join("\n");
}

function safe(v: string): string {
    const needsQuote = /[",\n]/.test(v);
    const cleaned = v.replaceAll('"', '""');
    return needsQuote ? `"${cleaned}"` : cleaned;
}


