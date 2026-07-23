import {BaseInfo} from "./Shared";

export interface Customer extends BaseInfo {
    language?: string;
}

export interface CustomerRequest {
    firstname?: string;
    lastname?: string;
    email?: string;
    companyName?: string;
    coc?: string;
    vatno?: string;
    peppol?: string;
    delivery?: string;
    customerNo?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    l?: string;
    mobile?: string;
    ct?: number;
}

export interface CustomerLoginRequest {
    customerNumber: string;
    email?: string;
    mobile?: string;
}
