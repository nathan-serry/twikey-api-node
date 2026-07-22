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
import {FetchClient} from "./HttpClient";
export {TwikeyError} from "./HttpClient";

export class TwikeyClient {

  private readonly client: FetchClient;
  private readonly baseURL: string;
  private readonly userAgent: string;

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
  private sessionToken?: string;
  readonly maxSessionAge: number = 23 * 60 * 60 * 1000; // max 1day, but use 23 to be safe
  private lastLogin?: number;

  constructor(config: TwikeyConfig) {
    this.baseURL = config.apiUrl.replace(/\/$/, '');
    this.userAgent = config.userAgent ?? "Twikey-NodeJS/1.0";
    this.apiKey = config.apiKey;

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

  private async getSessionToken(): Promise<string> {
    const now = Date.now();

    if (!this.lastLogin || now - this.lastLogin > this.maxSessionAge || !this.sessionToken) {
      const formData = new URLSearchParams();
      formData.append("apiToken", this.apiKey);

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: formData.toString(),
      });

      if (!response.ok) throw new Error("Failed to login");

      const data = await response.json() as { Authorization: string };
      this.lastLogin = now;
      this.sessionToken = data.Authorization;
      return data.Authorization;
    }
    return this.sessionToken;
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
}
