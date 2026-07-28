import {BaseService} from "./BaseService";
import {CollectDetailRequest, CollectQueryRequest, CollectRequest} from "../../models/CollectRequest";
import {CollectBatchResponse, CollectQueryResponse, CollectResponse} from "../../models/CollectResponse";

export class CollectService extends BaseService {

  /**
   * See https://www.twikey.com/api/#execute-collection
   *
   * Execute a collection for a contract template via a POST request to the API.
   *
   * This sends the transactions that are already open on the given contract template
   * to the bank as a batch. It is not a transaction-create call; add transactions with
   * `TransactionService.create()` first.
   *
   * @param request - Must include `ct`. `colltndt` picks the collection date (default
   *   is the earliest batch); `prenotify` and `until` are optional.
   * @returns The identifiers of the created batches. `rcurMsgId` is the `pmtinfid` of
   *   the recurring batch, or null when there was nothing to send.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async collect(request: CollectRequest): Promise<CollectBatchResponse> {
    return this.post("/collect", request).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#status-collection
   *
   * Fetch the details of a collection batch.
   *
   * @param params - Identifies the batch by either `id` or `pmtinfid`; exactly one is
   *   required.
   * @returns The batches matching the identifier, unwrapped from the API's `Sdds`
   *   envelope.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async detail(params: CollectDetailRequest): Promise<CollectResponse[]> {
    return this.get("/collect", params).then(value => value.data?.Sdds ?? []);
  }

  /**
   * See https://www.twikey.com/api/#query-collections
   *
   * Query/list collection batches.
   *
   * @param params - Query parameters; every field is an optional filter.
   * @returns Matching batches, unwrapped from the API's `collections` envelope.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async query(params: CollectQueryRequest): Promise<CollectResponse[]> {
    // The API wraps the matches in a { collections: [...] } envelope; unwrap to the list.
    return this.get("/collect/query", params).then(value => (value.data as CollectQueryResponse)?.collections ?? []);
  }

  /**
   * See https://www.twikey.com/api/#import-collection
   *
   * Import a batch of collections from a pain008 file via a POST request to the API.
   *
   * @param ct - Contract template to import the collections for; sent as a query
   *   parameter.
   * @param pain008Xml - The pain008 document, as an XML string or buffer. Unlike
   *   Python's `batch_import`, which takes a path and opens the file, this takes the
   *   content itself.
   * @returns The identifiers of the created batches.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async batchImport(ct: number, pain008Xml: string | Buffer): Promise<CollectBatchResponse> {
    return this.post(`/collect/import?ct=${ct}`, pain008Xml, { "Content-Type": "text/xml" })
      .then(value => value.data);
  }
}
