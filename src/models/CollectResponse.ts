/**
 * The reply from `CollectService.collect()`, `.detail()`, or an entry from
 * `.query()`.
 *
 * Attributes:
 *   id - Collection identifier.
 *   state - Collection state.
 *   amount - Amount collected.
 *   ref - Reference, if provided.
 */
export interface CollectResponse {
    id: string;
    state: string;
    amount: number;
    ref?: string;
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
