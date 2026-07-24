import {BaseService} from "./BaseService";
import {CollectDetailRequest, CollectQueryRequest, CollectRequest} from "../../models/CollectRequest";
import {CollectQueryResponse, CollectResponse} from "../../models/CollectResponse";

export class CollectService extends BaseService {

  // TODO(collect): `/collect` is Twikey's batch-collection executor — POST /collect
  // with { ct, colltndt? } returns a batch identifier (see twikey-api-python
  // transaction.batch_send, api.twikey.com anchor #execute-collection). It is NOT a
  // synonym for /transaction: an earlier "test fixes" commit repointed these calls at
  // /transaction to make a test pass, which turned collect() into a duplicate of
  // TransactionService.create(). Reverted here to /collect; the proper batch-send rework
  // (new request/response shapes, decide detail()/query(), live verification) is deferred
  // to the next push — see the Collect review flag in CLAUDE.md.
  async collect(request: CollectRequest): Promise<CollectResponse> {
    return this.post("/collect", request).then(value => value.data);
  }

  async detail(params: CollectDetailRequest): Promise<CollectResponse> {
    return this.get("/collect", params).then(value => value.data);
  }

  async query(params: CollectQueryRequest): Promise<CollectResponse[]> {
    // The API wraps the matches in a { collections: [...] } envelope; unwrap to the list.
    return this.get("/collect/query", params).then(value => (value.data as CollectQueryResponse)?.collections ?? []);
  }
}
