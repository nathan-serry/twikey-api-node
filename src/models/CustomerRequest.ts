import {BaseInfo} from "./Shared";

/**
 * Customer information embedded in `InvoiceRequest.customer`.
 *
 * Mirrors Python's `Customer` (`twikey/model/invoice_request.py`); the shared
 * contact fields (customer number, email, name, address, etc.) come from
 * `BaseInfo`.
 *
 * Attributes:
 *   language - Language of the customer. Mirrors Python's `Customer.lang`.
 */
export interface Customer extends BaseInfo {
    language?: string;
}

export interface CustomerRequest {
    firstname?: string;
    lastname?: string;
    email?: string;
    companyName?: string;
    coc?: string;
    vatno?: string;
    peppol?: string;
    delivery?: string;
    customerNo?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    l?: string;
    mobile?: string;
    ct?: number;
}

export interface CustomerLoginRequest {
    customerNumber: string;
    email?: string;
    mobile?: string;
}
