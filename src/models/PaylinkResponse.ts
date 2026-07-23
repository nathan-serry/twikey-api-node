export interface PaylinkResponse {
    id: number;
    url: string;
    msg: string;
    amount: number;
    ref: string;
    state?: string;
}
