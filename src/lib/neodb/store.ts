import { db } from "$lib/db";
import type { NeoDBClient, NeoDBState } from "./types";
import { nowIso } from "./util";

export function getClient(instance: string): NeoDBClient | null {
  const st = db.prepare(
    "SELECT instance, client_id, client_secret, redirect_uri FROM neodb_clients WHERE instance = ?",
  );
  const row = st.get(instance) as NeoDBClient | undefined;
  return row ?? null;
}

export function saveClient(client: NeoDBClient): void {
  const st = db.prepare(
    "INSERT OR REPLACE INTO neodb_clients(instance, client_id, client_secret, redirect_uri, created_at) VALUES (?,?,?,?,?)",
  );
  st.run(client.instance, client.client_id, client.client_secret, client.redirect_uri, nowIso());
}

export function saveState(state: string, instance: string, callbackURL?: string | null): void {
  const st = db.prepare(
    "INSERT OR REPLACE INTO neodb_states(state, instance, callback_url, created_at) VALUES (?,?,?,?)",
  );
  st.run(state, instance, callbackURL ?? null, nowIso());
}

export function popState(state: string): Pick<NeoDBState, "instance" | "callback_url"> | null {
  const get = db.prepare(
    "SELECT instance, callback_url FROM neodb_states WHERE state = ?",
  );
  const row = get.get(state) as { instance: string; callback_url: string | null } | undefined;
  const del = db.prepare("DELETE FROM neodb_states WHERE state = ?");
  del.run(state);
  if (!row) return null;
  return { instance: row.instance, callback_url: row.callback_url };
}

