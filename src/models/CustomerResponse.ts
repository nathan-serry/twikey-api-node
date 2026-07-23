export interface CustomerResponse {
    customerNumber?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    companyName?: string;
    coc?: string;
    vatno?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    mobile?: string;
    language?: string;
    peppol?: string;
    delivery?: string;
}

export interface CustomerLoginResponse {
    url: string;
    token?: string;
}
