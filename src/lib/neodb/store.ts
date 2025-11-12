import type { NeoDBClient, NeoDBState } from "./types";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { schema } from "$lib/db";
import { neodbClients, neodbStates } from "./schema";

export async function getClient(db: DrizzleD1Database<typeof schema>, instance: string): Promise<NeoDBClient | null> {
  const rows = await db
    .select({
      instance: neodbClients.instance,
      client_id: neodbClients.client_id,
      client_secret: neodbClients.client_secret,
      redirect_uri: neodbClients.redirect_uri,
    })
    .from(neodbClients)
    .where(eq(neodbClients.instance, instance));
  return rows[0] ?? null;
}

export async function saveClient(db: DrizzleD1Database<typeof schema>, client: NeoDBClient): Promise<void> {
  await db
    .insert(neodbClients)
    .values({
      instance: client.instance,
      client_id: client.client_id,
      client_secret: client.client_secret,
      redirect_uri: client.redirect_uri,
    })
    .onConflictDoUpdate({
      target: neodbClients.instance,
      set: {
        client_id: client.client_id,
        client_secret: client.client_secret,
        redirect_uri: client.redirect_uri,
      },
    });
}

export async function saveState(
  db: DrizzleD1Database<typeof schema>,
  state: string,
  instance: string,
  callbackURL?: string | null,
): Promise<void> {
  await db
    .insert(neodbStates)
    .values({
      state,
      instance,
      callback_url: callbackURL ?? null,
    })
    .onConflictDoUpdate({
      target: neodbStates.state,
      set: {
        instance,
        callback_url: callbackURL ?? null,
      },
    });
}

export async function popState(
  db: DrizzleD1Database<typeof schema>,
  state: string,
): Promise<Pick<NeoDBState, "instance" | "callback_url"> | null> {
  const rows = await db
    .select({ instance: neodbStates.instance, callback_url: neodbStates.callback_url })
    .from(neodbStates)
    .where(eq(neodbStates.state, state));
  await db.delete(neodbStates).where(eq(neodbStates.state, state));
  return rows[0] ?? null;
}
