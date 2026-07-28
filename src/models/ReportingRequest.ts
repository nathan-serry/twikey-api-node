/**
 * ReportingEntry represents a single bank-statement line item passed to
 * `ReportingService.addItems()`.
 *
 * Attributes:
 *   name - Name of the counterparty.
 *   msg - Message/description of the transaction.
 *   amount - Amount of the transaction.
 *   date - Date of the transaction.
 *   iban - IBAN of the counterparty.
 *   bic - BIC of the counterparty.
 */
export interface ReportingEntry {
    name: string;
    msg: string;
    amount: number;
    date: string;
    iban: string;
    bic: string;
}

/**
 * Parameters for `ReportingService.generateReconciliation()`.
 *
 * Attributes:
 *   sdd - Whether to include SEPA Direct Debit collections in the file.
 *   paylink - Whether to include payment link collections in the file.
 *   format - The file format to generate (e.g. 'csv').
 */
export interface ReconciliationGenerateRequest {
    sdd?: boolean;
    paylink?: boolean;
    format: string;
}
