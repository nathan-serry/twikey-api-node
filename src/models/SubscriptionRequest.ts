/**
 * See https://www.twikey.com/api/#add-a-subscription
 *
 * SubscriptionRequest holds the fields needed to create a subscription (a
 * recurring transaction schedule) on a mandate via the Twikey API.
 *
 * Attributes:
 *   ct - Contract template ID. Optional: the mandate given in `mndtId` already
 *     determines the contract.
 *   mndtId - Mandate reference.
 *   ref - Reference for the subscription, and the handle used to update it later.
 *     Converted to uppercase, and may not contain spaces.
 *   amount - Amount of the transaction.
 *   message - Message to the subscriber.
 *   plan - Name of the base plan to build the subscription on.
 *   recurrence - Recurrence rule: one of 1w/1m/2m/3m/4m/6m/12m (defaults to
 *     1m server-side if omitted).
 *   start - Start date of the subscription. Must be a future date.
 *   stop - Stop condition for the subscription.
 *   stopAfter - Number of runs after which the subscription stops. Omit it, or
 *     send 0, for a subscription that runs indefinitely.
 *   transactionMessage - Message used on the individual transactions created
 *     by the subscription.
 */
export interface SubscriptionRequest {
    ct?: number;
    mndtId: string;
    ref?: string;
    amount: number;
    message?: string;
    plan?: string;
    recurrence?: string;
    start?: string;
    stop?: string;
    stopAfter?: number;
    transactionMessage?: string;
}

/**
 * SubscriptionUpdateRequest holds the fields for both the full-replacement
 * update (`SubscriptionService.update`, see
 * https://www.twikey.com/api/#update-a-subscription) and the partial update
 * (`SubscriptionService.partialUpdate`, see
 * https://www.twikey.com/api/#patch-a-subscription).
 *
 * The two endpoints do not require the same fields. `update()` needs `start`,
 * `message` and `amount` (it supplies `mndtId` itself), and rejects a request
 * missing any of them; `partialUpdate()` requires none of them and applies
 * whichever are given. They are all optional here because one type serves both.
 *
 * Attributes:
 *   mndtId - Mandate reference to move the subscription to. Omit to leave the
 *     subscription on its current mandate.
 *   amount - Amount of the transaction. Required by `update()`.
 *   message - Message to the subscriber. Required by `update()`.
 *   start - Start date of the subscription. Must be a future date. Required by
 *     `update()`.
 *   stop - Stop condition for the subscription.
 *   plan - Name of the base plan to build the subscription on. Takes precedence
 *     over `message`, `amount` and `recurrence`.
 *   recurrence - Recurrence rule: one of 1w/1m/2m/3m/4m/6m/12m.
 *   stopAfter - Number of runs after which the subscription stops. Omit it, or
 *     send 0, for a subscription that runs indefinitely.
 *   transactionMessage - Message used on the individual transactions created
 *     by the subscription.
 */
export interface SubscriptionUpdateRequest {
    mndtId?: string;
    amount?: number;
    message?: string;
    start?: string;
    stop?: string;
    plan?: string;
    recurrence?: string;
    stopAfter?: number;
    transactionMessage?: string;
}

/**
 * Query parameters for `SubscriptionService.query()`.
 */
export interface SubscriptionQueryRequest {
    [key: string]: string | number | boolean | undefined;
}
