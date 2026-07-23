import {BaseInfo} from "./Shared";

export interface DocumentRequest extends BaseInfo {
    ct?: number;
    tc?: string;
    iban?: string;
    bic?: string;
    accountnumber?: string; // UK/BACS: 8-digit bank account number
    sortcode?: string;      // UK/BACS: sort code in XX-XX-XX format
    subregion?: string;     // UK/BACS: e.g. 'bacs'
    mandateNumber?: string;
    contractNumber?: string;
    campaign?: string;
    prefix?: string;
    check?: boolean;
    ed?: number;
    reminderDays?: number;
    sendInvite?: boolean | string;
    token?: string;
    requireValidation?: boolean;
    document?: string;
    transactionAmount?: string;
    transactionMessage?: string;
    transactionRef?: string;
    plan?: string;
    subscriptionStart?: Date;
    subscriptionRecurrence?: string;
    subscriptionStopAfter?: number;
    subscriptionAmount?: number;
    subscriptionMessage?: string;
    subscriptionRef?: string;
}

export interface DocumentSignRequest extends DocumentRequest {
    method: string;
    digsig?: string;
    key?: string;
    signDate?: string;
    place?: string;
    bankSignature?: boolean;
}

export interface DocumentUpdateRequest {
    state?: 'active',
    iban?: string;
    bic?: string;
    mobile?: string;
    email?: string;
    firstname?: string;
    lastname?: string;
    companyName?: string;
    coc?: string;
    l?: string;
    customerNumber?: string;
    ct?: number;
}

export interface DocumentQueryRequest {
    iban?: string;
    customerNumber?: string;
    email?: string;
    state?: 'SIGNED' | 'PREPARED' | 'CANCELLED';
    page?: number;
}
