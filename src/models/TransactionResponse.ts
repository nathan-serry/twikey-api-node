/**
 * Represents a single transaction.
 *
 * Attributes:
 *   id - Transaction ID.
 *   mandate - Mandate reference the transaction belongs to.
 *   amount - Amount of the transaction.
 *   state - Transaction state.
 *   executionDate - Execution date of the transaction.
 *   ref - Reference.
 *   remittance - Remittance message.
 *   scaUrl - Strong customer authentication URL, if applicable.
 */
export interface Transaction {
    id: string;
    mandate: string;
    amount: number;
    state: string;
    executionDate: string;
    ref?: string;
    remittance?: string;
    scaUrl?: string;
}

/**
 * The reply from fetching transaction status/details or querying transactions.
 *
 * Mirrors Python's `TransactionStatusResponse` (`twikey/model/transaction_response.py`).
 *
 * Attributes:
 *   Entries - The list of matching transactions.
 */
export interface TransactionResponse {
    Entries: Transaction[];
}

/**
 * The reply from `TransactionService.bulkCreate()`.
 *
 * Attributes:
 *   batchId - Identifier of the created batch.
 */
export interface TransactionBulkResult {
    batchId: string;
}

/**
 * One entry in the reply from `TransactionService.bulkStatus()`.
 *
 * Attributes:
 *   id - Transaction ID.
 *   ref - Reference, if provided.
 *   mndtId - Mandate reference the transaction belongs to.
 *   status - Transaction status.
 */
export interface TransactionBulkEntry {
    id: number;
    ref: string | null;
    mndtId: string;
    status: string;
}
