export interface TransactionRequest {
    mndtId: string;
    date?: string;
    reqcolldt?: string;
    message: string;
    ref?: string;
    amount: number;
    place?: string;
    refase2e?: boolean;
    reservation?: boolean;
}

export interface TransactionUpdateRequest {
    status?: string;
    executionDate?: string;
}

export interface TransactionActionRequest {
    id?: string;
    ref?: string;
    action: string;
}

export interface TransactionRefundRequest {
    id?: string;
    ref?: string;
    amount?: number;
    message?: string;
}

export interface TransactionRemoveRequest {
    id?: string;
    ref?: string;
}

export interface TransactionQueryRequest {
    fromId?: string;
    [key: string]: string | number | boolean | undefined;
}
