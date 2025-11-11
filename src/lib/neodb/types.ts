export interface NeoDBClient {
  instance: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export interface NeoDBState {
  state: string;
  instance: string;
  callback_url: string | null;
  created_at: string;
}

// Minimal structure for /api/me. You can extend it as needed.
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
