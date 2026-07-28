import {BaseService} from "./BaseService";
import {PaylinkRefundRequest, PaylinkRequest} from "../../models/PaylinkRequest";
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
   * @param includeRefunds - When true, includes the link's recorded refunds
   *   (`include=refunds`) in the response. (optional, defaults to false)
   * @returns The payment link details.
   * @throws {TwikeyError} If the API call fails or the identifier is invalid.
   */
  async detail(plId: number | string, includeRefunds = false): Promise<PaylinkResponse> {
    const params = new URLSearchParams({ id: String(plId) });
    if (includeRefunds) params.append('include', 'refunds');
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
