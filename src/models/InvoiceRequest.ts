import {Customer} from "./CustomerRequest";

/**
 * See https://www.twikey.com/api/#create-invoice
 *
 * InvoiceRequest holds the full set of fields used to create an invoice via
 * the Twikey API.
 *
 * Attributes:
 *   id - UUID of the invoice.
 *   number - Invoice number (unique identifier).
 *   title - Title or description for the invoice.
 *   remittance - Payment message, defaults to `title` if not specified.
 *   ref - Internal reference for your system.
 *   ct - Contract template identifier.
 *   amount - Amount to be billed.
 *   date - Invoice issue date (YYYY-MM-DD).
 *   duedate - Due date for payment (YYYY-MM-DD).
 *   locale - Language of the invoice (e.g., 'nl', 'fr', 'de').
 *   customer - Customer details for the invoice.
 *   customerByDocument - Mandate number to link the invoice to an existing customer.
 *   manual - Whether the invoice should be collected automatically.
 *   pdf - Base64-encoded PDF content.
 *   redirectUrl - Redirect URL after payment.
 *   email - Custom email address for invoicing.
 *   relatedInvoiceNumber - Reference to link a credit note to an invoice.
 */
export interface InvoiceRequest {
  id?: string;
  number: string;
  title?: string;
  remittance?: string;
  ref?: string;
  ct?: string;
  amount: number;
  date: string;
  duedate: string;
  locale?: string;
  customer: Customer;
  customerByDocument?: string;
  manual?: boolean;
  pdf?: string;
  redirectUrl?: string;
  email?: string;
  relatedInvoiceNumber?: string;
}

/**
 * See https://www.twikey.com/api/#create-invoice
 *
 * What `InvoiceService.create()` accepts: an invoice, plus the two switches that
 * travel as request headers rather than body fields.
 *
 * These extend `InvoiceRequest` instead of living on it because they belong to
 * the HTTP request, not to the invoice. `bulkCreate()` sends many invoices in
 * one request, so a per-invoice `purpose` there could never be honoured — it
 * takes the plain `InvoiceRequest` and this type stays out of its way.
 *
 * `manual` is deliberately *not* redefined here: it is a real body field on
 * `InvoiceRequest` (and works per-invoice in bulk). `create()` additionally
 * mirrors it to the `X-MANUAL` header, so callers only ever set it in one
 * place.
 *
 * Attributes:
 *   origin - Sent as `X-PARTNER`. Alters 'Api' in "Invoice was registered via
 *     Api" — only visible in the Twikey interface.
 *   purpose - Sent as `X-Purpose`. Alters the returned url: 'qr' (the default)
 *     returns a url usable in bank apps, 'redirect' a faster branded url.
 */
export interface InvoiceCreateRequest extends InvoiceRequest {
  origin?: string;
  purpose?: 'qr' | 'redirect';
}

/**
 * See https://www.twikey.com/api/#invoice-details
 *
 * InvoiceDetailOptions selects the extra information to include in an
 * `InvoiceService.detail()` response. Each enabled flag adds one `include=`
 * query parameter.
 *
 * Each flag corresponds to one `include=` value accepted by the endpoint.
 *
 * Attributes:
 *   lastpayment - Include details about the method and state of executed
 *     payments.
 *   meta - Include invoice meta data (reminder level, last bank error, ...).
 *   customer - Include the full customer details.
 */
export interface InvoiceDetailOptions {
  lastpayment?: boolean;
  meta?: boolean;
  customer?: boolean;
}

/**
 * See https://www.twikey.com/api/#upload-ubl
 *
 * UblUploadOptions holds the optional headers for `InvoiceService.ubl()`.
 *
 * These are converted to request headers rather than sent in the body. The
 * API documents further headers (`X-TEMPLATE`, `X-CONTRACT`, `X-PARTNER`,
 * `X-CAMPAIGN`, `X-ATTR-*`) that this SDK does not expose yet.
 *
 * Attributes:
 *   manual - Sent as `X-MANUAL: true`. The invoice is not auto-collected via a
 *     recurring mechanism on import.
 *   invoiceId - Sent as `X-INVOICE-ID`. Use your own UUID for the invoice
 *     instead of a Twikey-generated one.
 */
export interface UblUploadOptions {
  manual?: boolean;
  invoiceId?: string;
}

/**
 * See https://www.twikey.com/api/#update-invoice
 *
 * InvoiceUpdateRequest holds the fields for `InvoiceService.update()`.
 *
 * Attributes:
 *   state - Status of the invoice.
 *   amount - Amount to be billed.
 *   duedate - Due date for payment (YYYY-MM-DD).
 *   message - Payment message.
 */
export interface InvoiceUpdateRequest {
  state?: string;
  amount?: number;
  duedate?: string;
  message?: string;
}

/**
 * See https://www.twikey.com/api/#action-on-invoice
 *
 * InvoiceActionRequest holds the parameters to perform an action on an invoice.
 *
 * Holds only the action to perform and its optional parameters; the invoice
 * to act on is passed as the separate `invoiceId` parameter to
 * `InvoiceService.action()` rather than as a field on this type.
 *
 * Which extra fields apply depends on `type`. Everything set is sent as form
 * fields; anything left out is omitted. Missing required parameters come back
 * as `err_missing_params` with the offending name in `extra`.
 *
 * The `type` union covers every action confirmed valid against the API,
 * including some not listed on the docs page ('invoice'/'letterWithInvoice').
 *
 * Attributes:
 *   type - The action to execute.
 *     Invitations: 'send' (honours the customer's delivery preference, with
 *     fallback), 'email', 'sms', 'peppol', 'letter', 'letterWithInvoice',
 *     'invoice'.
 *     Reminders: 'reminder' (email; increments the reminder level 1-4 on each
 *     call), 'smsreminder'.
 *     Collection: 'reoffer' — create or re-offer a transaction to the bank.
 *   message - `refund` only. Despite the docs calling it optional, the API
 *     rejects a refund without it (`err_msg_missing`).
 *   amount - `refund` only: amount to refund. Cannot exceed the invoice amount;
 *     defaults to the full amount when omitted.
 *   initialAmount - `paymentplan` only: collected when the plan starts.
 *   recurringAmount - `paymentplan` only: collected monthly from next month.
 *   terms - `paymentplan` only: duration of the plan in months.
 *   mndtId - `paymentplan` only: mandate used to collect the installments.
 *   remittance - `paymentplan` only: message on the installment transactions.
 *     Twikey generates one when omitted.
 */
export interface InvoiceActionRequest {
  type: 'send' | 'email' | 'sms' | 'peppol' | 'letter' | 'letterWithInvoice' | 'invoice'
      | 'reminder' | 'smsreminder' | 'reoffer' | 'refund' | 'paymentplan';
  message?: string;
  amount?: number;
  initialAmount?: number;
  recurringAmount?: number;
  terms?: number;
  mndtId?: string;
  remittance?: string;
}
