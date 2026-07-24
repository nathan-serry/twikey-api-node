export interface CollectResponse {
    id: string;
    state: string;
    amount: number;
    ref?: string;
}

/**
 * The reply from `CollectService.query()`. The API wraps the matching collections
 * in a `{ collections: [...] }` envelope (with paging `_links`).
 */
export interface CollectQueryResponse {
    collections: CollectResponse[];
    _links?: { self?: string };
}
