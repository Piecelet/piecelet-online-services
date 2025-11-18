import { createAuthClient } from "better-auth/client";
import { jwtClient } from "better-auth/client/plugins";

// Get account service URL based on environment
const getAccountServiceURL = () => {
    // @ts-ignore - process may not be defined in Cloudflare Workers
    const isDev = typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development';
    return isDev ? "http://localhost:8787" : "https://connect.piecelet.app";
};

export const authClient = createAuthClient({
    baseURL: getAccountServiceURL(),
    plugins: [
        jwtClient()
    ]
});
