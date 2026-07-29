import {BaseService} from "./BaseService";
import {TwikeyError} from "../HttpClient";
import {
  InvoiceActionRequest,
  InvoiceCreateRequest,
  InvoiceDetailOptions,
  InvoiceRequest,
  InvoiceUpdateRequest,
  UblUploadOptions,
} from "../../models/InvoiceRequest";
import {
  InvoiceBulkEntry,
  InvoiceBulkResult,
  InvoiceQrResponse,
  InvoiceResponse,
  PaymentResponse,
} from "../../models/InvoiceResponse";
import {FeedOptions, PdfResponse} from "../../models/Shared";


export class InvoiceService extends BaseService {
  /**
   * See https://www.twikey.com/api/#create-invoice
   *
   * Create a new invoice via a POST request to the API.
   *
   * @param request - The invoice fields, plus the optional `origin`, `purpose`
   *   and `forceTransaction` switches. Each is only sent when you set it; leaving
   *   one out means the header is absent rather than sent as `false`.
   * @returns The created invoice.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async create(request: InvoiceCreateRequest): Promise<InvoiceResponse> {
    // origin/purpose/forceTransaction are headers, so keep them out of the JSON body.
    const { origin, purpose, forceTransaction, ...invoice } = request;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (origin) headers["X-PARTNER"] = origin;
    if (purpose) headers["X-Purpose"] = purpose;
    if (invoice.manual) headers["X-MANUAL"] = "true";
    if (forceTransaction) headers["X-FORCE-TRANSACTION"] = "true";

    return this.post("/invoice", invoice, headers).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#invoice-details
   *
   * Retrieves the details of a specific invoice by ID.
   *
   * @param invoiceId - The unique invoice ID or invoice number.
   * @param options - Extra information to include in the response; each enabled
   *   flag adds one `include=` query parameter. (optional)
   * @returns The invoice details.
   * @throws {TwikeyError} If the API call fails or the identifier is invalid.
   */
  async detail(invoiceId: string, options?: InvoiceDetailOptions): Promise<InvoiceResponse> {
    // URLSearchParams, not a plain object: `include` is repeated once per value.
    const includes = new URLSearchParams();
    if (options?.lastpayment) includes.append("include", "lastpayment");
    if (options?.meta) includes.append("include", "meta");
    if (options?.customer) includes.append("include", "customer");
    return this.get(`/invoice/${encodeURIComponent(invoiceId)}`, includes).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#invoice-feed
   *
   * Fetches the latest invoice feed including new, updated, or cancelled invoices.
   *
   * This method retrieves events from Twikey since the last sync. It's
   * typically used to synchronize your CRM or ERP system with the current
   * state on the Twikey platform. Can be triggered periodically or via
   * webhook. This returns an async generator, so iterate it with `for await`.
   *
   * @param options - Feed options: `includes` to request extra fields, and
   *   `start_position` to resume from a previous `last_position`. (optional)
   * @returns An async generator yielding one `InvoiceResponse` per event.
   * @throws {TwikeyError} If the request to the feed endpoint fails.
   */
  async *feed(options?: FeedOptions): AsyncGenerator<InvoiceResponse> {

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
      const response = await this.get("/invoice", formData, _headers);
      if (!response.data.Invoices.length) {
        isEmpty = true;
      } else {
        options.last_position = response.headers['x-last'];
        for (const invoice of response.data.Invoices) {
          yield invoice;
        }
      }
    }
  }

  /**
   * See https://www.twikey.com/api/#payment-feed
   *
   * Fetches the latest payment updates.
   *
   * This method retrieves events from Twikey since the last sync. This returns
   * an async generator, so iterate it with `for await`.
   *
   * @param options - Feed options: `includes` to request extra fields, and
   *   `start_position` to resume from a previous `last_position`. (optional)
   * @returns An async generator yielding one `PaymentResponse` per event.
   * @throws {TwikeyError} If the request to the feed endpoint fails.
   */
  async* payment(options?: FeedOptions): AsyncGenerator<PaymentResponse> {

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
      options = {}
    }

