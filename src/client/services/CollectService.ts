import {BaseService} from "./BaseService";
import {CollectDetailRequest, CollectQueryRequest, CollectRequest} from "../../models/CollectRequest";
import {CollectResponse} from "../../models/CollectResponse";

export class CollectService extends BaseService {

  async collect(request: CollectRequest): Promise<CollectResponse> {
    return this.post("/collect", request).then(value => value.data);
  }

  async detail(params: CollectDetailRequest): Promise<CollectResponse> {
    return this.get("/collect", params).then(value => value.data);
  }

  async query(params: CollectQueryRequest): Promise<CollectResponse[]> {
    return this.get("/collect/query", params).then(value => value.data);
  }
}
