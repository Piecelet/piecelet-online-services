import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const neodbClients = sqliteTable("neodb_clients", {
  instance: text("instance").primaryKey(),
  client_id: text("client_id").notNull(),
  client_secret: text("client_secret").notNull(),
  redirect_uri: text("redirect_uri").notNull(),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

export const neodbStates = sqliteTable("neodb_states", {
  state: text("state").primaryKey(),
  instance: text("instance").notNull(),
  callback_url: text("callback_url"),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

