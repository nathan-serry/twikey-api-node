import {BaseInfo} from "./Shared";

export interface PaylinkRequest extends BaseInfo {
    ct: number;
    sendInvite?: boolean | string;

    message: string;
    remittance?: string;
    ref: string;
    redirectUrl?: string;
    place?: string;
    method?: string;
    invoice?: string;
    amount: number;
    isTemplate?: boolean;
}

export interface PaylinkRefundRequest {
    id: number;
    amount: number;
    message: string;
}
