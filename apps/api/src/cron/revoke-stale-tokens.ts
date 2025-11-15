import type { CloudflareBindings } from "../env";
import { drizzle } from "drizzle-orm/d1";
import { schema, accounts as accountTable, neodbClients as neodbClientTable } from "../db";
import { and, eq, lt, or, isNull } from "drizzle-orm";
import { getClient } from "../neodb/store";
import { revokeToken } from "../neodb/mastodon";

/**
 * Cron job to revoke stale NeoDB access tokens
 * Runs every 7 days to clean up tokens that haven't been used in 24+ hours
 */
export async function revokeStaleTokens(env: CloudflareBindings): Promise<void> {
  console.log("[Cron] Starting stale token revocation job");

  const db = drizzle(env.ACCOUNT_DATABASE, { schema });

  try {
    // Calculate the cutoff time (24 hours ago)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    console.log("[Cron] Cutoff time:", cutoffTime.toISOString());

    // Find all non-redacted NeoDB accounts that haven't been updated in 24+ hours
    const staleAccounts = await db
      .select()
      .from(accountTable)
      .where(
        and(
          eq(accountTable.providerId, "neodb"),
          or(
            eq(accountTable.isAccessTokenRedacted, false),
            isNull(accountTable.isAccessTokenRedacted)
          ),
          lt(accountTable.updatedAt, cutoffTime)
        )
      )
      .all();

    console.log(`[Cron] Found ${staleAccounts.length} stale accounts to process`);

    let revokedCount = 0;
    let failedCount = 0;

    for (const acc of staleAccounts) {
      try {
        // Skip if no access token
        if (!acc.accessToken || acc.accessToken.startsWith("ACCESS_TOKEN_REDACTED_AT_")) {
          continue;
        }

        // Extract instance from accountId (format: url or @username@instance)
        let instanceOrigin: string;
        if (acc.accountId.startsWith("http")) {
          const url = new URL(acc.accountId);
          instanceOrigin = url.origin;
        } else if (acc.accountId.includes("@")) {
          // Format: @username@instance
          const parts = acc.accountId.split("@").filter(Boolean);
          if (parts.length >= 2) {
            instanceOrigin = `https://${parts[parts.length - 1]}`;
          } else {
            console.warn(`[Cron] Invalid accountId format: ${acc.accountId}`);
            continue;
          }
        } else {
          console.warn(`[Cron] Invalid accountId format: ${acc.accountId}`);
          continue;
        }

        // Get the NeoDB client for this instance
        const client = await getClient(
          {
            // Adapter methods for the store
            findOne: async (opts: any) => {
              const result = await db
                .select()
                .from(neodbClientTable)
                .where(eq(neodbClientTable.instance, opts.where[0].value))
                .get();
              return result || null;
            },
          } as any,
          instanceOrigin
        );

        if (!client) {
          console.warn(`[Cron] No client found for instance: ${instanceOrigin}`);
          continue;
        }

        // Revoke the token from NeoDB
        try {
          await revokeToken(instanceOrigin, client, acc.accessToken);
          console.log(`[Cron] Successfully revoked token for account: ${acc.id}`);
        } catch (e) {
          console.error(`[Cron] Failed to revoke token for account ${acc.id}:`, e);
          // Continue even if revocation fails
        }

        // Update the access token in the database
        const timestamp = new Date().toISOString();
        await db
          .update(accountTable)
          .set({
            accessToken: `ACCESS_TOKEN_REDACTED_AT_${timestamp}`,
            isAccessTokenRedacted: true,
            updatedAt: new Date(),
          })
          .where(eq(accountTable.id, acc.id));

        console.log(`[Cron] Successfully redacted token for account: ${acc.id}`);
        revokedCount++;
      } catch (error) {
        console.error(`[Cron] Error processing account ${acc.id}:`, error);
        failedCount++;
      }
    }

    console.log(
      `[Cron] Completed stale token revocation job: ${revokedCount} revoked, ${failedCount} failed`
    );
  } catch (error) {
    console.error("[Cron] Fatal error in stale token revocation job:", error);
    throw error;
  }
}
