export interface SubscriptionResponse {
    mandateNumber: string;
    ref: string;
    state: string;
    amount: number;
    startDate?: string;
    stopDate?: string;
    recurrencePeriod?: string;
    recurrenceCount?: number;
    transactionMessage?: string;
}
