import { BaseService } from "./BaseService";
import {CustomerLoginRequest, CustomerRequest} from "../../models/CustomerRequest";
import {CustomerLoginResponse, CustomerResponse} from "../../models/CustomerResponse";

export class CustomerService extends BaseService {

    /**
     * Retrieve the details of a customer by identifier via a GET request to the API.
     *
     * This method queries the API for the current profile of a customer, such as
     * name, address, and contact details.
     *
     * @param ref - The customer's unique identifier (customer number).
     * @returns The customer's stored profile data.
     * @throws {TwikeyError} If the API returns an error or the request fails.
     */
    async fetch(ref: string): Promise<CustomerResponse> {
        return this.get(`/customer/${encodeURIComponent(ref)}`).then(r => r.data);
    }

    /**
     * Replace a customer's profile via a PUT request to the API.
     *
     * The stored profile is replaced wholesale by the fields supplied here, so
     * anything you leave out is cleared rather than kept. This is the difference
     * from `update`, which changes only the fields present in its request.
     *
     * @param ref - The customer's unique identifier (customer number).
     * @param request - The full customer profile to store.
     * @returns Nothing.
     * @throws {TwikeyError} If the API returns an error or the request fails.
     */
    async replace(ref: string, request: CustomerRequest): Promise<void> {
        const formData = new URLSearchParams();
        for (const [key, value] of Object.entries(request)) {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        }
        await this.put(`/customer/${encodeURIComponent(ref)}`, formData);
    }

    /**
     * Remove a customer via a DELETE request to the API.
     *
     * @param ref - The customer's unique identifier (customer number).
     * @returns Nothing.
     * @throws {TwikeyError} If the API returns an error or the request fails.
     */
    async remove(ref: string): Promise<void> {
        await this.httpDelete(`/customer/${encodeURIComponent(ref)}`);
    }

    /**
     * See https://www.twikey.com/api/#update-a-customer
     *
     * Send a PATCH request to update existing customer details.
     *
     * This endpoint allows modifying customer information such as customer data
     * or linked references. Only provide parameters for fields you wish to
     * update. Some fields may have special behavior or limitations depending on
     * the object state.
     *
     * @param ref - The customer's unique identifier (customer number).
     * @param request - The customer fields to update; only fields present here
     *   are changed, the rest of the stored profile is left untouched.
     * @returns Nothing.
     * @throws {TwikeyError} If the API returns an error or the request fails.
     */
    async update(ref: string, request: Partial<CustomerRequest>): Promise<void> {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(request)) {
            if (value !== undefined && value !== null) {
                params.append(key, String(value));
            }
        }
        await this.patch(`/customer/${encodeURIComponent(ref)}?${params.toString()}`);
    }

    /**
     * See https://www.twikey.com/api/#customer-access
     *
     * Create a new customer access link via a POST request to the API.
     *
     * This lets a customer be identified by customer number, email, or mobile
     * number, producing an access link (and accompanying token) for the
     * customer's self-service portal.
     *
     * @param request - The customer to identify. `customerNumber` is required;
     *   `email` and `mobile` are optional additional identification.
     * @returns The access link URL and, when available, the login token.
     * @throws {TwikeyError} If the API returns an error or the request fails.
     */
    async login(request: CustomerLoginRequest): Promise<CustomerLoginResponse> {
        return this.post("/customeraccess", request).then(r => r.data);
    }
}
