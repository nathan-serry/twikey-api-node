/**
 * The reply from creating, updating, or fetching an invoice.
 *
 * Mirrors a subset of Python's `Invoice` (`twikey/model/invoice_response.py`).
 *
 * Attributes:
 *   id - UUID of the invoice.
 *   url - URL to view the invoice, if applicable.
 *   state - Status of the invoice.
 *   number - Invoice number.
 */
export interface InvoiceResponse {
  id: string;
  url?: string;
  state: string;
  number: string;
}

/**
 * One entry from the payment feed.
 *
 * Mirrors Python's `Event` (`twikey/model/invoice_response.py`).
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
 * Mirrors Python's `Origin` (`twikey/model/invoice_response.py`).
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
 * Mirrors Python's `Gateway` (`twikey/model/invoice_response.py`).
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
 * Mirrors Python's `EventError` (`twikey/model/invoice_response.py`).
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
 * See https://www.twikey.com/api/#bulk-create-invoices
 *
 * The reply from `InvoiceService.bulkCreate()`.
 *
 * Mirrors Python's `BulkInvoiceResponse` (`twikey/model/invoice_response.py`).
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
 * Mirrors Python's `BulkBatchDetailsItem` (`twikey/model/invoice_response.py`).
 *
 * Attributes:
 *   id - The invoice ID.
 *   status - Status of the invoice ('OK' or an error).
 */
export interface InvoiceBulkEntry {
  id: string;
  status: string;
}
