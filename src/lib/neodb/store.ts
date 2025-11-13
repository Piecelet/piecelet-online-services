import type { NeoDBClient } from "./types";
import type { Adapter } from "better-auth";

export async function getClient(adapter: Adapter, instance: string): Promise<NeoDBClient | null> {
  console.log('[neodb] getClient called for instance:', instance);

  try {
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

    console.log('[neodb] getClient result:', result ? 'found' : 'not found');

    if (!result) return null;

    return {
      instance: result.instance,
      client_id: result.clientId,
      client_secret: result.clientSecret,
      redirect_uri: result.redirectUri,
    };
  } catch (error) {
    console.error('[neodb] getClient error:', error);
    throw error;
  }
}

export async function saveClient(adapter: Adapter, client: NeoDBClient): Promise<void> {
  console.log('[neodb] saveClient called with:', { instance: client.instance });

  try {
    // Try to find existing client
    const existing = await adapter.findOne({
      model: "neodbClient",
      where: [{ field: "instance", value: client.instance }],
    });

    console.log('[neodb] Existing client found:', !!existing);

    if (existing) {
      // Update existing
      console.log('[neodb] Updating existing client');
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
      console.log('[neodb] Client updated successfully');
    } else {
      // Create new
      const newClientData = {
        id: crypto.randomUUID(),
        instance: client.instance,
        clientId: client.client_id,
        clientSecret: client.client_secret,
        redirectUri: client.redirect_uri,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log('[neodb] Creating new client with data:', newClientData);
      await adapter.create({
        model: "neodbClient",
        data: newClientData,
      });
      console.log('[neodb] Client created successfully');
    }
  } catch (error) {
    console.error('[neodb] saveClient error:', error);
    throw error;
  }
}

export async function saveState(
  adapter: Adapter,
  state: string,
  instance: string,
  callbackURL?: string | null,
): Promise<void> {
  console.log('[neodb] saveState called with:', { state: state.substring(0, 10) + '...', instance });

  try {
    // Try to find existing state
    const existing = await adapter.findOne({
      model: "neodbState",
      where: [{ field: "state", value: state }],
    });

    console.log('[neodb] Existing state found:', !!existing);

    if (existing) {
      // Update existing
      console.log('[neodb] Updating existing state');
      await adapter.update({
        model: "neodbState",
        where: [{ field: "state", value: state }],
        update: {
          instance,
          callbackUrl: callbackURL ?? null,
          updatedAt: new Date(),
        },
      });
      console.log('[neodb] State updated successfully');
    } else {
      // Create new
      const newStateData = {
        id: crypto.randomUUID(),
        state,
        instance,
        callbackUrl: callbackURL ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log('[neodb] Creating new state with data:', { ...newStateData, state: state.substring(0, 10) + '...' });
      await adapter.create({
        model: "neodbState",
        data: newStateData,
      });
      console.log('[neodb] State created successfully');
    }
  } catch (error) {
    console.error('[neodb] saveState error:', error);
    throw error;
  }
}

export async function popState(
  adapter: Adapter,
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
