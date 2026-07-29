/**
 * The postal address of a beneficiary account, as returned in
 * `BeneficiaryResponse.address`.
 *
 * Attributes:
 *   street - Street name and number.
 *   city - City.
 *   zip - Postal code.
 *   country - Country code, e.g. 'BE'.
 */
export interface BeneficiaryAddress {
    street?: string;
    city?: string;
    zip?: string;
    country?: string;
}

/**
 * See https://www.twikey.com/api/#get-beneficiary-accounts
 *
 * A beneficiary account, as returned by `RefundService.getBeneficiaries()` and
 * `RefundService.addBeneficiary()`.
 *
 * Attributes:
 *   iban - IBAN of the beneficiary account.
 *   name - Name on the account.
 *   bic - BIC of the account.
 *   available - Whether the account may be used as the target of a refund. Check
 *     this before creating a transfer to the account.
 *   ref - Your customer number for the beneficiary, or null when it has none.
 *   address - Postal address of the beneficiary, or null when none is known.
 *   customerNumber - Your customer number for the beneficiary.
 *   state - State of the account.
 */
export interface BeneficiaryResponse {
    iban: string;
    name: string;
    bic?: string;
    available?: boolean;
    ref?: string | null;
    address?: BeneficiaryAddress | null;
    customerNumber?: string;
    state?: string;
}

/**
 * RefundResponse represents a single credit-transfer (refund) entry as returned
 * by the Twikey API.
 *
 * Attributes:
 *   id - Twikey identifier of the refund.
 *   iban - IBAN of the beneficiary.
 *   bic - BIC of the beneficiary.
 *   amount - Amount of the refund.
 *   msg - Message for the beneficiary.
 *   place - Optional place.
 *   ref - Your reference.
 *   date - Date when the transfer was requested.
 *   state - State of the transfer (e.g. 'Paid').
 *   bkdate - Date when the transfer was executed by the bank.
 */
export interface RefundResponse {
    id: number;
    iban: string;
    bic?: string;
    amount: number;
    msg?: string;
    place?: string;
    ref?: string;
    date?: string;
    state?: string;
    bkdate?: string;
}

export interface RefundBatchResponse {
    id: number;
    pmtinfid: string;
    progress?: string;
    entries: number;
}
