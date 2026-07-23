export interface CollectRequest {
    ct: number;
    mndtId: string;
    message: string;
    amount: number;
    ref?: string;
    date?: string;
    place?: string;
}

export interface CollectQueryRequest {
    state?: 'sent' | 'archived' | 'cancelled';
    generated?: string;
    reqcolldt?: string;
    ct?: number;
    page?: number;
    from?: string;
    until?: string;
}

export interface CollectDetailRequest {
    [key: string]: string | number | boolean | undefined;
}
