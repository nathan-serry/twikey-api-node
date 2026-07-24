import {Customer} from "./CustomerRequest";

/**
 * See https://www.twikey.com/api/#create-invoice
 *
 * InvoiceRequest holds the full set of fields used to create an invoice via
 * the Twikey API.
 *
 * Mirrors Python's `InvoiceRequest` (`twikey/model/invoice_request.py`).
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
 * Mirrors Python's `ActionRequest` (`twikey/model/invoice_request.py`); the
 * invoice to act on is passed as the separate `invoiceId` parameter to
 * `InvoiceService.action()` rather than as a field on this type.
 *
 * Attributes:
 *   type - The action to execute (e.g. 'email', 'sms', 'reminder', 'letter',
 *     'reoffer', 'peppol', 'paymentplan').
 *   extra - Additional parameters for the action.
 */
export interface InvoiceActionRequest {
  type: string;
  extra?: string[];
}
