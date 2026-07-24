/**
 * Base contact/identity fields shared across Document, Customer and Paylink
 * requests. Field-by-field this mirrors Python's `InviteRequest` attributes
 * (`twikey/model/document_request.py`) where they overlap.
 *
 * Attributes:
 *   l - Language code (e.g., 'en', 'nl').
 *   customerNumber - Internal customer reference.
 *   email - Email address.
 *   lastname - Last name.
 *   firstname - First name.
 *   mobile - Mobile phone number (international format).
 *   address - Street address.
 *   city - City name.
 *   zip - Postal code.
 *   country - Country code (e.g., 'BE').
 *   companyName - Name of the company (if a business entity).
 *   coc - Enterprise/company registration number.
 *   vatno - VAT number.
 *   peppol - PEPPOL e-invoicing identifier.
 *   delivery - Delivery preference/channel.
 */
export interface BaseInfo {
    l?: string;
    customerNumber?: string | number;
    email?: string;
    lastname?: string;
    firstname?: string;
    mobile?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    companyName?: string;
    coc?: string;
    vatno?: string;
    peppol?: string;
    delivery?: string;
}

export interface FeedOptions {
    includes?: string[];
    start_position?: number;
    last_position?: number;
}

export interface PdfResponse {
    content: Buffer;
    filename: string;
}
