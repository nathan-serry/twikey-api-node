/**
 * See https://www.twikey.com/api/#add-a-beneficiary-account
 *
 * The fields for registering a beneficiary account, so refunds can be paid to it.
 *
 * Attributes:
 *   customerNumber - Your customer number for the beneficiary.
 *   name - First and last name of the beneficiary.
 *   companyName - Company name, when the beneficiary is a business. Takes
 *     precedence over `name` on the created record.
 *   email - Email address.
 *   l - Language code, ISO 2 letters.
 *   mobile - Mobile number in international format, required to send an sms.
 *   iban - IBAN of the beneficiary.
 *   bic - BIC of the beneficiary.
 *   vatno - Enterprise number of the company.
 *   address - Street name and number. Required for a customer Twikey does not
 *     know yet.
 *   city - City. Required for a customer Twikey does not know yet.
 *   zip - Postal code.
 *   country - Country code, ISO 2 letters. Required for a customer Twikey does
 *     not know yet.
 */
export interface BeneficiaryRequest {
    customerNumber?: string;
    name: string;
    companyName?: string;
    email?: string;
    l?: string;
    mobile?: string;
    iban: string;
    bic?: string;
    vatno?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
}

/**
 * See https://www.twikey.com/api/#createadd-a-new-credit-transfer
 *
 * The fields for creating a refund (credit transfer) to a beneficiary.
 *
 * Attributes:
 *   ref - Your reference for the transfer.
 *   message - Message to the beneficiary.
 *   amount - Amount to be refunded.
 *   iban - IBAN of the beneficiary, which must be an active account. Optional
 *     when `customerNumber` identifies a customer whose account Twikey can
 *     already derive.
 *   bic - BIC of the beneficiary.
 *   name - Name of the beneficiary.
 *   date - Date the transfer should be executed (`ReqdExctnDt`). Defaults to as
 *     soon as possible.
 *   place - Optional place.
 *   address - Street name and number of the beneficiary.
 *   city - City of the beneficiary.
 *   zip - Postal code of the beneficiary.
 *   country - Country code of the beneficiary.
 *   ct - Contract template to use.
 *   customerNumber - Your customer number for the beneficiary.
 */
export interface RefundRequest {
    ref?: string;
    message: string;
    amount: number;
    iban?: string;
    bic?: string;
    name?: string;
    date?: string;
    place?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    ct?: number;
    customerNumber?: string;
}

export interface RefundBatchRequest {
    ct: number;
    iban?: string;
}

// Identifies an existing refund batch for status lookup. NOT the same as
// RefundBatchRequest (ct/iban), which creates a batch.
export interface RefundBatchStatusRequest {
    id: string | number;
    pmtinfid?: string;
}
