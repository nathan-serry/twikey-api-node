export interface BeneficiaryResponse {
    iban: string;
    name: string;
    bic?: string;
    customerNumber?: string;
    state?: string;
}

/**
 * RefundResponse represents a single credit-transfer (refund) entry as returned
 * by the Twikey API.
 *
 * Mirrors Python's `Refund` (`twikey/model/refund_response.py`).
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
