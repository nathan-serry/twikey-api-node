import {BaseService} from "./BaseService";
import {TwikeyError} from "../HttpClient";
import {
  TransactionActionRequest,
  TransactionQueryRequest,
  TransactionRefundRequest,
  TransactionRemoveRequest,
  TransactionRequest,
  TransactionUpdateRequest,
} from "../../models/TransactionRequest";
import {
  Transaction,
  TransactionBulkEntry,
  TransactionBulkResult,
  TransactionResponse,
} from "../../models/TransactionResponse";
import {RefundResponse} from "../../models/RefundResponse";
import {FeedOptions} from "../../models/Shared";

export class TransactionService extends BaseService {
  /**
   * See https://www.twikey.com/api/#new-transaction
   *
   * Create a new transaction via a POST request to the API.
   *
   * @param request - The transaction fields to send.
   * @returns The created transaction.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async create(request: TransactionRequest): Promise<Transaction> {
    return this.post("/transaction", request).then(value => value.data.Entries[0]);
  }

  /**
   * Create a transaction as a reservation rather than an immediate collection.
   *
   * @param request - The transaction fields to send.
   * @returns The created (reserved) transaction.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async authorise(request: TransactionRequest): Promise<Transaction> {
    return this.post("/transaction", { ...request, reservation: true }).then(value => value.data?.Entries?.[0] ?? value.data);
  }

  /**
   * Capture a previously reserved transaction.
   *
   * @param request - The transaction fields to send, plus the `id` of the
   *   reservation to capture.
   * @returns The captured transaction.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async capture(request: TransactionRequest & { id: string }): Promise<Transaction> {
    const { id, ...body } = request;
    return this.post("/transaction", body, { "X-Reservation": id }).then(value => value.data?.Entries?.[0] ?? value.data);
  }

  /**
   * See https://www.twikey.com/api/#action-on-transaction
   *
   * Trigger a specific action on an existing transaction.
   *
   * @param request - The action request with transaction ID/reference and action.
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async action(request: TransactionActionRequest): Promise<void> {
    await this.post("/transaction/action", request);
  }

  /**
   * See https://www.twikey.com/api/#refund-a-transaction
   *
   * Creates a refund for a given transaction via a POST request to the API. If
   * the beneficiary account does not exist yet, it will be registered to the
   * customer using the mandate IBAN or the one provided.
   *
   * @param request - Must include `id`, `message`, and `amount`. May include `ref`.
   * @returns The created refund (parsed from the API's `Entries[0]`), including its
   *   `id` — pass it to `client.refund.detail`/`remove` to follow up on the transfer.
   * @throws {TwikeyError} If the request fails or the API returns an error.
   */
  async refund(request: TransactionRefundRequest): Promise<RefundResponse> {
    return this.post("/transaction/refund", request).then(value => value.data?.Entries?.[0] ?? value.data);
  }

  /**
   * See https://www.twikey.com/api/#remove-a-transaction
   *
   * Sends a DELETE request to remove a transaction that has not yet been sent
   * to the bank on the Twikey API.
   *
   * @param request - Identifies the transaction via `id` or `ref` (at least
   *   one is required).
   * @returns Nothing.
   * @throws {TwikeyError} If the request fails or the response contains an
   *   API error code.
   */
  async remove(request: TransactionRemoveRequest): Promise<void> {
    if (!request.id && !request.ref) throw new Error("id or ref is required");
    const params = request.id ? { id: request.id } : { ref: request.ref };
    await this.httpDelete("/transaction", params);
  }

  /**
   * See https://www.twikey.com/api/#query-transactions
   *
   * Retrieve all created transactions starting from a specific transaction ID.
   *
   * @param request - Query parameters; must include `fromId`.
   * @returns A structured response object representing the server's reply.
   * @throws {TwikeyError} If the request fails or the API returns an error.
   */
  async query(request: TransactionQueryRequest): Promise<TransactionResponse> {
    if (!request.fromId) throw new Error("fromId is required");
    return this.get("/transaction/query", request, { "Content-Type": "application/json" }).then(value => value.data);
  }

  /**
   * Create multiple transactions in a single batch.
   *
   * @param entries - The transactions to create.
   * @returns The created batch.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async bulkCreate(entries: TransactionRequest[]): Promise<TransactionBulkResult> {
    return this.post("/transaction/bulk", entries, { "Content-Type": "application/json" }).then(value => value.data);
  }

  /**
   * Fetch the status of every transaction in a batch created via `bulkCreate()`.
   *
   * @param batchId - Identifier of the batch.
   * @returns The batch's transaction entries, or null while the batch is still being
   *   processed. Poll until it returns a list.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async bulkStatus(batchId: string): Promise<TransactionBulkEntry[] | null> {
    try {
      return await this.get("/transaction/bulk", { batchId }, { "Content-Type": "application/json" })
        .then(value => value.data);
    } catch (e) {
      // 409 means the batch has not finished processing yet — an expected state, not a
      // failure. Matches how Python's `invoice.bulk_details` handles the same status.
      if (e instanceof TwikeyError && e.statusCode === 409) return null;
      throw e;
    }
  }

  /**
   * See https://www.twikey.com/api/#transaction-status
   *
   * Retrieves transaction status by ID.
   *
   * @param id - The transaction ID to fetch.
   * @returns A structured response object representing the server's reply.
   * @throws {TwikeyError} If the API call fails or the identifier is invalid.
   */
  async detail(id: string): Promise<TransactionResponse> {
    return this.get(`/transaction/detail`, { id }).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#transaction-feed
   *
   * Fetches the latest transaction feed including new, updated, or cancelled
   * transactions.
   *
   * This method retrieves events from Twikey since the last sync. It's
   * typically used to synchronize your CRM or ERP system with the current
   * state on the Twikey platform. Can be triggered periodically or via
   * webhook. Unlike Python's callback-based `TransactionFeed` handler, this
   * returns an async generator you iterate with `for await`.
   *
   * @param options - Feed options: `includes` to request extra fields, and
   *   `start_position` to resume from a previous `last_position`. (optional)
   * @returns An async generator yielding one `Transaction` per event.
   * @throws {TwikeyError} If the request to the feed endpoint fails.
   */
  async *feed(options?: FeedOptions): AsyncGenerator<Transaction> {

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
      const response = await this.get("/transaction", formData, _headers);
      if (!response.data.Entries.length) {
        isEmpty = true;
      } else {
        options.last_position = response.headers['x-last'];
        for (const transaction of response.data.Entries) {
          yield transaction;
        }
      }
    }
  }

  /**
   * See https://www.twikey.com/api/#update-transaction
   *
   * Update existing transaction details.
   *
   * This endpoint allows modifying transaction information such as message or
   * linked references. Only provide parameters for fields you wish to update.
   *
   * @param transactionId - The unique ID of the transaction to update.
   * @param update - The fields to update.
   * @returns The HTTP status code (204 on success) and any response body.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async update(transactionId: string, update: TransactionUpdateRequest): Promise<{ statusCode?: number; data: any }> {
    const res = await this.put("/transaction", { id: transactionId, ...update });
    return { statusCode: res.statusCode, data: res.data };
  }
}
