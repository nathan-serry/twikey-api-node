export interface SubscriptionRequest {
    ct: number;
    mndtId: string;
    ref?: string;
    amount: number;
    message?: string;
    recurrence?: string;
    start?: string;
    stop?: string;
    recurrenceCount?: number;
    transactionMessage?: string;
}

export interface SubscriptionUpdateRequest {
    amount?: number;
    message?: string;
    start?: string;
    stop?: string;
    recurrence?: string;
    recurrenceCount?: number;
    transactionMessage?: string;
}

export interface SubscriptionQueryRequest {
    [key: string]: string | number | boolean | undefined;
}
