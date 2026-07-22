import {BaseService} from "./BaseService";
import {
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
} from "../../models/DocumentResponse";
import {FeedOptions, PdfResponse} from "../../models/Shared";

export class DocumentService extends BaseService {
  async create(request: DocumentRequest): Promise<DocumentResponse> {
    return this.post("/invite", request).then(value => value.data);
  }

  async sign(request: DocumentSignRequest): Promise<DocumentResponse> {
    return this.post("/sign", request).then(value => {
      const data = value.data;
      // API returns MndtId (PascalCase) for the sign endpoint; normalise to mndtId
      if (data.MndtId && !data.mndtId) data.mndtId = data.MndtId;
      return data;
    });
  }

  async detail(mndtId: string, force?: boolean): Promise<DocumentResponse> {
    const params: Record<string, any> = { mndtId };
    if (force) params.force = true;
    return this.get(`/mandate/detail`, params).then(value => value.data);
  }

  async query(params: DocumentQueryRequest): Promise<DocumentQueryResponse> {
    return this.get('/mandate/query', params).then(value => value.data);
  }

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

  async updateStatus(mandateId: string, status: string): Promise<void> {
    await this.post(`/mandate/${mandateId}`, { status });
  }

  async pdf(mndtId: string): Promise<PdfResponse> {
    const response = await this.client.get(`/mandate/pdf?mndtId=${mndtId}`, {
      headers: { 'Accept': 'application/pdf' },
      responseType: 'arraybuffer'
    });
    return {
      content: Buffer.from(response.data),
      filename: `${mndtId}.pdf`
    };
  }

  async uploadPdf(mndtId: string, pdfContent: Buffer): Promise<void> {
    await this.client.post(`/mandate/pdf?mndtId=${mndtId}`, pdfContent, {
      headers: { 'Content-Type': 'application/pdf' }
    });
  }

  async cancel(mndtId: string, rsn: string, notify = false): Promise<void> {
    await this.delete('/mandate', { mndtId, rsn, notify });
  }

  async update(mndtId: string, fields: DocumentUpdateRequest): Promise<void> {
    await this.post('/mandate/update', { mndtId, ...fields });
  }

  async customerAccess(mndtId: string): Promise<CustomerAccessResponse> {
    return this.post('/customeraccess', { mndtId }).then(value => value.data);
  }
}
