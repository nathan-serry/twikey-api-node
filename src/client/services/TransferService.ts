import {BaseService} from "./BaseService";
import {BeneficiaryRequest, TransferCompleteRequest, TransferRequest} from "../../models/TransferRequest";
import {BeneficiaryResponse} from "../../models/TransferResponse";

export class TransferService extends BaseService {

  async addBeneficiary(request: BeneficiaryRequest): Promise<BeneficiaryResponse> {
    return this.post("/transfers/beneficiaries", request).then(value => value.data);
  }

  async getBeneficiaries(): Promise<BeneficiaryResponse[]> {
    return this.get("/transfers/beneficiaries").then(value => value.data);
  }

  async disableBeneficiary(iban: string, customerNumber?: string): Promise<void> {
    await this.delete(`/transfers/beneficiaries/${iban}`, customerNumber ? { customerNumber } : undefined);
  }

  async addRefund(request: TransferRequest): Promise<void> {
    await this.post("/transfer", request);
  }

  async collectRefund(request: TransferCompleteRequest): Promise<void> {
    await this.post("/transfer/complete", request);
  }
}
