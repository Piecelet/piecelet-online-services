// export interface CloudflareBindings {
//     ACCOUNT_DATABASE: D1Database;
//     ACCOUNT_KV: KVNamespace;
// }

declare global {
    namespace NodeJS {
        interface ProcessEnv extends CloudflareBindings {
            // Additional environment variables can be added here
        }
    }
}
