import {BaseService} from "./BaseService";
import {
  SubscriptionQueryRequest,
  SubscriptionRequest,
  SubscriptionUpdateRequest,
} from "../../models/SubscriptionRequest";
import {SubscriptionResponse} from "../../models/SubscriptionResponse";

export class SubscriptionService extends BaseService {

  async create(request: SubscriptionRequest): Promise<SubscriptionResponse> {
    return this.post("/subscription", request).then(value => value.data);
  }

  async detail(mandateNumber: string, ref: string): Promise<SubscriptionResponse> {
    return this.get(`/subscription/${mandateNumber}/${ref}`, undefined, { "Content-Type": "application/json" }).then(value => value.data);
  }

  async query(params: SubscriptionQueryRequest): Promise<SubscriptionResponse[]> {
    return this.get("/subscription/query", params, { "Content-Type": "application/json" }).then(value => value.data);
  }

  async action(mandateNumber: string, ref: string, action: string): Promise<void> {
    await this.post(`/subscription/${mandateNumber}/${ref}/${action}`);
  }

  async update(mandateNumber: string, ref: string, fields: SubscriptionUpdateRequest): Promise<void> {
    // Full-replacement update — the API needs mndtId in the body.
    await this.post(`/subscription/${mandateNumber}/${ref}`, {mndtId: mandateNumber, ...fields});
  }

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

  async cancel(mandateNumber: string, ref: string): Promise<void> {
    await this.delete(`/subscription/${mandateNumber}/${ref}`);
  }
}
