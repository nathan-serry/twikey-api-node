import {BaseService} from "./BaseService";
import {
  DocumentActionRequest,
  DocumentQueryRequest,
  DocumentRequest,
  DocumentSignRequest,
  DocumentUpdateRequest,
} from "../../models/DocumentRequest";
import {
  CustomerAccessResponse,
  DocumentFeedMessage,
  DocumentQueryResponse,
  DocumentResponse,
  MandateDetail,
} from "../../models/DocumentResponse";
import {FeedOptions, PdfResponse} from "../../models/Shared";

export class DocumentService extends BaseService {
  /**
   * See https://www.twikey.com/api/#invite-a-customer
   *
   * Create a new mandate (certain period to be signed in) via a POST request to the API.
   *
   * This method sends the provided request payload to the corresponding endpoint
   * and parses the JSON response into a response model. Typically used to initiate
   * actions like inviting a customer, creating a mandate, or generating a payment link.
   * Throws an error if the API response contains an error code or the request fails.
   *
   * @param request - An object representing the payload to send.
   * @returns A structured response object representing the server's reply.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async create(request: DocumentRequest): Promise<DocumentResponse> {
    return this.post("/invite", request).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#sign-a-mandate
   *
   * Create a new mandate (ready to be signed) via a POST request to the API.
   *
   * This method sends the provided request payload to the corresponding endpoint
   * and parses the JSON response into a response model. Typically used to initiate
   * actions like inviting a customer, creating a mandate, or generating a payment link.
   * Throws an error if the API response contains an error code or the request fails.
   *
   * @param request - An object representing the payload to send.
   * @returns A structured response object representing the server's reply.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async sign(request: DocumentSignRequest): Promise<DocumentResponse> {
    return this.post("/sign", request).then(value => {
      const data = value.data;
      // API returns MndtId (PascalCase) for the sign endpoint; normalise to mndtId
      if (data.MndtId && !data.mndtId) data.mndtId = data.MndtId;
      return data;
    });
  }

  /**
   * See https://www.twikey.com/api/#fetch-mandate-details
   *
   * Retrieves the details of a specific mandate by ID.
   *
   * This method queries the Twikey API for the latest details related to the mandate
   * for the provided identifier. Typically used for querying status based on the
   * mandate number.
   *
   * @param mndtId - The unique identifier of the mandate to fetch (mndtId).
   * @param force - When true, forces a refresh of the mandate details rather than
   *   returning a cached value. (optional)
   * @returns The full mandate, unwrapped from the API's `{Mndt: {…}}` envelope. Note the
   *   mandate's state is not part of it: the API sends that in the `X-STATE` response
   *   header, which this method does not surface.
   * @throws {TwikeyError} If the API call fails or the identifier is invalid. A mandate
   *   that is not in a fetchable state answers `err_invalid_state`.
   */
  async detail(mndtId: string, force?: boolean): Promise<MandateDetail> {
    const params: Record<string, any> = { mndtId };
    if (force) params.force = true;
    // The API wraps the mandate as {Mndt: {…}}; unwrap defensively, as the other services do.
    return this.get(`/mandate/detail`, params).then(value => value.data?.Mndt ?? value.data);
  }

  /**
   * See https://www.twikey.com/api/#mandate-query
   *
   * Retrieve contract details by IBAN, customer number, email, or a combination of
   * query parameters.
   *
   * This endpoint allows you to search for mandates based on specific identifiers.
   * The result contains a list of contracts (mandates) that match the provided
   * parameters.
   *
   * @param params - Query parameters like `iban`, `customerNumber`, `email`, `state`
   *   or `page`. At least one of `iban`, `customerNumber` or `email` is required.
   * @returns A list of mandate details that match the query.
   * @throws {TwikeyError} If the request fails or the API returns an error.
   */
  async query(params: DocumentQueryRequest): Promise<DocumentQueryResponse> {
    return this.get('/mandate/query', params).then(value => value.data);
  }

