import {BaseResponse, BaseService} from "./BaseService";
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
  async create(request: InvoiceRequest): Promise<InvoiceResponse> {
    return this.post("/invoice", request, { "Content-Type": "application/json" }).then(value => value.data);
  }

  async detail(invoiceId: string): Promise<InvoiceResponse> {
    return this.get(`/invoice/${invoiceId}`).then(value => value.data);
  }

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

  async update(invoiceId: string, update: InvoiceUpdateRequest): Promise<BaseResponse<InvoiceResponse>> {
    return this.post(`/invoice/${invoiceId}`, update);
  }

  async reoffer(invoiceId: string): Promise<void> {
    await this.patch(`/invoice/${invoiceId}/reoffer`);
  }

  async qr(invoiceId: string): Promise<InvoiceQrResponse> {
    return this.get(`/invoice/${invoiceId}/qr`, undefined, { "Content-Type": "application/json" }).then(value => value.data);
  }

  async action(invoiceId: string, request: InvoiceActionRequest): Promise<void> {
    const extra = Array.isArray(request.extra) ? request.extra.join('&') : '';
    const path = `/invoice/${invoiceId}/action?type=${request.type}${extra ? '&' + extra : ''}`;
    await this.post(path, undefined, { "Content-Type": "application/json" });
  }

  async ubl(xmlBody: string | Buffer): Promise<InvoiceResponse> {
    return this.post("/invoice/ubl", xmlBody, { "Content-Type": "application/xml" }).then(value => value.data);
  }

  async bulkCreate(invoices: InvoiceRequest[]): Promise<InvoiceBulkResult> {
    return this.post("/invoice/bulk", invoices, { "Content-Type": "application/json" }).then(value => value.data);
  }

  async bulkStatus(batchId: string): Promise<InvoiceBulkEntry[]> {
    return this.get("/invoice/bulk", { batchId }, { "Content-Type": "application/json" }).then(value => value.data);
  }

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
