export interface BaseInfo {
    l?: string;
    customerNumber?: string | number;
    email?: string;
    lastname?: string;
    firstname?: string;
    mobile?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    companyName?: string;
    coc?: string;
    vatno?: string;
    peppol?: string;
    delivery?: string;
}

export interface FeedOptions {
    includes?: string[];
    start_position?: number;
    last_position?: number;
}

export interface PdfResponse {
    content: Buffer;
    filename: string;
}
