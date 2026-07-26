import {BaseService} from "./BaseService";
import {PaylinkRefundRequest, PaylinkRequest} from "../../models/PaylinkRequest";
import {PaylinkResponse} from "../../models/PaylinkResponse";
import {RefundResponse} from "../../models/RefundResponse";
import {FeedOptions} from "../../models/Shared";

export class PaylinkService extends BaseService {

  async create(request: PaylinkRequest): Promise<PaylinkResponse> {
    return this.post("/payment/link", request).then(value => value.data);
  }

  async detail(plId: number | string, includeRefunds = false): Promise<PaylinkResponse> {
    const path = `/payment/link?id=${plId}${includeRefunds ? '&include=refunds' : ''}`;
    return this.get(path).then(value => value.data.Links?.[0] ?? value.data);
  }

  /**
   * See https://www.twikey.com/api/#refund-paymentlink
   *
   * Creates a refund for a given (already paid) payment link via a POST request
   * to the API. If the beneficiary account does not exist yet, it will be
   * registered to the customer using the mandate IBAN or the one provided.
   *
   * @param request - Must include the payment link `id` and the `amount` to
   *   refund. May include a `message` for the beneficiary.
   * @returns The created refund, including its `id` — pass it to
   *   `client.refund.detail`/`remove` to follow up on the transfer. The envelope
   *   the API wraps it in is unwrapped here.
   * @throws {TwikeyError} If the request fails or the API returns an error
   *   (e.g. the link isn't paid, or the same refund was already requested).
   */
  async refund(request: PaylinkRefundRequest): Promise<RefundResponse> {
    return this.post("/payment/link/refund", request)
      .then(value => value.data?.Entries?.[0] ?? value.data?.Links?.[0] ?? value.data);
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
