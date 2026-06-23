import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "./config";
import type { DashboardSnapshot, SourceStatus } from "../shared/types";

fs.mkdirSync(path.dirname(config.databaseUrl), { recursive: true });

export const db = new Database(config.databaseUrl);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  generated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sources (
  source_url TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  as_of_date TEXT NOT NULL,
  confidence TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT
);
`);

export function saveSnapshot(snapshot: DashboardSnapshot): void {
  const insert = db.prepare("INSERT INTO snapshots (generated_at, payload) VALUES (?, ?)");
  insert.run(snapshot.generatedAt, JSON.stringify(snapshot));

  const upsertSource = db.prepare(`
    INSERT INTO sources (source_url, label, retrieved_at, as_of_date, confidence, status, note)
    VALUES (@sourceUrl, @label, @retrievedAt, @asOfDate, @confidence, @status, @note)
    ON CONFLICT(source_url) DO UPDATE SET
      label=excluded.label,
      retrieved_at=excluded.retrieved_at,
      as_of_date=excluded.as_of_date,
      confidence=excluded.confidence,
      status=excluded.status,
      note=excluded.note
  `);

  const sourceUrls = new Set(snapshot.sources.map((source) => source.sourceUrl));
  for (const source of snapshot.sources) {
    upsertSource.run({
      ...source,
      status: source.confidence === "stale" ? "stale" : "ok",
      note: source.note ?? null
    });
  }

  for (const warning of snapshot.warnings) {
    if (!sourceUrls.has("app://warnings")) {
      upsertSource.run({
        sourceUrl: "app://warnings",
        label: "采集警告",
        retrievedAt: snapshot.generatedAt,
        asOfDate: snapshot.generatedAt.slice(0, 10),
        confidence: "estimated",
        status: "failed",
        note: warning
      });
      sourceUrls.add("app://warnings");
    }
  }
}

export function getLatestSnapshot(): DashboardSnapshot | null {
  const row = db.prepare("SELECT payload FROM snapshots ORDER BY id DESC LIMIT 1").get() as
    | { payload: string }
    | undefined;
  return row ? (JSON.parse(row.payload) as DashboardSnapshot) : null;
}

export function getSourceStatuses(): SourceStatus[] {
  const rows = db
    .prepare(
      "SELECT source_url as sourceUrl, label, retrieved_at as retrievedAt, as_of_date as asOfDate, confidence, status, note FROM sources ORDER BY retrieved_at DESC"
    )
    .all() as SourceStatus[];
  return rows;
}
