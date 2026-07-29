import {BaseService} from "./BaseService";
import {
  SubscriptionQueryRequest,
  SubscriptionRequest,
  SubscriptionUpdateRequest,
} from "../../models/SubscriptionRequest";
import {SubscriptionQueryResponse, SubscriptionResponse} from "../../models/SubscriptionResponse";

export class SubscriptionService extends BaseService {

  /**
   * See https://www.twikey.com/api/#add-a-subscription
   *
   * Create a new subscription (a recurring transaction schedule) on a mandate.
   *
   * @param request - The subscription fields to send.
   * @returns The created subscription.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async create(request: SubscriptionRequest): Promise<SubscriptionResponse> {
    return this.post("/subscription", request).then(value => value.data);
  }

  /**
   * Fetch a single subscription's details by mandate and reference.
   *
   * Returns the same shape as `create()`: `id`, `mndtId`, `ref`, `state`, `amount`,
   * `message`, `recurrence`, `start`, `last`, `next`, `plan`, `runs` and `stopAfter`.
   * `next` is absent once there is no next scheduled run, such as on a cancelled
   * subscription; `last` and `ref` are always present but may be null.
   *
   * @param mandateNumber - The mandate reference the subscription belongs to.
   * @param ref - The subscription's reference.
   * @returns The subscription details.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async detail(mandateNumber: string, ref: string): Promise<SubscriptionResponse> {
    return this.get(`/subscription/${mandateNumber}/${ref}`, undefined, { "Content-Type": "application/json" }).then(value => value.data);
  }

  /**
   * Query/list subscriptions.
   *
   * Returns every subscription matching the given filters, unwrapped from the API's
   * `{ Subscriptions: [...] }` envelope into a plain array. Each entry has the same
   * fields as `create()`'s return value.
   *
   * @param params - Query parameters.
   * @returns Matching subscriptions.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async query(params: SubscriptionQueryRequest): Promise<SubscriptionResponse[]> {
    // The API wraps the matches in a { Subscriptions: [...] } envelope; unwrap to the list.
    return this.get("/subscription/query", params, { "Content-Type": "application/json" })
      .then(value => (value.data as SubscriptionQueryResponse)?.Subscriptions ?? []);
  }

  /**
   * Trigger a named action on a subscription.
   *
   * The action name is sent as the final path segment of the request
   * (`/subscription/{mandateNumber}/{ref}/{action}`), so which action names the API
   * accepts is determined server-side rather than by this method.
   *
   * @param mandateNumber - The mandate reference the subscription belongs to.
   * @param ref - The subscription's reference.
   * @param action - The action to trigger, sent as a path segment.
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async action(mandateNumber: string, ref: string, action: string): Promise<void> {
    await this.post(`/subscription/${mandateNumber}/${ref}/${action}`);
  }

  /**
   * See https://www.twikey.com/api/#update-a-subscription
   *
   * Replace a subscription with a new one on the same reference: the current
   * subscription is cancelled and a new one is created using the same `ref`.
   *
   * @param mandateNumber - The mandate reference the subscription belongs to.
   * @param ref - The subscription's reference (preserved across the replace).
   * @param fields - The full set of replacement fields.
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async update(mandateNumber: string, ref: string, fields: SubscriptionUpdateRequest): Promise<void> {
    // Full-replacement update — the API needs mndtId in the body.
    await this.post(`/subscription/${mandateNumber}/${ref}`, {mndtId: mandateNumber, ...fields});
  }

  /**
   * See https://www.twikey.com/api/#patch-a-subscription
   *
   * Update specific fields on a subscription without cancelling/replacing it,
   * or move it to a different mandate.
   *
   * @param mandateNumber - The mandate reference the subscription belongs to.
   * @param ref - The subscription's reference.
   * @param fields - The fields to update.
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async partialUpdate(mandateNumber: string, ref: string, fields: SubscriptionUpdateRequest): Promise<void> {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(fields)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString();
    await this.client.patch(`/subscription/${mandateNumber}/${ref}?${qs}`);
  }

  /**
   * See https://www.twikey.com/api/#cancel-a-subscription
   *
   * Cancel a subscription.
   *
   * @param mandateNumber - The mandate reference the subscription belongs to.
   * @param ref - The subscription's reference to cancel.
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async cancel(mandateNumber: string, ref: string): Promise<void> {
    await this.httpDelete(`/subscription/${mandateNumber}/${ref}`);
  }
}
