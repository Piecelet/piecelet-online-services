/**
 * Test script for the stale token revocation cron job
 * Run with: npx tsx src/cron/test-cron.ts
 */
import { revokeStaleTokens } from "@/cron/revoke-stale-tokens";

async function testCron() {
  console.log("Testing cron job locally...\n");

  // You'll need to provide mock environment bindings for local testing
  const mockEnv = {
    ACCOUNT_DATABASE: {} as any, // This needs to be a real D1 binding for actual testing
  };

  try {
    await revokeStaleTokens(mockEnv as any);
    console.log("\n✅ Cron job completed successfully");
  } catch (error) {
    console.error("\n❌ Cron job failed:", error);
    process.exit(1);
  }
}

testCron();
