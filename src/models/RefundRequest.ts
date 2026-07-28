export interface BeneficiaryRequest {
    customerNumber?: string;
    name: string;
    iban: string;
    bic?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
}

export interface RefundRequest {
    ref?: string;
    message: string;
    amount: number;
    iban: string;
    bic?: string;
    name?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    ct?: number;
    customerNumber?: string;
}

export interface RefundBatchRequest {
    ct: number;
    iban?: string;
}

// Identifies an existing refund batch for status lookup. NOT the same as
// RefundBatchRequest (ct/iban), which creates a batch.
export interface RefundBatchStatusRequest {
    id: string | number;
    pmtinfid?: string;
}
