export interface BeneficiaryResponse {
    iban: string;
    name: string;
    bic?: string;
    customerNumber?: string;
    state?: string;
}
