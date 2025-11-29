import type { Adapter } from "better-auth";

export interface NeoDBClient {
  instance: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export type NeoDBAdapter = Adapter;

export interface NeoDBState {
  state: string;
  instance: string;
  callback_url: string | null;
  created_at: string;
}

// NeoDB /api/me response structure
export interface NeoDBMe {
  url?: string;
  external_acct?: string;
  external_accounts?: Array<{
    platform?: string;
    handle?: string;
    url?: string | null;
  }>;
  display_name?: string;
  avatar?: string;
  username?: string;
  roles?: string[];
}

// Extracted user info from NeoDB API
export interface NeoDBUserInfo {
  email: string;
  username: string; // format: @username@instance
  displayName: string;
  avatar?: string;
  externalAcct?: string;
}

export interface OAuthTokenResponse {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  expires_in?: number;
  token_type?: string;
  created_at?: number;
}

export interface AuthResultData {
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
  };
}

