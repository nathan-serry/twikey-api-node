export interface TwikeyConfig {
  apiKey: string;
  apiUrl: string;
  userAgent?: string;
  /**
   * Hex-encoded TOTP secret, for API keys with enhanced security enabled. When set, the
   * login sends a one-time password alongside the api token.
   */
  privateKey?: string;
  /** Prefix for this partner in Twikey, usually "own". Only used together with privateKey. */
  vendorPrefix?: string;
}
