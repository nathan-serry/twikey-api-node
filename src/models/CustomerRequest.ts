import {BaseInfo} from "./Shared";

/**
 * Customer information embedded in `InvoiceRequest.customer`.
 *
 * The shared contact fields (customer number, email, name, address, etc.)
 * come from `BaseInfo`.
 *
 * Attributes:
 *   language - Language of the customer.
 */
export interface Customer extends BaseInfo {
    language?: string;
}

/**
 * See https://www.twikey.com/api/#update-a-customer
 *
 * The fields for updating a customer, used by `CustomerService.update()` and
 * `CustomerService.replace()`. Every field is optional: only the ones you set are
 * sent, and only those are changed.
 *
 * Attributes:
 *   firstname - First name of the customer.
 *   lastname - Last name of the customer.
 *   email - Email address of the customer.
 *   companyName - Company name, when the customer is a business.
 *   coc - Enterprise number. Only applied when `companyName` changes as well.
 *   vatno - VAT number of the company.
 *   peppol - PEPPOL address of the customer.
 *   delivery - Delivery preference for the customer.
 *   customerNumber - The customer number to give the customer, to renumber them.
 *   customerNo - Older name for the customer number.
 *   address - Street name and number.
 *   city - City of the customer.
 *   zip - Postal code of the customer.
 *   country - Country code, ISO 2 letters.
 *   l - Language code, e.g. 'nl'.
 *   mobile - Mobile number in international format.
 *   ct - Default contract template for the customer.
 */
export interface CustomerRequest {
    firstname?: string;
    lastname?: string;
    email?: string;
    companyName?: string;
    coc?: string;
    vatno?: string;
    peppol?: string;
    delivery?: string;
    customerNumber?: string;
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
