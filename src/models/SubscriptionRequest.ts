export interface SubscriptionRequest {
    ct: number;
    mndtId: string;
    ref?: string;
    amount: number;
    message?: string;
    recurrencePeriod?: string;
    startDate?: string;
    stopDate?: string;
    recurrenceCount?: number;
    transactionMessage?: string;
}

export interface SubscriptionUpdateRequest {
    amount?: number;
    message?: string;
    startDate?: string;
    stopDate?: string;
    recurrencePeriod?: string;
    recurrenceCount?: number;
    transactionMessage?: string;
}

export interface SubscriptionQueryRequest {
    [key: string]: string | number | boolean | undefined;
}
