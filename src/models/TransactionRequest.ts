/**
 * See https://www.twikey.com/api/#new-transaction
 *
 * TransactionRequest holds the fields needed to create a new transaction.
 *
 * Attributes:
 *   mndtId - Mandate reference.
 *   date - Transaction date (ISO format YYYY-MM-DD).
 *   reqcolldt - Desired collection date.
 *   message - Message on bank statement (max. 140 characters).
 *   ref - Internal reference.
 *   amount - Amount to be collected.
 *   place - Place of transaction.
 *   refase2e - Use `ref` as the end-to-end ID.
 *   reservation - Marks the transaction as a reservation rather than an
 *     immediate collection; set internally by `TransactionService.authorise()`.
 */
export interface TransactionRequest {
    mndtId: string;
    date?: string;
    reqcolldt?: string;
    message: string;
    ref?: string;
    amount: number;
    place?: string;
    refase2e?: boolean;
    reservation?: boolean;
}

/**
 * TransactionUpdateRequest holds the fields for `TransactionService.update()`.
 *
 * Attributes:
 *   status - New status for the transaction.
 *   executionDate - New execution date for the transaction.
 */
export interface TransactionUpdateRequest {
    status?: string;
    executionDate?: string;
}

/**
 * See https://www.twikey.com/api/#action-on-transaction
 *
 * TransactionActionRequest holds the parameters to perform an action on a
 * transaction, identified by either `id` or an alternate `ref`.
 *
 * Attributes:
 *   id - The unique ID of the transaction the action applies to.
 *   ref - The transaction's reference, usable instead of `id`.
 *   action - The type of action to perform.
 */
export interface TransactionActionRequest {
    id?: string;
    ref?: string;
    action: string;
}

/**
 * See https://www.twikey.com/api/#refund-a-transaction
 *
 * TransactionRefundRequest holds the parameters to refund a transaction.
 *
 * Attributes:
 *   id - Transaction ID.
 *   ref - Reference.
 *   amount - Amount to be refunded.
 *   message - Message on bank statement (max. 140 characters).
 */
export interface TransactionRefundRequest {
    id?: string;
    ref?: string;
    amount?: number;
    message?: string;
}

/**
 * See https://www.twikey.com/api/#remove-a-transaction
 *
 * TransactionRemoveRequest holds the parameters to remove a transaction that
 * hasn't yet been sent to the bank. At least one of `id` or `ref` must be
 * provided.
 *
 * Attributes:
 *   id - A transaction ID as returned in the POST response.
 *   ref - The transaction reference provided during creation.
 */
export interface TransactionRemoveRequest {
    id?: string;
    ref?: string;
}

/**
 * See https://www.twikey.com/api/#query-transactions
 *
 * TransactionQueryRequest holds the parameters to query transactions,
 * starting from a specific transaction ID.
 *
 * Attributes:
 *   fromId - The ID of the transaction to start from.
 */
export interface TransactionQueryRequest {
    fromId?: string;
    [key: string]: string | number | boolean | undefined;
}
