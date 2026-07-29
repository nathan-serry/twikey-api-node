import {InvoiceLine} from "./InvoiceRequest";

/**
 * The customer an invoice belongs to, returned in `InvoiceResponse.customer` when
 * the invoice is fetched with `{customer: true}` (`include=customer`).
 *
 * Attributes:
 *   id - Twikey's own numeric identifier for the customer.
 *   customerNumber - Your customer number for them.
 *   email - Email address.
 *   firstname - First name.
 *   lastname - Last name.
 *   companyName - Company name, when the customer is a business.
 *   address - Street address.
 *   city - City.
 *   zip - Postal code.
 *   country - Country code, e.g. 'BE'.
 *   l - Language code, e.g. 'nl'.
 *   mobile - Mobile number, or null when none is known.
 */
export interface InvoiceCustomer {
  id?: number;
  customerNumber?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  companyName?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  l?: string;
  mobile?: string | null;
}

/**
 * The reply from creating, updating, or fetching an invoice.
 *
 * Only `id`, `number` and `state` are sent by every one of those calls. The rest
 * echo whatever the invoice carries, so they are optional here: `url` is absent
 * once an invoice can no longer be paid, `lines`/`campaign` only appear on an
 * invoice that has them, and `customer`/`lastpayment`/`meta` arrive only when
 * `detail()` asks for them through `InvoiceDetailOptions`.
 *
 * Attributes:
 *   id - UUID of the invoice.
 *   url - URL to view and pay the invoice, if applicable.
 *   state - Status of the invoice, e.g. 'BOOKED', 'PENDING', 'PAID' or 'EXPIRED'.
 *   number - Invoice number.
 *   title - Title of the invoice.
 *   remittance - Payment message, or null when the invoice has none.
 *   ref - Your own reference, or null when the invoice has none.
 *   amount - Amount billed.
 *   date - Invoice date (YYYY-MM-DD).
 *   duedate - Due date for payment (YYYY-MM-DD).
 *   ct - Contract template the invoice was created on.
 *   lines - The invoice's line items, when it has any.
 *   campaign - Billing run the invoice belongs to, when it belongs to one.
 *   customer - The customer, when requested with `{customer: true}`.
 *   lastpayment - The executed payments, when requested with `{lastpayment: true}`.
 *   meta - Invoice meta data (reminder level, last bank error, ...), when
 *     requested with `{meta: true}`.
 */
export interface InvoiceResponse {
  id: string;
  url?: string;
  state: string;
  number: string;
  title?: string;
  remittance?: string | null;
  ref?: string | null;
  amount?: number;
  date?: string;
  duedate?: string;
  ct?: number;
  lines?: InvoiceLine[];
  campaign?: string;
  customer?: InvoiceCustomer;
  lastpayment?: unknown[];
  meta?: Record<string, unknown>;
}

/**
 * One entry from the payment feed.
 *
 * Attributes:
 *   eventId - Unique identifier of the event.
 *   eventType - The kind of event.
 *   occurredAt - ISO date string of when the event occurred.
 *   amount - Amount involved in the event.
 *   currency - Currency of the amount.
 *   origin - The invoice this event relates to.
 *   gateway - The payment gateway involved.
 *   details - Additional event details.
 *   error - Error details, if the event represents a failure.
 */
export interface PaymentResponse {
  eventId: string;
  eventType: "payment" | "payment_failure" | "refund";
  occurredAt: string;
  amount: number;
  currency: string;
  origin: Origin;
  gateway: Gateway;
  details: object;
  error?: EventError;
}

/**
 * The invoice a payment feed event relates to.
 *
 * Attributes:
 *   object - The type of object this origin refers to.
 *   id - UUID of the invoice.
 *   number - Invoice number.
 *   ref - Invoice reference.
 */
export interface Origin {
  object: "invoice";
  id: string;
  number: string;
  ref: string;
}

/**
 * The payment gateway a payment feed event was processed through.
 *
 * Attributes:
 *   id - Identifier of the gateway.
 *   name - Name of the gateway.
 *   type - The kind of gateway.
 *   iban - IBAN associated with the gateway, if applicable.
 */
export interface Gateway {
  id: number;
  name: string;
  type: "bank" | "psp";
  iban: string | null;
}

/**
 * Details of a failed payment, present on a payment feed event that failed.
 *
 * Attributes:
 *   code - Error code.
 *   description - Human-readable error description.
 *   category - Error category.
 *   externalCode - Error code from an external system, if applicable.
 *   action - Suggested follow-up action.
 *   actionStep - Step number of the suggested follow-up action.
 */
export interface EventError {
  code: string;
  description: string;
  category: string;
  externalCode: string;
  action?: string;
  actionStep?: number;
}

/**
 * The reply from `InvoiceService.qr()`.
 *
 * Attributes:
 *   url - URL encoded in the QR code.
 *   qr - The QR code image, if returned by the API.
 */
export interface InvoiceQrResponse {
  url: string;
  qr?: string;
}

/**
 * See https://www.twikey.com/api/#bulk-create
 *
 * The reply from `InvoiceService.bulkCreate()`.
 *
 * Attributes:
 *   batchId - The UUID identifier of the created batch.
 */
export interface InvoiceBulkResult {
  batchId: string;
}

/**
 * See https://www.twikey.com/api/#bulk-batch-details
 *
 * One entry in the reply from `InvoiceService.bulkStatus()`.
 *
 * Attributes:
 *   id - The invoice ID.
 *   status - Status of the invoice ('OK' or an error).
 */
export interface InvoiceBulkEntry {
  id: string;
  status: string;
}
