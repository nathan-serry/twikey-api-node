import {BaseService} from "./BaseService";
import {CollectDetailRequest, CollectQueryRequest, CollectRequest} from "../../models/CollectRequest";
import {CollectQueryResponse, CollectResponse} from "../../models/CollectResponse";

export class CollectService extends BaseService {

  // TODO(collect): finish the batch-send rework before relying on this service.
  // `/collect` is Twikey's batch-collection executor (anchor #execute-collection;
  // Python: transaction.batch_send), NOT a transaction-create endpoint. Outstanding:
  //   1. collect(): send { ct, colltndt? } and return the batch id. CollectRequest /
  //      CollectResponse are still transaction-create shapes, so the endpoint rejects
  //      them and the live test stays skipped until they're reshaped.
  //   2. detail()/query(): no Python equivalent (Python uses /transaction/detail and
  //      /transaction/query) — either drop them or repoint at the transaction routes.
  //   3. Optional: batch_import via POST /collect/import?ct= (pain008 XML).
  //   4. Verify live — needs a creditor configured for batch execution.
  // See the Collect review flag in CLAUDE.md.
  /**
   * See https://www.twikey.com/api/#execute-collection
   *
   * Execute a batch collection via a POST request to the API.
   *
   * @param request - The collection fields to send.
   * @returns The executed collection.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async collect(request: CollectRequest): Promise<CollectResponse> {
    return this.post("/collect", request).then(value => value.data);
  }

  /**
   * Fetch a single collection's details.
   *
   * @param params - Parameters identifying the collection to fetch.
   * @returns The collection details.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async detail(params: CollectDetailRequest): Promise<CollectResponse> {
    return this.get("/collect", params).then(value => value.data);
  }

  /**
   * Query/list collections.
   *
   * @param params - Query parameters.
   * @returns Matching collections.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async query(params: CollectQueryRequest): Promise<CollectResponse[]> {
    // The API wraps the matches in a { collections: [...] } envelope; unwrap to the list.
    return this.get("/collect/query", params).then(value => (value.data as CollectQueryResponse)?.collections ?? []);
  }
}
