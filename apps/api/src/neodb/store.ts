import type { NeoDBAdapter, NeoDBClient } from "@/neodb/types";

export async function getClient(adapter: NeoDBAdapter, instance: string): Promise<NeoDBClient | null> {
  const result = await adapter.findOne<{
    id: string;
    instance: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    createdAt: Date;
    updatedAt: Date;
  }>({
    model: "neodbClient",
    where: [{ field: "instance", value: instance }],
  });

  if (!result) return null;

  return {
    instance: result.instance,
    client_id: result.clientId,
    client_secret: result.clientSecret,
    redirect_uri: result.redirectUri,
  };
}

export async function saveClient(adapter: NeoDBAdapter, client: NeoDBClient): Promise<void> {
  // Try to find existing client
  const existing = await adapter.findOne({
    model: "neodbClient",
    where: [{ field: "instance", value: client.instance }],
  });

  if (existing) {
    // Update existing
    await adapter.update({
      model: "neodbClient",
      where: [{ field: "instance", value: client.instance }],
      update: {
        clientId: client.client_id,
        clientSecret: client.client_secret,
        redirectUri: client.redirect_uri,
        updatedAt: new Date(),
      },
    });
  } else {
    // Create new
    await adapter.create({
      model: "neodbClient",
      data: {
        id: crypto.randomUUID(),
        instance: client.instance,
        clientId: client.client_id,
        clientSecret: client.client_secret,
        redirectUri: client.redirect_uri,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

export async function saveState(
  adapter: NeoDBAdapter,
  state: string,
  instance: string,
  callbackURL?: string | null,
): Promise<void> {
  // Try to find existing state
  const existing = await adapter.findOne({
    model: "neodbState",
    where: [{ field: "state", value: state }],
  });

  if (existing) {
    // Update existing
    await adapter.update({
      model: "neodbState",
      where: [{ field: "state", value: state }],
      update: {
        instance,
        callbackUrl: callbackURL ?? null,
        updatedAt: new Date(),
      },
    });
  } else {
    // Create new
    await adapter.create({
      model: "neodbState",
      data: {
        id: crypto.randomUUID(),
        state,
        instance,
        callbackUrl: callbackURL ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

export async function popState(
  adapter: NeoDBAdapter,
  state: string,
): Promise<{ instance: string; callbackUrl: string | null } | null> {
  const result = await adapter.findOne<{
    id: string;
    state: string;
    instance: string;
    callbackUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>({
    model: "neodbState",
    where: [{ field: "state", value: state }],
  });

  if (!result) return null;

  // Delete the state record
  await adapter.delete({
    model: "neodbState",
    where: [{ field: "state", value: state }],
  });

  return {
    instance: result.instance,
    callbackUrl: result.callbackUrl,
  };
}
