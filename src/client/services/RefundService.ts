import {BaseService} from "./BaseService";
import {BeneficiaryRequest, RefundBatchRequest, RefundBatchStatusRequest, RefundRequest} from "../../models/RefundRequest";
import {BeneficiaryResponse, RefundBatchResponse, RefundResponse} from "../../models/RefundResponse";
import {FeedOptions} from "../../models/Shared";

export class RefundService extends BaseService {

  // ---------------------------------------------------------------------------
  // Beneficiary accounts
  // ---------------------------------------------------------------------------

  /**
   * See https://www.twikey.com/api/#add-a-beneficiary-account
   *
   * Create a new beneficiary account via a POST request to the API.
   *
   * A beneficiary account is the destination account a refund/credit transfer
   * is paid out to. It must exist and be active before a refund can target it.
   *
   * @param request - The beneficiary details to register (name, iban, address…).
   * @returns The created beneficiary account.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async addBeneficiary(request: BeneficiaryRequest): Promise<BeneficiaryResponse> {
    return this.post("/transfers/beneficiaries", request).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#get-beneficiary-accounts
   *
   * Retrieve all beneficiary accounts.
   *
   * @returns A list of the registered beneficiary accounts.
   * @throws {TwikeyError} If the API call fails.
   */
  async getBeneficiaries(): Promise<BeneficiaryResponse[]> {
    // The API wraps the list in { beneficiaries: [...] }; fall back to a bare array or
    // an empty list so a shape change never yields `undefined` typed as an array.
    return this.get("/transfers/beneficiaries").then(value => value.data?.beneficiaries ?? value.data ?? []);
  }

  /**
   * See https://www.twikey.com/api/#disable-a-beneficiary-account
   *
   * Sends a DELETE request to disable a beneficiary account on the Twikey API.
   *
   * @param iban - The IBAN of the beneficiary account to disable.
   * @param customerNumber - The customer number the beneficiary belongs to.
   *   (optional)
   * @returns Nothing.
   * @throws {TwikeyError} If the request fails or the response contains an API
   *   error code.
   */
  async disableBeneficiary(iban: string, customerNumber?: string): Promise<void> {
    await this.httpDelete(`/transfers/beneficiaries/${iban}`, customerNumber ? { customerNumber } : undefined);
  }

  // ---------------------------------------------------------------------------
  // Credit transfers (refunds)
  // ---------------------------------------------------------------------------

  /**
   * See https://www.twikey.com/api/#createadd-a-new-credit-transfer
   *
   * Create a new credit transfer (refund) via a POST request to the API.
   *
   * If the beneficiary account does not exist yet, it will be registered to the
   * customer using the mandate IBAN or the one provided.
   *
   * @param request - The refund details (amount, message, iban, customerNumber…).
   * @returns The created refund (parsed from the API's `Entries[0]`), including its `id`.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async addRefund(request: RefundRequest): Promise<RefundResponse> {
    return this.post("/transfer", request).then(value => value.data.Entries?.[0] ?? value.data);
  }

  /**
   * See https://www.twikey.com/api/#details-of-a-credit-transfer
   *
   * Retrieves the details/status of a credit transfer (refund) by ID.
   *
   * @param refundId - The unique identifier of the refund to retrieve.
   * @returns The refund entry matching the identifier.
   * @throws {TwikeyError} If the API call fails or the identifier is invalid.
   */
  async detail(refundId: string | number): Promise<RefundResponse> {
    return this.get("/transfer/detail", { id: refundId }, { "Content-Type": "application/json" })
      .then(value => value.data.Entries?.[0] ?? value.data);
  }

  /**
   * See https://www.twikey.com/api/#remove-a-credit-transfer
   *
   * Sends a DELETE request to remove a refund that has not yet been sent to the
   * bank on the Twikey API.
   *
   * @param refundId - The unique identifier of the refund to remove.
   * @returns Nothing.
   * @throws {TwikeyError} If the request fails or the response contains an API
   *   error code.
   */
  async remove(refundId: string | number): Promise<void> {
    await this.httpDelete("/transfer", { id: refundId });
  }

  /**
   * See https://www.twikey.com/api/#get-credit-transfer-feed
   *
   * Fetches the latest refund feed including new, updated, or cancelled refunds.
   *
   * This method retrieves events from Twikey since the last sync. It's typically
   * used to synchronize your CRM or ERP system with the current state on the
   * Twikey platform. Can be triggered periodically or via webhook. Unlike
   * Python's callback-based `RefundFeed` handler, this returns an async generator
   * you iterate with `for await`.
   *
   * @param options - Feed options: `includes` to request extra fields, and
   *   `start_position` to resume from a previous `last_position`. (optional)
   * @returns An async generator yielding one `RefundResponse` per event; the
   *   feed is exhausted once no more entries are pending.
   * @throws {TwikeyError} If the request to the feed endpoint fails.
   */
  async *feed(options?: FeedOptions): AsyncGenerator<RefundResponse> {

    const formData = new URLSearchParams();
    let _headers: any = {};
    if (options) {
      if (options.start_position)
        _headers['X-RESUME-AFTER'] = options.start_position;
      if (options.includes) {
        for (const include of options.includes) {
          formData.append("include", include);
        }
      }
    } else {
      options = {};
    }

    let isEmpty = false;
    while (!isEmpty) {
      const response = await this.get("/transfer", formData, _headers);
      const entries = response.data.Entries;
      if (!entries || !entries.length) {
        isEmpty = true;
      } else {
        options.last_position = response.headers['x-last'];
        for (const refund of entries) {
          yield refund;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Refund batches
  // ---------------------------------------------------------------------------

  /**
   * See https://www.twikey.com/api/#batch-creation
   *
   * Execute the pending refunds as a batch of SEPA credit transfers via a POST
   * request to the API.
   *
   * @param request - The batch parameters (contract template `ct`, optional
   *   originating `iban`).
   * @returns The executed credit-transfer batches; the API wraps them in a
   *   `{CreditTransfers:[…]}` envelope which this method unwraps.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async collectRefund(request: RefundBatchRequest): Promise<RefundBatchResponse[]> {
    return this.post("/transfer/complete", request).then(value => value.data?.CreditTransfers ?? value.data);
  }

  /**
   * See https://www.twikey.com/api/#batch-details
   *
   * Retrieves the status of a refund batch.
   *
   * @param request - The batch identifier (`id`, and optional `pmtinfid`), e.g. from a
   *   `collectRefund` result. (This is not `ct`/`iban` — that shape creates a batch.)
   * @returns The batch entry; the API wraps it in a `{CreditTransfers:[…]}`
   *   envelope which this method unwraps to the first entry.
   * @throws {TwikeyError} If the API call fails or the identifier is invalid.
   */
  async batchDetail(request: RefundBatchStatusRequest): Promise<RefundBatchResponse> {
    return this.get("/transfer/complete", { ...request })
      .then(value => value.data?.CreditTransfers?.[0] ?? value.data);
  }
}
