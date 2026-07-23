export interface DocumentResponse {
    mndtId: string;
    url: string;
    key?: string;
    status?: string;
}

export interface DocumentFeedMessage {
    Mndt: string;
    AmdmtRsn?: string;
    CxlRsn?: string;
    OrgnlMndtId?: string;
    CdtrSchmeId?: string;
    EvtTime?: string;
    EvtId?: string;
    IsNew?: boolean;
    IsUpdated?: boolean;
    IsCancelled?: boolean;
}

export interface CustomerAccessResponse {
    token: string;
    url: string;
}

export interface DocumentContract {
    mandateNumber: string;
    state: string;
    [key: string]: any;
}

export interface DocumentQueryResponse {
    Contracts: DocumentContract[];
    _links?: { self: string };
}
