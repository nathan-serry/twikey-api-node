/**
 * See https://www.twikey.com/api/#execute-collection
 *
 * CollectRequest holds the fields for `CollectService.collect()`.
 *
 * Attributes:
 *   ct - Contract template ID.
 *   mndtId - Mandate reference.
 *   message - Message on bank statement.
 *   amount - Amount to be collected.
 *   ref - Internal reference.
 *   date - Transaction date.
 *   place - Place of transaction.
 */
export interface CollectRequest {
    ct: number;
    mndtId: string;
    message: string;
    amount: number;
    ref?: string;
    date?: string;
    place?: string;
}

/**
 * Query parameters for `CollectService.query()`.
 *
 * Attributes:
 *   state - Filter by collection state.
 *   generated - Filter by generation date.
 *   reqcolldt - Filter by requested collection date.
 *   ct - Filter by contract template ID.
 *   page - Page number for pagination.
 *   from - Filter by date range start.
 *   until - Filter by date range end.
 */
export interface CollectQueryRequest {
    state?: 'sent' | 'archived' | 'cancelled';
    generated?: string;
    reqcolldt?: string;
    ct?: number;
    page?: number;
    from?: string;
    until?: string;
}

/**
 * Parameters for `CollectService.detail()`.
 */
export interface CollectDetailRequest {
    [key: string]: string | number | boolean | undefined;
}
