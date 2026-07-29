/**
 * A customer, as returned by `CustomerService.fetch()`.
 *
 * Attributes:
 *   id - Twikey's own numeric identifier for the customer.
 *   customerNumber - Your customer number for them.
 *   firstname - First name.
 *   lastname - Last name.
 *   email - Email address.
 *   companyName - Company name, when the customer is a business.
 *   coc - Enterprise number of the company.
 *   vatno - VAT number of the company.
 *   address - Street address.
 *   city - City.
 *   zip - Postal code.
 *   country - Country code, e.g. 'BE'.
 *   mobile - Mobile number, or null when none is known.
 *   l - Language code, e.g. 'nl'.
 *   language - Language of the customer.
 *   peppol - PEPPOL address of the customer.
 *   delivery - Delivery preference for the customer.
 */
export interface CustomerResponse {
    id?: number;
    l?: string;
    customerNumber?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    companyName?: string;
    coc?: string;
    vatno?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    mobile?: string;
    language?: string;
    peppol?: string;
    delivery?: string;
}

export interface CustomerLoginResponse {
    url: string;
    token?: string;
}
