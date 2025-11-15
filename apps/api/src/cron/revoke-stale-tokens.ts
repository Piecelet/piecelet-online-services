import type { CloudflareBindings } from "../env";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "../db";
import { getClient } from "../neodb/store";
import { revokeToken } from "../neodb/mastodon";

/**
 * Cron job to revoke stale NeoDB access tokens
 * Runs every 7 days to clean up tokens that haven't been used in 24+ hours
 */
export async function revokeStaleTokens(env: CloudflareBindings): Promise<void> {
  console.log("[Cron] Starting stale token revocation job");

  const db = drizzle(env.ACCOUNT_DATABASE, { schema, logger: true });

  try {
    // Calculate the cutoff time (24 hours ago)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    console.log("[Cron] Cutoff time:", cutoffTime.toISOString());

    // Find all non-redacted NeoDB accounts that haven't been updated in 24+ hours
    const staleAccounts = await db.query.account.findMany({
      where: (account, { and, eq, lt, or, isNull }) =>
        and(
          eq(account.providerId, "neodb"),
          or(
            eq(account.isAccessTokenRedacted, false),
            isNull(account.isAccessTokenRedacted)
          ),
          lt(account.updatedAt, cutoffTime)
        ),
    });

    console.log(`[Cron] Found ${staleAccounts.length} stale accounts to process`);

    let revokedCount = 0;
    let failedCount = 0;

    for (const account of staleAccounts) {
      try {
        // Skip if no access token
        if (!account.accessToken || account.accessToken.startsWith("ACCESS_TOKEN_REDACTED_AT_")) {
          continue;
        }

        // Extract instance from accountId (format: url or @username@instance)
        let instanceOrigin: string;
        if (account.accountId.startsWith("http")) {
          const url = new URL(account.accountId);
          instanceOrigin = url.origin;
        } else if (account.accountId.includes("@")) {
          // Format: @username@instance
          const parts = account.accountId.split("@").filter(Boolean);
          if (parts.length >= 2) {
            instanceOrigin = `https://${parts[parts.length - 1]}`;
          } else {
            console.warn(`[Cron] Invalid accountId format: ${account.accountId}`);
            continue;
          }
        } else {
          console.warn(`[Cron] Invalid accountId format: ${account.accountId}`);
          continue;
        }

        // Get the NeoDB client for this instance
        const client = await getClient(
          {
            // Adapter methods for the store
            findOne: async (opts: any) => {
              const result = await db.query.neodbClient.findFirst({
                where: (neodbClient, { eq }) => eq(neodbClient.instance, opts.where[0].value),
              });
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
          await revokeToken(instanceOrigin, client, account.accessToken);
          console.log(`[Cron] Successfully revoked token for account: ${account.id}`);
        } catch (e) {
          console.error(`[Cron] Failed to revoke token for account ${account.id}:`, e);
          // Continue even if revocation fails
        }

        // Update the access token in the database
        const timestamp = new Date().toISOString();
        await db
          .update(schema.account)
          .set({
            accessToken: `ACCESS_TOKEN_REDACTED_AT_${timestamp}`,
            isAccessTokenRedacted: true,
            updatedAt: new Date(),
          })
          .where(eq => eq.id === account.id);

        console.log(`[Cron] Successfully redacted token for account: ${account.id}`);
        revokedCount++;
      } catch (error) {
        console.error(`[Cron] Error processing account ${account.id}:`, error);
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
