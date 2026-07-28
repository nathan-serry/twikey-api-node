/**
 * See https://www.twikey.com/api/#add-a-subscription
 *
 * The reply from creating, updating or fetching a subscription, and one entry of
 * `SubscriptionService.query()`.
 *
 * These are the names the API actually sends, confirmed against live payloads from
 * `POST /subscription`, `GET /subscription/{mndtId}/{ref}` and `GET /subscription/query`
 * across 89 subscriptions: create and detail replies are byte-identical in shape, and query
 * entries carry the same keys.
 *
 * Attributes:
 *   id - Twikey's numeric identifier for the subscription.
 *   mndtId - Mandate reference the subscription belongs to.
 *   ref - Reference of the subscription. Null when the subscription has none.
 *   state - Subscription state, e.g. 'active' or 'cancelled'.
 *   amount - Amount of each transaction the subscription creates.
 *   message - Message to the subscriber.
 *   recurrence - Recurrence rule, e.g. '1m'.
 *   start - Start date of the subscription (YYYY-MM-DD).
 *   last - Date the subscription last ran, or null when it has not run yet.
 *   next - Date the subscription runs next. Absent once there is no next run, as on a
 *     cancelled subscription.
 *   plan - Payment plan the subscription belongs to; 0 when it belongs to none.
 *   runs - Number of transactions the subscription has created so far.
 *   stopAfter - Number of runs after which the subscription stops; 0 when it is open-ended.
 */
export interface SubscriptionResponse {
    id: number;
    mndtId: string;
    ref: string | null;
    state: string;
    amount: number;
    message: string;
    recurrence: string;
    start: string;
    last: string | null;
    next?: string;
    plan: number;
    runs: number;
    stopAfter: number;
}

/**
 * The reply from `SubscriptionService.query()`. The API wraps the matching
 * subscriptions in a `{ Subscriptions: [...] }` envelope (with paging `_links`).
 *
 * Attributes:
 *   Subscriptions - The list of matching subscriptions.
 *   _links - Optional paging links.
 */
export interface SubscriptionQueryResponse {
    Subscriptions: SubscriptionResponse[];
    _links?: { self?: string };
}
