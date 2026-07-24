import {BaseService} from "./BaseService";
import {InvoiceActionRequest, InvoiceRequest, InvoiceUpdateRequest} from "../../models/InvoiceRequest";
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
   * @param request - The invoice fields to send.
   * @returns The created invoice.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async create(request: InvoiceRequest): Promise<InvoiceResponse> {
    return this.post("/invoice", request, { "Content-Type": "application/json" }).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#invoice-details
   *
   * Retrieves the details of a specific invoice by ID.
   *
   * @param invoiceId - The unique invoice ID or invoice number.
   * @returns The invoice details.
   * @throws {TwikeyError} If the API call fails or the identifier is invalid.
   */
  async detail(invoiceId: string): Promise<InvoiceResponse> {
    return this.get(`/invoice/${invoiceId}`).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#invoice-feed
   *
   * Fetches the latest invoice feed including new, updated, or cancelled invoices.
   *
   * This method retrieves events from Twikey since the last sync. It's
   * typically used to synchronize your CRM or ERP system with the current
   * state on the Twikey platform. Can be triggered periodically or via
   * webhook. Unlike Python's callback-based `InvoiceFeed` handler, this
   * returns an async generator you iterate with `for await`.
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
   * This method retrieves events from Twikey since the last sync. Unlike
   * Python's callback-based `PaymentFeed` handler, this returns an async
   * generator you iterate with `for await`.
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
    return this.put(`/invoice/${invoiceId}`, { id: invoiceId, ...update }, { "Content-Type": "application/json" })
      .then(value => value.data);
  }

  /**
   * Reoffer an invoice via a PATCH request to the API.
   *
   * @param invoiceId - The unique identifier of the invoice to reoffer.
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async reoffer(invoiceId: string): Promise<void> {
    await this.patch(`/invoice/${invoiceId}/reoffer`);
  }

  /**
   * Fetch a QR code for paying an invoice.
   *
   * @param invoiceId - The unique identifier of the invoice.
   * @returns The QR code URL (and image, if returned by the API).
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async qr(invoiceId: string): Promise<InvoiceQrResponse> {
    return this.get(`/invoice/${invoiceId}/qr`, undefined, { "Content-Type": "application/json" }).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#action-on-invoice
   *
   * Trigger a specific action on an existing invoice.
   *
   * @param invoiceId - The unique identifier of the invoice.
   * @param request - The action to perform, plus any extra parameters.
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async action(invoiceId: string, request: InvoiceActionRequest): Promise<void> {
    const extra = Array.isArray(request.extra) ? request.extra.join('&') : '';
    const path = `/invoice/${invoiceId}/action?type=${request.type}${extra ? '&' + extra : ''}`;
    await this.post(path, undefined, { "Content-Type": "application/json" });
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
    await this.httpDelete(`/invoice/${invoiceId}`);
  }

  /**
   * See https://www.twikey.com/api/#upload-ubl
   *
   * Add a new invoice via a UBL file during a POST request to the API.
   *
   * @param xmlBody - The UBL invoice as a raw XML string or buffer.
   * @returns The created invoice.
   * @throws {TwikeyError} If the request fails or the response is invalid.
   */
  async ubl(xmlBody: string | Buffer): Promise<InvoiceResponse> {
    return this.post("/invoice/ubl", xmlBody, { "Content-Type": "application/xml" }).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#bulk-create-invoices
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
   * @returns The batch's invoice statuses.
   * @throws {TwikeyError} If the request fails or returns an unexpected status.
   */
  async bulkStatus(batchId: string): Promise<InvoiceBulkEntry[]> {
    return this.get("/invoice/bulk", { batchId }, { "Content-Type": "application/json" }).then(value => value.data);
  }

  /**
   * Fetch the PDF of an invoice.
   *
   * @param invoiceId - The unique identifier of the invoice.
   * @returns A structured response object containing the PDF content and filename.
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
