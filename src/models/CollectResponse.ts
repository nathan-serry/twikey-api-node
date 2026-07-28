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
 * A collection batch, as returned by `CollectService.detail()` and
 * `CollectService.query()`.
 *
 * Attributes:
 *   id - Batch identifier.
 *   pmtinfid - Payment information identifier of the batch.
 *   ct - Contract template the batch was collected for.
 *   tx - Number of transactions in the batch.
 *   amount - Total amount of the batch.
 *   status - Batch status.
 *   reqcolldt - Requested collection date.
 *   generated - When the batch was generated.
 *   progress - Progress of the batch, when reported.
 *   Entries - The individual collections in the batch, when included.
 */
export interface CollectResponse {
    id: number;
    pmtinfid: string;
    ct: number;
    tx: number;
    amount: number;
    status: string;
    reqcolldt: string;
    generated: string;
    progress?: string;
    Entries?: unknown[];
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
