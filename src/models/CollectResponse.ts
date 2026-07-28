/**
 * The reply from `CollectService.collect()` and `CollectService.batchImport()`,
 * identifying the batch that was created.
 *
 * Attributes:
 *   frstMsgId - Identifier of the batch of first collections (FRST sequence type).
 *   rcurMsgId - Identifier of the batch of recurring collections, which is also its
 *     `pmtinfid`. Null when there was nothing to send.
 */
export interface CollectBatchResponse {
    frstMsgId?: string | null;
    rcurMsgId?: string | null;
}

/**
 * See https://www.twikey.com/api/#status-collection and
 * https://www.twikey.com/api/#query-collections
 *
 * A collection batch, as returned by `CollectService.detail()` and
 * `CollectService.query()`.
 *
 * `detail()` (`GET /collect`) returns only the first four fields; `query()`
 * (`GET /collect/query`) returns all of them, which is why the rest are optional.
 *
 * Attributes:
 *   id - Batch identifier.
 *   pmtinfid - Payment information identifier of the batch.
 *   ct - Contract template the batch was collected for.
 *   tx - Number of transactions in the batch.
 *   amount - Total amount of the batch. The API sends this as a string (e.g. "11.31"),
 *     unlike the numeric `amount` on transactions and invoices. `query()` only.
 *   status - Batch status, e.g. 'Sent'. `query()` only.
 *   reqcolldt - Requested collection date. `query()` only.
 *   generated - When the batch was generated. `query()` only.
 *   progress - Progress of the batch, e.g. 'sent'. `query()` only.
 */
export interface CollectResponse {
    id: number;
    pmtinfid: string;
    ct: number;
    tx: number;
    amount?: string;
    status?: string;
    reqcolldt?: string;
    generated?: string;
    progress?: string;
}

/**
 * The reply from `CollectService.query()`. The API wraps the matching
 * collections in a `{ collections: [...] }` envelope.
 *
 * Attributes:
 *   collections - The matching collections.
 *   _links - Pagination link to the current page, if provided by the API.
 */
export interface CollectQueryResponse {
    collections: CollectResponse[];
    _links?: { self?: string };
}
