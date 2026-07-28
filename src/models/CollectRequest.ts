/**
 * See https://www.twikey.com/api/#execute-collection
 *
 * CollectRequest holds the fields for `CollectService.collect()`, which executes a
 * batch collection for a contract template.
 *
 * Attributes:
 *   ct - Contract template for which to do the collection.
 *   colltndt - Collection date; defaults to the earliest batch.
 *   prenotify - Whether to send a prenotification to the debtors.
 *   until - Only include transactions due up to this date.
 */
export interface CollectRequest {
    ct: number;
    colltndt?: string;
    prenotify?: boolean;
    until?: string;
}

/**
 * See https://www.twikey.com/api/#query-collections
 *
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
 * See https://www.twikey.com/api/#status-collection
 *
 * Parameters for `CollectService.detail()`. The endpoint requires either the batch
 * `id` or its `pmtinfid` — the union makes passing neither (or both) a compile error.
 *
 * Attributes:
 *   id - Batch identifier.
 *   pmtinfid - Payment information identifier of the batch, as returned in
 *     `CollectBatchResponse.rcurMsgId`.
 */
export type CollectDetailRequest =
    | { id: string | number; pmtinfid?: never }
    | { pmtinfid: string; id?: never };
