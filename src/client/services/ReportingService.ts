import {BaseService} from "./BaseService";
import {ReconciliationGenerateRequest, ReportingEntry} from "../../models/ReportingRequest";
import {ReconciliationFile} from "../../models/ReportingResponse";

export class ReportingService extends BaseService {

  /**
   * Fetch the reporting feed of previously imported bank-statement entries.
   *
   * @returns The reported statement entries.
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
   * The payload is plain text. Its first line is `twikey:<iban>` followed, on
   * that same line, by the column header — e.g.
   * `twikey:BE123… name;msg;amount;date;iban;bic` — and then one data row per
   * entry, with the amount in cents. A column header on a line of its own is
   * rejected as `invalid_file`.
   *
   * @param payload - The raw statement content to import.
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async addAccount(payload: string): Promise<void> {
    await this.post("/reporting", payload, { "Content-Type": "text/plain" });
  }

  /**
   * Import structured bank-statement entries via a POST request to the API.
   *
   * Builds the same plain-text payload `addAccount()` expects: `twikey:<iban>`
   * with the column header on that same first line, then one data row per
   * entry (`name;msg;amount;date;iban;bic`). Amounts are given in units and
   * sent in cents.
   *
   * @param iban - The account IBAN the entries belong to.
   * @param items - The statement entries to import.
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
   * Generate a reconciliation file via a POST request to the API. The
   * generated file can then be listed with `getFiles()` and retrieved with
   * `downloadFile()`.
   *
   * @param request - The reconciliation parameters (`sdd`, `paylink`, `format`).
   * @returns Nothing.
   * @throws {TwikeyError} If the API returns an error or the request fails.
   */
  async generateReconciliation(request: ReconciliationGenerateRequest): Promise<void> {
    const { sdd = false, paylink = false, format } = request;
    const params = new URLSearchParams({ sdd: String(sdd), paylink: String(paylink), format });
    await this.post(`/files?${params}`);
  }

  /**
   * List the generated reconciliation files.
   *
   * @returns The available files.
   * @throws {TwikeyError} If the request fails.
   */
  async getFiles(): Promise<ReconciliationFile[]> {
    // The endpoint wraps the list in {Files:[...]}; return the array.
    return this.get("/files").then(value => value.data?.Files ?? value.data);
  }

  /**
   * Download a previously generated reconciliation file.
   *
   * @param filename - The file's `name`, as returned by `getFiles()`.
   * @returns The file content.
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
