export interface Transaction {
    id: string;
    mandate: string;
    amount: number;
    state: string;
    executionDate: string;
    ref?: string;
    remittance?: string;
    scaUrl?: string;
}

export interface TransactionResponse {
    Entries: Transaction[];
}

export interface TransactionBulkResult {
    batchId: string;
}

export interface TransactionBulkEntry {
    id: number;
    ref: string | null;
    mndtId: string;
    status: string;
}