    let isEmpty = false;
    while (!isEmpty) {
      const response = await this.get("/invoice/payment/feed", formData, _headers);
      if (!response.data.Payments.length) {
        isEmpty = true;
      } else {
        options.last_position = response.headers['x-last'];
        for (const payment of response.data.Payments) {
          yield payment;
        }
      }
    }
  }

  /**
   * See https://www.twikey.com/api/#update-invoice
   *
   * Send a PUT request to update existing invoice details.
   *
   * @param invoiceId - The unique identifier of the invoice to update.
   * @param update - The invoice fields to change.
   * @returns The updated invoice.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async update(invoiceId: string, update: InvoiceUpdateRequest): Promise<InvoiceResponse> {
    return this.put(`/invoice/${encodeURIComponent(invoiceId)}`, { id: invoiceId, ...update }, { "Content-Type": "application/json" })
      .then(value => value.data);
  }

  /**
   * Reoffer an invoice via a PATCH request to the API.
   *
   * Re-submits the invoice's underlying transaction to the bank for
   * collection. This is a dedicated endpoint, separate from `action()`'s
   * `'reoffer'` action type, and takes no fields beyond the invoice ID.
   *
   * @param invoiceId - The unique identifier of the invoice to reoffer.
   * @returns Nothing. The API answers with no body on success.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async reoffer(invoiceId: string): Promise<void> {
    await this.patch(`/invoice/${encodeURIComponent(invoiceId)}/reoffer`);
  }

  /**
   * Fetch a QR code for paying an invoice.
   *
   * Returns the invoice's payment URL together with a scannable QR code
   * representation of that URL, when the API includes one in the response.
   *
   * @param invoiceId - The unique identifier of the invoice.
   * @returns The payment `url`, plus the `qr` code itself when the API returns one.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async qr(invoiceId: string): Promise<InvoiceQrResponse> {
    return this.get(`/invoice/${encodeURIComponent(invoiceId)}/qr`, undefined, { "Content-Type": "application/json" }).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#action-an-invoice
   *
   * Trigger a specific action on an existing invoice.
   *
   * @param invoiceId - The unique identifier of the invoice.
   * @param request - The action to perform. Which extra fields apply depends on
   *   `type`; only the ones you set are sent.
   * @returns Nothing. The API answers 204 on success.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async action(invoiceId: string, request: InvoiceActionRequest): Promise<void> {
    // Form-encoded body, matching the API docs for this endpoint.
    // FetchClient turns the object into URLSearchParams for this content type,
    // so every value is escaped and undefined fields are dropped.
    await this.post(`/invoice/${encodeURIComponent(invoiceId)}/action`, request, {
      "Content-Type": "application/x-www-form-urlencoded",
    });
  }

  // the rename from delete -> httpdelete neccesary to keep api.twikey.com correspondance
  /**
   * See https://www.twikey.com/api/#delete-invoice
   *
   * Sends a DELETE request to delete an invoice on the Twikey API.
   *
   * This method allows the creditor to cancel/delete a resource by providing the
   * unique ID. Typically used to delete/cancel an object like an agreement, an
   * invoice, or a payment link.
   *
   * @param invoiceId - The unique identifier of the invoice to delete.
   * @returns Nothing.
   * @throws {TwikeyError} If the request fails or the response contains an API
   *   error code.
   */
  async delete(invoiceId: string): Promise<void> {
    await this.httpDelete(`/invoice/${encodeURIComponent(invoiceId)}`);
  }

  /**
   * See https://www.twikey.com/api/#upload-ubl
   *
   * Add a new invoice via a UBL file during a POST request to the API.
   *
   * @param xmlBody - The UBL invoice as a raw XML string or buffer.
   * @param options - Optional headers: `manual` (`X-MANUAL`) and `invoiceId`
   *   (`X-INVOICE-ID`). Only the ones you set are sent.
   * @returns The created invoice.
   * @throws {TwikeyError} If the request fails or the response is invalid.
   */
  async ubl(xmlBody: string | Buffer, options?: UblUploadOptions): Promise<InvoiceResponse> {
    const headers: Record<string, string> = { "Content-Type": "application/xml" };
    if (options?.manual) headers["X-MANUAL"] = "true";
    if (options?.invoiceId) headers["X-INVOICE-ID"] = options.invoiceId;
    if (options?.template) headers["X-TEMPLATE"] = options.template;
    if (options?.contract) headers["X-CONTRACT"] = options.contract;
    if (options?.campaign) headers["X-CAMPAIGN"] = options.campaign;
    if (options?.origin) headers["X-PARTNER"] = options.origin;
    // One header per attribute; the key is appended to the prefix as-is.
    for (const [key, value] of Object.entries(options?.attributes ?? {})) {
      if (value !== undefined && value !== null) headers[`X-ATTR-${key}`] = String(value);
    }
    return this.post("/invoice/ubl", xmlBody, headers).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#bulk-create
   *
   * Creates multiple invoices in a single batch upload.
   *
   * @param invoices - The invoices to create.
   * @returns The created batch.
   * @throws {TwikeyError} If the bulk creation fails or the server returns an error.
   */
  async bulkCreate(invoices: InvoiceRequest[]): Promise<InvoiceBulkResult> {
    return this.post("/invoice/bulk", invoices, { "Content-Type": "application/json" }).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#bulk-batch-details
   *
   * Retrieves the result of a bulk invoice upload by batch ID.
   *
   * @param batchId - The batch ID.
   * @returns The batch's invoice statuses, or null while the batch is still being
   *   processed. Poll until it returns a list.
   * @throws {TwikeyError} If the request fails or returns an unexpected status.
   */
  async bulkStatus(batchId: string): Promise<InvoiceBulkEntry[] | null> {
    try {
      return await this.get("/invoice/bulk", { batchId }, { "Content-Type": "application/json" })
        .then(value => value.data);
    } catch (e) {
      // 409 means the batch has not finished processing yet — an expected state, not a
      // failure.
      if (e instanceof TwikeyError && e.statusCode === 409) return null;
      throw e;
    }
  }

  /**
   * See https://www.twikey.com/api/#retrieve-invoice-pdf
   *
   * Fetch the PDF of an invoice.
   *
   * Downloads the invoice document as binary PDF content rather than the JSON
   * used by the rest of this service, requesting it with an `Accept:
   * application/pdf` header and reading the response as raw bytes.
   *
   * @param invoiceId - The unique identifier of the invoice.
   * @returns A structured response object containing the PDF content as a
   *   `Buffer`, plus a filename derived from the invoice ID.
   * @throws {TwikeyError} If the request fails or the response is invalid.
   */
  async pdf(invoiceId: string): Promise<PdfResponse> {
    const response = await this.client.get(`/invoice/${invoiceId}/pdf`, {
      headers: { 'Accept': 'application/pdf' },
      responseType: 'arraybuffer'
    });
    return {
      content: Buffer.from(response.data),
      filename: `${invoiceId}.pdf`
    };
  }
}
