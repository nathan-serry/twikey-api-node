/**
 * The reply from creating (`create()`) or fetching (`detail()`) a payment link.
 *
 * Mirrors Python's `CreatedPaylinkResponse` and `Paylink`
 * (`twikey/model/paylink_response.py`) — Node uses one shared shape where
 * Python has two separate classes. Python's `Paylink` additionally carries
 * `ct`, and nested `customer`/`meta`/`time` objects (populated when fetched
 * with `include=meta`) that this type doesn't expose.
 *
 * Attributes:
 *   id - Payment link ID.
 *   url - URL of the payment link. Only present on the `create()` response.
 *   msg - Message shown to the customer.
 *   amount - Amount to be paid.
 *   ref - Reference of the payment link.
 *   state - State of the payment link. Only present when fetched via `detail()`.
 *   refunds - Refunds recorded against the link. Present only when fetched
 *     with `detail(id, true)` (`include=refunds`).
 */
export interface PaylinkResponse {
    id: number;
    url: string;
    msg: string;
    amount: number;
    ref: string;
    state?: string;
    refunds?: PaylinkRefundEntry[];
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
