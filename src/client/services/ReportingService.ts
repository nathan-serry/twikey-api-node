import {BaseService} from "./BaseService";
import {ReconciliationGenerateRequest, ReportingEntry} from "../../models/ReportingRequest";
import {ReconciliationFile} from "../../models/ReportingResponse";

export class ReportingService extends BaseService {

  /**
   * Fetch the reporting feed of previously imported bank-statement entries via
   * a GET request to the API.
   *
   * This retrieves the statement entries that have been imported so far
   * through `addAccount()`/`addItems()`, so it can be used to confirm an
   * import landed or to re-read what was reported earlier.
   *
   * @returns The reported statement entries, unwrapped from the API's
   *   `{Statements: […]}` envelope.
   * @throws {TwikeyError} If the request fails.
   */
  async feed(): Promise<unknown> {
    // The endpoint wraps the rows in {Statements:[...]}; return the array.
    return this.get("/reporting").then(value => value.data?.Statements ?? value.data);
  }

  /**
   * Import a raw bank-statement (CODA/MT940/camt) payload via a POST request
   * to the API.
   *
   * The payload is plain text, sent with a `text/plain` content type. Its
   * first line is `twikey:<iban>` followed, on that same line, by the column
   * header — e.g. `twikey:BE123… name;msg;amount;date;iban;bic` — and then one
   * data row per entry, with the amount in cents. A column header on a line
   * of its own, or a form-encoded body, is rejected as `invalid_file`. Use
   * this when you already have a fully-formed statement payload to hand;
   * `addItems()` builds the same shape of payload from structured entries.
   *
   * @param payload - The raw statement content to import, already formatted
   *   as described above.
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async addAccount(payload: string): Promise<void> {
    await this.post("/reporting", payload, { "Content-Type": "text/plain" });
  }

  /**
   * Import structured bank-statement entries via a POST request to the API.
   *
   * Builds the same plain-text payload `addAccount()` expects and sends it
   * with a `text/plain` content type: `twikey:<iban>` with the column header
   * on that same first line, then one data row per entry
   * (`name;msg;amount;date;iban;bic`). The column header must stay on that
   * first line and the body must not be form-encoded — either mistake is
   * rejected as `invalid_file`. Each entry's `amount` is given in units (e.g.
   * `12.34`) and converted to cents in the outgoing row.
   *
   * @param iban - The account IBAN the entries belong to; written into the
   *   `twikey:<iban>` header line.
   * @param items - The statement entries to import, one per data row.
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async addItems(iban: string, items: ReportingEntry[]): Promise<void> {
    const lines = [
      `twikey:${iban} name;msg;amount;date;iban;bic`,
      ...items.map(r => `${r.name};${r.msg};${Math.floor(100 * r.amount)};${r.date};${r.iban};${r.bic}`)
    ];
    await this.post("/reporting", lines.join("\n"), { "Content-Type": "text/plain" });
  }

  /**
   * Generate a reconciliation file via a POST request to the API.
   *
   * The file is built asynchronously from the creditor's existing collections
   * and does not come back in the response; poll `getFiles()` afterwards for
   * it to appear, then retrieve it with `downloadFile()`.
   *
   * @param request - The reconciliation parameters: `sdd` to include SEPA
   *   Direct Debit collections, `paylink` to include payment link
   *   collections, and `format` for the file format to generate (e.g. `csv`).
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async generateReconciliation(request: ReconciliationGenerateRequest): Promise<void> {
    const { sdd = false, paylink = false, format } = request;
    const params = new URLSearchParams({ sdd: String(sdd), paylink: String(paylink), format });
    await this.post(`/files?${params}`);
  }

  /**
   * List the generated reconciliation files via a GET request to the API.
   *
   * Each entry's `name` is the identifier `downloadFile()` needs to retrieve
   * that file's content.
   *
   * @returns The available files, unwrapped from the API's `{Files: […]}`
   *   envelope.
   * @throws {TwikeyError} If the request fails.
   */
  async getFiles(): Promise<ReconciliationFile[]> {
    // The endpoint wraps the list in {Files:[...]}; return the array.
    return this.get("/files").then(value => value.data?.Files ?? value.data);
  }

  /**
   * Download a previously generated reconciliation file via a GET request to
   * the API.
   *
   * @param filename - The file's `name`, as returned by `getFiles()`.
   * @returns The raw file content.
   * @throws {TwikeyError} If the request fails.
   */
  async downloadFile(filename: string): Promise<Buffer> {
    const response = await this.client.get(`/files/${filename}`, {
      headers: { 'Accept-Encoding': 'gzip,deflate,br' },
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  }
}
