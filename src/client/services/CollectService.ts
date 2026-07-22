import {BaseService} from "./BaseService";
import {CollectDetailRequest, CollectQueryRequest, CollectRequest} from "../../models/CollectRequest";
import {CollectResponse} from "../../models/CollectResponse";

export class CollectService extends BaseService {

  async collect(request: CollectRequest): Promise<CollectResponse> {
    const {ct, ...body} = request;
    return this.post("/transaction", body).then(value => {
      const entry = value.data?.Entries?.[0] ?? value.data;
      return {id: entry.id, state: entry.status, amount: entry.amount, ref: entry.ref};
    });
  }

  async detail(params: CollectDetailRequest): Promise<CollectResponse> {
    return this.get("/transaction/detail", params).then(value => {
      const entry = value.data?.Entries?.[0] ?? value.data;
      return {id: entry.id, state: entry.status, amount: entry.amount, ref: entry.ref};
    });
  }

  async query(params: CollectQueryRequest): Promise<CollectResponse[]> {
    return this.get("/collect/query", params).then(value => value.data);
  }
}
