import {DocumentService} from "./services/DocumentService";
import {InvoiceService} from "./services/InvoiceService";
import {TransactionService} from "./services/TransactionService";
import {TwikeyConfig} from "../models/Config";
import {PaylinkService} from "./services/PaylinkService";
import {SubscriptionService} from "./services/SubscriptionService";
import {CustomerService} from "./services/CustomerService";
import {RefundService} from "./services/RefundService";
import {CollectService} from "./services/CollectService";
import {ReportingService} from "./services/ReportingService";
import {createHmac, timingSafeEqual} from "node:crypto";
import {FetchClient, TwikeyError} from "./HttpClient";
export {TwikeyError} from "./HttpClient";

export class TwikeyClient {

  private readonly client: FetchClient;
  private readonly baseURL: string;
  private readonly userAgent: string;
  private readonly privateKey?: string;

  readonly document: DocumentService;
  readonly invoice: InvoiceService;
  readonly transaction: TransactionService;
  readonly paylink: PaylinkService;
  readonly subscription: SubscriptionService;
  readonly customer: CustomerService;
  readonly refund: RefundService;
  readonly collect: CollectService;
  readonly reporting: ReportingService;

  readonly apiKey: string;
  /** Prefix for this partner in Twikey, usually "own". Only used for OTP logins. */
  readonly vendorPrefix: string;
  /** The authenticated merchant, from the X-MERCHANT-ID login response header. */
  merchantId?: string;
  private sessionToken?: string;
  readonly maxSessionAge: number = 23 * 60 * 60 * 1000; // max 1day, but use 23 to be safe
  private lastLogin?: number;

  constructor(config: TwikeyConfig) {
    this.baseURL = config.apiUrl.replace(/\/$/, '');
    this.userAgent = config.userAgent ?? "Twikey-NodeJS/1.0";
    this.apiKey = config.apiKey;
    this.privateKey = config.privateKey;
    this.vendorPrefix = config.vendorPrefix ?? "own";

    this.client = new FetchClient(this.baseURL, {
      "User-Agent": this.userAgent,
      "Content-Type": "application/x-www-form-urlencoded",
    });

    this.client.setAuthProvider(() => this.getSessionToken());

    this.document = new DocumentService(this.client);
    this.invoice = new InvoiceService(this.client);
    this.transaction = new TransactionService(this.client);
    this.paylink = new PaylinkService(this.client);
    this.subscription = new SubscriptionService(this.client);
    this.customer = new CustomerService(this.client);
    this.refund = new RefundService(this.client);
    this.collect = new CollectService(this.client);
    this.reporting = new ReportingService(this.client);
  }

  /**
   * Return the Time-Based One-Time Password for the current time, and the provided secret.
   *
   * Required for API keys with enhanced security enabled. The secret is hex-encoded and is
   * prefixed with the vendor prefix to form the HMAC-SHA256 key; the counter is the current
   * unix time divided into 30 second windows.
   *
   * @param vendorPrefix - prefix for this partner in Twikey, usually "own"
   * @param secret - the hex-encoded private key issued with the api key
   * @returns the one-time password, at most 8 digits, not zero-padded
   */
  static getTotp(vendorPrefix: string, secret: string): number {
    const key = Buffer.concat([Buffer.from(vendorPrefix, 'utf8'), Buffer.from(secret, 'hex')]);
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));

    const hash = createHmac('sha256', key).update(counter).digest();
    const offset = hash[19] & 0x0f;
    return (hash.readUInt32BE(offset) & 0x7fffffff) % 100000000;
  }

  private async getSessionToken(): Promise<string> {
    const now = Date.now();

    if (!this.lastLogin || now - this.lastLogin > this.maxSessionAge || !this.sessionToken) {
      const formData = new URLSearchParams();
      formData.append("apiToken", this.apiKey);
      if (this.privateKey) {
        formData.append("otp", String(TwikeyClient.getTotp(this.vendorPrefix, this.privateKey)));
      }

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: formData.toString(),
      });

      if (!response.ok) throw await this.loginError(response);

      const data = await response.json() as { Authorization?: string };
      if (!data?.Authorization) {
        throw new TwikeyError(response.status, 'err_login_failed', '',
            `Invalid response for url=${this.baseURL}`, 'Config');
      }
      this.merchantId = response.headers.get('X-MERCHANT-ID') ?? undefined;
      this.lastLogin = now;
      this.sessionToken = data.Authorization;
      return data.Authorization;
    }
    return this.sessionToken;
  }

  /**
   * Builds the error for a rejected login. `err_rate_limit` and `err_login_failed` are
   * SDK-side codes used only when the response names none of its own; every other code
   * comes straight from the API.
   */
  private async loginError(response: Response): Promise<TwikeyError> {
    let body: { code?: string; message?: string; extra?: string } = {};
    // A throttled login answers with an empty body, so this often parses to nothing.
    try { body = await response.json() as typeof body; } catch { /* ignore */ }

    const retryAfter = response.headers.get('X-Rate-Limit-Retry-After-Seconds');
    const code = response.headers.get('ApiErrorCode')
        ?? body.code
        ?? (response.status === 429 ? 'err_rate_limit' : 'err_login_failed');
    const message = retryAfter
        ? `Too many logins, retry after ${retryAfter}s`
        : body.message ?? '';

    return new TwikeyError(response.status, code, body.extra ?? '', message, 'Config');
  }

  verifyWebHookSignature(signature: string, payload: string): boolean {
    const hmac = createHmac("sha256", this.apiKey)
        .update(payload)
        .digest("hex");

    return timingSafeEqual(Buffer.from(signature.toLowerCase()), Buffer.from(hmac));
  }

  async ping() {
    return await this.getSessionToken();
  }

  /**
   * Log out of Twikey, ending the current session server-side.
   *
   * Does nothing when there is no session, so it never authenticates just to sign out.
   * The next call made with this client authenticates again.
   *
   * @throws {TwikeyError} when the api returns an error
   */
  async logout(): Promise<void> {
    if (!this.sessionToken) {
      this.lastLogin = undefined;
      return;
    }

    const response = await this.client.get("", {ctx: 'Logout'});
    // A 2xx can still carry an error code in the body; that is the only signal on this route.
    const body = response.data as { code?: string; message?: string } | string | null;
    const code = typeof body === 'object' ? body?.code : undefined;
    if (code?.includes('err')) {
      throw new TwikeyError(response.statusCode, code, '',
          (body as { message?: string }).message ?? '', 'Logout');
    }

    this.sessionToken = undefined;
    this.lastLogin = undefined;
  }
}
