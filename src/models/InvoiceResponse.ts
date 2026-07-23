export interface InvoiceResponse {
  id: string; // Invoice ID
  url?: string; // Payment URL (if applicable)
  state: string; // Invoice state
  number: string; // Invoice number
}

export interface PaymentResponse {
  eventId: string;
  eventType: "payment" | "payment_failure" | "refund";
  occurredAt: string; // ISO date string
  amount: number;
  currency: string;
  origin: Origin;
  gateway: Gateway;
  details: object;
  error?: EventError;
}

export interface Origin {
  object: "invoice";
  id: string;
  number: string;
  ref: string;
}

export interface Gateway {
  id: number;
  name: string;
  type: "bank" | "psp";
  iban: string | null;
}

export interface EventError {
  code: string;
  description: string;
  category: string;
  externalCode: string;
  action?: string;
  actionStep?: number;
}

export interface InvoiceQrResponse {
  url: string;
  qr?: string;
}

export interface InvoiceBulkResult {
  batchId: string;
}

export interface InvoiceBulkEntry {
  id: string;
  status: string;
}
