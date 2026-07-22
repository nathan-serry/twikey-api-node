import {BaseService} from "./BaseService";
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
import {FeedOptions} from "../../models/Shared";

export class TransactionService extends BaseService {
  async create(request: TransactionRequest): Promise<Transaction> {
    return this.post("/transaction", request).then(value => value.data.Entries[0]);
  }

  async authorise(request: TransactionRequest): Promise<Transaction> {
    return this.post("/transaction", { ...request, reservation: true }).then(value => value.data?.Entries?.[0] ?? value.data);
  }

  async capture(request: TransactionRequest & { id: string }): Promise<Transaction> {
    const { id, ...body } = request;
    return this.post("/transaction", body, { "X-Reservation": id }).then(value => value.data?.Entries?.[0] ?? value.data);
  }

  async action(request: TransactionActionRequest): Promise<void> {
    await this.post("/transaction/action", request);
  }

  async refund(request: TransactionRefundRequest): Promise<void> {
    await this.post("/transaction/refund", request);
  }

  async remove(request: TransactionRemoveRequest): Promise<void> {
    if (!request.id && !request.ref) throw new Error("id or ref is required");
    const params = request.id ? { id: request.id } : { ref: request.ref };
    await this.delete("/transaction", params);
  }

  async query(request: TransactionQueryRequest): Promise<TransactionResponse> {
    if (!request.fromId) throw new Error("fromId is required");
    return this.get("/transaction/query", request, { "Content-Type": "application/json" }).then(value => value.data);
  }

  async bulkCreate(entries: TransactionRequest[]): Promise<TransactionBulkResult> {
    return this.post("/transaction/bulk", entries, { "Content-Type": "application/json" }).then(value => value.data);
  }

  async bulkStatus(batchId: string): Promise<TransactionBulkEntry[]> {
    return this.get("/transaction/bulk", { batchId }, { "Content-Type": "application/json" }).then(value => value.data);
  }

  async detail(id: string): Promise<TransactionResponse> {
    return this.get(`/transaction/detail`, { id }).then(value => value.data);
  }

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

  async update(transactionId: string, update: TransactionUpdateRequest): Promise<TransactionResponse> {
    return this.post(`/transaction/${transactionId}`, update).then(value => value.data);
  }
}
