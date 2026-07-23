import {Customer} from "./CustomerRequest";

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

export interface InvoiceUpdateRequest {
  state?: string;
  amount?: number;
  duedate?: string;
  message?: string;
}

export interface InvoiceActionRequest {
  type: string;
  extra?: string[];
}