  /**
   * See https://www.twikey.com/api/#mandate-feed
   *
   * Fetches the latest mandate feed including new, updated, or cancelled mandates.
   *
   * This method retrieves events from Twikey since the last sync. These events
   * concern mandates only. It's typically used to synchronize your CRM or ERP
   * system with the current state on the Twikey platform. Can be triggered
   * periodically or via webhook. This returns an async generator, so iterate it
   * with `for await`; the `IsNew`/`IsUpdated`/`IsCancelled` flags on each yielded
   * message tell you which kind of event it is.
   *
   * @param options - Feed options: `includes` to request extra fields, and
   *   `start_position` to resume from a previous `last_position`. (optional)
   * @returns An async generator yielding one `DocumentFeedMessage` per event; the
   *   feed is exhausted once no more messages are pending.
   * @throws {TwikeyError} If the request to the feed endpoint fails.
   */
  async *feed(options?: FeedOptions): AsyncGenerator<DocumentFeedMessage> {

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
      const response = await this.get("/mandate", formData, _headers);
      let data = response.data.Messages
      if (!data.length) {
        isEmpty = true;
      } else {
        options.last_position = response.headers['x-last'];
        for (const document of data) {
          if (!document.AmdmtRsn && !document.CxlRsn) {
            document.IsNew = true;
          }
          if (document.AmdmtRsn) {
            document.IsUpdated = true;
          }
          if (document.CxlRsn) {
            document.IsCancelled = true;
          }
          yield document;
        }
      }
    }
  }

  /**
   * Update the status of a mandate via a POST request to the API.
   *
   * This sends a `{status}` body to `/mandate/{mandateId}`, distinct from
   * `update()` (which posts a broader set of mandate fields, including `state`,
   * to `/mandate/update`).
   *
   * @param mandateId - The unique identifier of the mandate to update (mndtId).
   * @param status - The new status to set on the mandate.
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async updateStatus(mandateId: string, status: string): Promise<void> {
    await this.post(`/mandate/${mandateId}`, { status });
  }

  /**
   * See https://www.twikey.com/api/#retrieve-mandate-pdf
   *
   * Retrieve the PDF of a mandate via a GET request to the API.
   *
   * @param mndtId - A unique identifier for a mandate.
   * @returns A structured response object containing the PDF content and filename.
   * @throws {TwikeyError} If the request fails or the response is invalid.
   */
  async pdf(mndtId: string): Promise<PdfResponse> {
    const params = new URLSearchParams({ mndtId });
    const response = await this.client.get(`/mandate/pdf?${params}`, {
      headers: { 'Accept': 'application/pdf' },
      responseType: 'arraybuffer'
    });
    return {
      content: Buffer.from(response.data),
      filename: `${mndtId}.pdf`
    };
  }

  /**
   * See https://www.twikey.com/api/#upload-pdf
   *
   * Add a new mandate via a pdf during a POST request to the API.
   *
   * @param mndtId - The unique identifier of the mandate the PDF belongs to.
   * @param pdfContent - The raw PDF file content to upload.
   * @param bankSignature - Only used for B2B mandates. (optional)
   * @returns Nothing.
   * @throws {TwikeyError} If the request fails or the response is invalid.
   */
  async uploadPdf(mndtId: string, pdfContent: Buffer, bankSignature?: boolean): Promise<void> {
    const params = new URLSearchParams({ mndtId });
    if (bankSignature !== undefined) params.append('bankSignature', String(bankSignature));
    await this.client.post(`/mandate/pdf?${params}`, pdfContent, {
      headers: { 'Content-Type': 'application/pdf' }
    });
  }

  /**
   * See https://www.twikey.com/api/#cancel-agreements
   *
   * Sends a DELETE request to cancel a mandate on the Twikey API.
   *
   * This method allows the creditor to cancel/delete a resource by providing the
   * unique ID and a reason for cancellation. This ensures Twikey's records are
   * updated and, if applicable, forwards the cancellation to the debtor's bank.
   * Cancellation can originate from the creditor, the creditor's bank, or the
   * debtor's bank.
   *
   * @param mndtId - The unique identifier of the mandate to cancel (mndtId).
   * @param rsn - The reason for cancelling the mandate. Can be a custom message or
   *   an R-message code.
   * @param notify - When true, the customer will be notified by email. (optional,
   *   defaults to false)
   * @returns Nothing.
   * @throws {TwikeyError} If the request fails or the response contains an API
   *   error code.
   */
  async cancel(mndtId: string, rsn: string, notify = false): Promise<void> {
    await this.httpDelete('/mandate', { mndtId, rsn, notify });
  }

  /**
   * See https://www.twikey.com/api/#mandate-actions
   *
   * Trigger a specific action on an existing mandate.
   *
   * This endpoint allows initiating predefined actions related to a mandate, such
   * as sending an invitation or reminder, or toggling B2B validation behavior. The
   * action type must be explicitly provided in the request.
   *
   * @param mndtId - The unique identifier of the mandate to act on (mndtId).
   * @param request - The action to perform. `type` is required (e.g. 'invite',
   *   'reminder'); `reminder` selects which reminder (1-4) when `type` is
   *   'reminder'.
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async action(mndtId: string, request: DocumentActionRequest): Promise<void> {
    await this.post(`/mandate/${mndtId}/action`, { mndtId, ...request });
  }

  /**
   * See https://www.twikey.com/api/#update-mandate-details
   *
   * Send a POST request to update existing mandate details.
   *
   * This endpoint allows modifying mandate information such as customer data,
   * mandate configuration, or linked references. Only provide parameters for
   * fields you wish to update. Some fields may have special behavior or
   * limitations depending on the object state.
   *
   * @param mndtId - The unique identifier of the mandate to update (mndtId).
   * @param fields - An object representing the fields to update.
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async update(mndtId: string, fields: DocumentUpdateRequest): Promise<void> {
    await this.post('/mandate/update', { mndtId, ...fields });
  }

  /**
   * See https://www.twikey.com/api/#customer-access
   *
   * Create a new customer access link via a POST request to the API.
   *
   * @param mndtId - The unique identifier of the mandate to create the access link for.
   * @returns A structured response object representing the server's reply.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async customerAccess(mndtId: string): Promise<CustomerAccessResponse> {
    return this.post('/customeraccess', { mndtId }).then(value => value.data);
  }
}
