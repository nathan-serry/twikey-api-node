import { BaseService } from "./BaseService";
import {CustomerLoginRequest, CustomerRequest} from "../../models/CustomerRequest";
import {CustomerLoginResponse, CustomerResponse} from "../../models/CustomerResponse";

export class CustomerService extends BaseService {

    async fetch(ref: string): Promise<CustomerResponse> {
        return this.get(`/customer/${encodeURIComponent(ref)}`).then(r => r.data);
    }

    async replace(ref: string, request: CustomerRequest): Promise<void> {
        const formData = new URLSearchParams();
        for (const [key, value] of Object.entries(request)) {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        }
        await this.put(`/customer/${encodeURIComponent(ref)}`, formData);
    }

    async remove(ref: string): Promise<void> {
        await this.httpDelete(`/customer/${encodeURIComponent(ref)}`);
    }

    async update(ref: string, request: Partial<CustomerRequest>): Promise<void> {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(request)) {
            if (value !== undefined && value !== null) {
                params.append(key, String(value));
            }
        }
        await this.patch(`/customer/${encodeURIComponent(ref)}?${params.toString()}`);
    }

    async login(request: CustomerLoginRequest): Promise<CustomerLoginResponse> {
        return this.post("/customeraccess", request).then(r => r.data);
    }
}
