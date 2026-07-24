// TODO: are these fields correctly mapped and by extension are all fields correctly mapped

/**
 * See https://www.twikey.com/api/#add-a-subscription
 *
 * The reply from creating, updating, or fetching a subscription.
 *
 * Attributes:
 *   mandateNumber - Mandate reference the subscription belongs to.
 *   ref - Reference of the subscription.
 *   state - Subscription state.
 *   amount - Amount of the transaction.
 *   startDate - Start date of the subscription.
 *   stopDate - Stop condition for the subscription.
 *   recurrencePeriod - Recurrence rule.
 *   recurrenceCount - Number of times the subscription should run.
 *   transactionMessage - Message used on the individual transactions created
 *     by the subscription.
 */
export interface SubscriptionResponse {
    mandateNumber: string;
    ref: string;
    state: string;
    amount: number;
    startDate?: string;
    stopDate?: string;
    recurrencePeriod?: string;
    recurrenceCount?: number;
    transactionMessage?: string;
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
