import {BaseService} from "./BaseService";
import {ReconciliationGenerateRequest, ReportingEntry} from "../../models/ReportingRequest";
import {ReconciliationFile} from "../../models/ReportingResponse";

export class ReportingService extends BaseService {

  async feed(): Promise<unknown> {
    return this.get("/reporting").then(value => value.data);
  }

  async addAccount(payload: string): Promise<void> {
    await this.post("/reporting", payload, { "Content-Type": "text/plain" });
  }

  async addItems(iban: string, items: ReportingEntry[]): Promise<void> {
    const lines = [
      `twikey:${iban}`,
      "name;msg;amount;date;iban;bic",
      ...items.map(r => `${r.name};${r.msg};${Math.floor(100 * r.amount)};${r.date};${r.iban};${r.bic}`)
    ];
    await this.post("/reporting", lines.join("\n"), { "Content-Type": "application/x-www-form-urlencoded" });
  }

  async generateReconciliation(request: ReconciliationGenerateRequest): Promise<void> {
    const { sdd = false, paylink = false, format } = request;
    await this.post(`/files?sdd=${sdd}&paylink=${paylink}&format=${format}`);
  }

  async getFiles(): Promise<ReconciliationFile[]> {
    return this.get("/files").then(value => value.data);
  }

  async downloadFile(filename: string): Promise<Buffer> {
    const response = await this.client.get(`/files/${filename}`, {
      headers: { 'Accept-Encoding': 'gzip,deflate,br' },
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  }
}
