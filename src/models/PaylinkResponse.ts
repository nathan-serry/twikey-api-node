/**
 * The reply from creating (`create()`) or fetching (`detail()`) a payment link.
 *
 * One shared shape covers both directions: `create()` returns the `url` and no `state`,
 * while a fetch returns the `state` and `ct` but no `url`.
 *
 * Attributes:
 *   id - Payment link ID.
 *   url - URL of the payment link. Only present on the `create()` response.
 *   msg - Message shown to the customer.
 *   amount - Amount to be paid.
 *   ref - Reference of the payment link.
 *   ct - Contract template the link belongs to. Sent when fetched, not on `create()`.
 *   state - State of the payment link, e.g. 'created' or 'paid'. Only present when
 *     fetched via `detail()`.
 *   meta - Meta information about the link. Present only when fetched with
 *     `{meta: true}` (`include=meta`).
 *   refunds - Refunds recorded against the link. Present only when fetched
 *     with `{refunds: true}` (`include=refunds`).
 */
export interface PaylinkResponse {
    id: number;
    url: string;
    msg: string;
    amount: number;
    ref: string;
    ct?: number;
    state?: string;
    meta?: PaylinkMeta;
    refunds?: PaylinkRefundEntry[];
}

/**
 * Meta information about a payment link, returned in `PaylinkResponse.meta` when
 * fetched with `{meta: true}` (`include=meta`).
 *
 * Only `active` was present on every link observed; `paymentMethod` appears once a
 * link has been paid. Other link types may carry further keys (e.g. direct-debit or
 * transaction details), hence the index signature rather than a closed shape.
 *
 * Attributes:
 *   active - Whether the link is still payable.
 *   paymentMethod - The method the customer paid with, e.g. 'mastercard'.
 *   [key] - Further meta fields the API may return, not individually typed.
 */
export interface PaylinkMeta {
    active?: boolean;
    paymentMethod?: string;
    [key: string]: unknown;
}

/**
 * A refund recorded against a payment link, as returned in `PaylinkResponse.refunds`
 * by `PaylinkService.detail(id, true)`.
 *
 * Attributes:
 *   id - The refund's own identifier (e.g. `re_EqBdFXPMFgRL429DZCXUJ`). This is the
 *     only place the API hands it back — `PaylinkService.refund()` does not return it.
 *   amount - The refunded amount.
 *   timestamp - When the refund was created (ISO8601).
 */
export interface PaylinkRefundEntry {
    id: string;
    amount: number;
    timestamp?: string;
}

/**
 * See https://www.twikey.com/api/#refund-paymentlink
 *
 * The acknowledgement returned by `PaylinkService.refund()`. Verified against the beta
 * API: the response is a bare object with no `Entries`/`Links` envelope, and it echoes
 * the request rather than describing the created transfer.
 *
 * Attributes:
 *   id - The **payment link** id that was refunded, not a refund or transfer id.
 *     Passing it to `client.refund.detail()` fails with `err_no_transaction`. To get
 *     the refund's own id, call `PaylinkService.detail(id, true)` and read `refunds`.
 *   amount - The amount that was refunded.
 *   msg - The message sent with the refund, echoed back.
 */
export interface PaylinkRefundResponse {
    id: number;
    amount: number;
    msg?: string;
}
