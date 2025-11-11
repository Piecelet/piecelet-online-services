import { DatabaseSync } from "node:sqlite";

export const db = new DatabaseSync("database.sqlite");

// Ensure NeoDB-related tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS neodb_clients (
    instance TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS neodb_states (
    state TEXT PRIMARY KEY,
    instance TEXT NOT NULL,
    callback_url TEXT,
    created_at TEXT NOT NULL
  );
`);

try {
  const pragma = db.prepare("PRAGMA table_info(neodb_states)");
  const columns = pragma.all() as Array<{ name: string }>;
  const hasCallback = columns.some((c) => c.name === "callback_url");
  if (!hasCallback) {
    db.exec("ALTER TABLE neodb_states ADD COLUMN callback_url TEXT");
  }
} catch {
  // ignore if pragma/alter fails in some environments
}

