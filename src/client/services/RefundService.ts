import {BaseService} from "./BaseService";
import {BeneficiaryRequest, RefundBatchRequest, RefundRequest} from "../../models/RefundRequest";
import {BeneficiaryResponse} from "../../models/RefundResponse";

export class RefundService extends BaseService {

  async addBeneficiary(request: BeneficiaryRequest): Promise<BeneficiaryResponse> {
    return this.post("/transfers/beneficiaries", request).then(value => value.data);
  }

  async getBeneficiaries(): Promise<BeneficiaryResponse[]> {
    return this.get("/transfers/beneficiaries").then(value => value.data.beneficiaries);
  }

  async disableBeneficiary(iban: string, customerNumber?: string): Promise<void> {
    await this.delete(`/transfers/beneficiaries/${iban}`, customerNumber ? { customerNumber } : undefined);
  }

  async addRefund(request: RefundRequest): Promise<void> {
    await this.post("/transfer", request);
  }

  async collectRefund(request: RefundBatchRequest): Promise<void> {
    await this.post("/transfer/complete", request);
  }
}
