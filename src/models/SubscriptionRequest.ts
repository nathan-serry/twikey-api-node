/**
 * See https://www.twikey.com/api/#add-a-subscription
 *
 * SubscriptionRequest holds the fields needed to create a subscription (a
 * recurring transaction schedule) on a mandate via the Twikey API.
 *
 * Attributes:
 *   ct - Contract template ID.
 *   mndtId - Mandate reference.
 *   ref - Reference for the subscription.
 *   amount - Amount of the transaction.
 *   message - Message to the subscriber.
 *   recurrence - Recurrence rule: one of 1w/1m/2m/3m/4m/6m/12m (defaults to
 *     1m server-side if omitted).
 *   start - Start date of the subscription. Must be a future date.
 *   stop - Stop condition for the subscription.
 *   recurrenceCount - Number of times the subscription should run.
 *   transactionMessage - Message used on the individual transactions created
 *     by the subscription.
 */
export interface SubscriptionRequest {
    ct: number;
    mndtId: string;
    ref?: string;
    amount: number;
    message?: string;
    recurrence?: string;
    start?: string;
    stop?: string;
    recurrenceCount?: number;
    transactionMessage?: string;
}

/**
 * SubscriptionUpdateRequest holds the fields for both the full-replacement
 * update (`SubscriptionService.update`, see
 * https://www.twikey.com/api/#update-a-subscription) and the partial update
 * (`SubscriptionService.partialUpdate`, see
 * https://www.twikey.com/api/#patch-a-subscription).
 *
 * Attributes:
 *   amount - Amount of the transaction.
 *   message - Message to the subscriber.
 *   start - Start date of the subscription. Must be a future date.
 *   stop - Stop condition for the subscription.
 *   recurrence - Recurrence rule: one of 1w/1m/2m/3m/4m/6m/12m.
 *   recurrenceCount - Number of times the subscription should run.
 *   transactionMessage - Message used on the individual transactions created
 *     by the subscription.
 */
export interface SubscriptionUpdateRequest {
    amount?: number;
    message?: string;
    start?: string;
    stop?: string;
    recurrence?: string;
    recurrenceCount?: number;
    transactionMessage?: string;
}

/**
 * Query parameters for `SubscriptionService.query()`.
 */
export interface SubscriptionQueryRequest {
    [key: string]: string | number | boolean | undefined;
}
