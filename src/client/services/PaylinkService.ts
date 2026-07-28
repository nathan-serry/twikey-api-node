import {BaseService} from "./BaseService";
import {PaylinkDetailOptions, PaylinkRefundRequest, PaylinkRequest} from "../../models/PaylinkRequest";
import {PaylinkRefundResponse, PaylinkResponse} from "../../models/PaylinkResponse";
import {FeedOptions} from "../../models/Shared";

export class PaylinkService extends BaseService {

  /**
   * See https://www.twikey.com/api/#create-paymentlink
   *
   * Create a new payment link via a POST request to the API.
   *
   * @param request - The payment link fields to send.
   * @returns The created payment link.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async create(request: PaylinkRequest): Promise<PaylinkResponse> {
    return this.post("/payment/link", request).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#status-paymentlink
   *
   * Retrieves a payment link's status by ID.
   *
   * @param plId - The unique identifier of the payment link.
   * @param options - Extra information to include in the response; each enabled flag
   *   adds one `include=` query parameter. A bare `true` is accepted as shorthand for
   *   `{refunds: true}`, which is the older form of this argument. (optional)
   * @returns The payment link details.
   * @throws {TwikeyError} If the API call fails or the identifier is invalid.
   */
  async detail(plId: number | string, options?: boolean | PaylinkDetailOptions): Promise<PaylinkResponse> {
    return this.fetchLink(new URLSearchParams({ id: String(plId) }), options);
  }

  /**
   * See https://www.twikey.com/api/#status-paymentlink
   *
   * Retrieves a payment link's status by *your* reference — the `ref` you passed to
   * `create()` — rather than by Twikey's numeric id.
   *
   * The same endpoint backs both lookups; it accepts either an `id` or a `ref`
   * parameter.
   *
   * @param ref - The reference the payment link was created with.
   * @param options - Extra information to include in the response; each enabled flag
   *   adds one `include=` query parameter. (optional)
   * @returns The payment link details.
   * @throws {TwikeyError} If the API call fails or no link carries that reference.
   */
  async detailByRef(ref: string, options?: PaylinkDetailOptions): Promise<PaylinkResponse> {
    return this.fetchLink(new URLSearchParams({ ref }), options);
  }

  /**
   * Shared by `detail()` and `detailByRef()`, which differ only in how they identify
   * the link. `include` is repeated once per value, so the caller passes
   * URLSearchParams rather than a plain object.
   */
  private async fetchLink(params: URLSearchParams, options?: boolean | PaylinkDetailOptions): Promise<PaylinkResponse> {
    // A bare boolean is the pre-existing `detail(id, true)` signature, kept working.
    const includes: PaylinkDetailOptions = typeof options === 'boolean'
        ? { refunds: options }
        : options ?? {};
    if (includes.refunds) params.append('include', 'refunds');
    if (includes.meta) params.append('include', 'meta');
    return this.get(`/payment/link?${params}`).then(value => value.data.Links?.[0] ?? value.data);
  }

  /**
   * See https://www.twikey.com/api/#refund-paymentlink
   *
   * Creates a refund for a given (already paid) payment link via a POST request
   * to the API. If the beneficiary account does not exist yet, it will be
   * registered to the customer using the mandate IBAN or the one provided.
   *
   * The response is a bare acknowledgement — `{id, amount, msg}` with no
   * envelope — and its `id` is the **payment link** id, not the created
   * refund's. The refund does get an id of its own, but the API only hands it
   * back via `detail(id, true)`:
   *
   * ```ts
   * await client.paylink.refund({id: linkId, amount: 5});
   * const {refunds} = await client.paylink.detail(linkId, true);
   * const refundId = refunds?.at(-1)?.id;   // e.g. 're_EqBdFXPMFgRL429DZCXUJ'
   * ```
   *
   * @param request - Must include the payment link `id` and the `amount` to
   *   refund. May include a `message` for the beneficiary.
   * @returns The API's acknowledgement, echoing the payment link id and the
   *   refunded amount.
   * @throws {TwikeyError} If the request fails or the API returns an error
   *   (e.g. the link isn't paid, or the same refund was already requested).
   */
  async refund(request: PaylinkRefundRequest): Promise<PaylinkRefundResponse> {
    return this.post("/payment/link/refund", request).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#remove-paymentlink
   *
   * Sends a DELETE request to remove a payment link that has not yet been sent to
   * the bank on the Twikey API.
   *
   * This method allows the creditor to cancel/delete a resource by providing the
   * unique ID. Typically used to delete/cancel an object like an agreement, an
   * invoice, or a payment link.
   *
   * @param linkId - The unique identifier of the payment link to remove.
   * @returns Nothing.
   * @throws {TwikeyError} If the request fails or the response contains an API
   *   error code.
   */
  async remove(linkId: number | string): Promise<void> {
    await this.httpDelete("/payment/link", { id: linkId });
  }

  /**
   * See https://www.twikey.com/api/#paymentlink-feed
   *
   * Fetches the latest paylink feed including new, updated, or cancelled
   * payment links.
   *
   * This method retrieves events from Twikey since the last sync. It's
   * typically used to synchronize your CRM or ERP system with the current
   * state on the Twikey platform. Can be triggered periodically or via
   * webhook. Unlike Python's callback-based `PaylinkFeed` handler, this
   * returns an async generator you iterate with `for await`.
   *
   * @param options - Feed options: `includes` to request extra fields, and
   *   `start_position` to resume from a previous `last_position`. (optional)
   * @returns An async generator yielding one `PaylinkResponse` per event.
   * @throws {TwikeyError} If the request to the feed endpoint fails.
   */
  async *feed(options?: FeedOptions): AsyncGenerator<PaylinkResponse> {

    const formData = new URLSearchParams();
    let _headers:any = {};
    if(options){
      if(options.start_position)
        _headers['X-RESUME-AFTER'] = options.start_position;
      if(options.includes){
        for (const include of options.includes) {
          formData.append("include", include);
        }
      }
    }
    else {
      options = {}
    }

    let isEmpty = false;
    while (!isEmpty) {
      const response = await this.get("/payment/link/feed", formData, _headers);
      if (!response.data.Links.length) {
        isEmpty = true;
      } else {
        options.last_position = response.headers['x-last'];
        for (const link of response.data.Links) {
          yield link;
        }
      }
    }
  }
}
