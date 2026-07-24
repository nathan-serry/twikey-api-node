import {FetchClient, HttpResponse} from "../HttpClient";
export type {PdfResponse} from "../../models/Shared";

export interface BaseResponse<T> {
  data: T
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers: any
}

export class BaseService {

  constructor(protected readonly client: FetchClient) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async get(endpoint: string, params?: Record<string, any> | URLSearchParams, headers?: Record<string, string>): Promise<BaseResponse<any>> {
    const response: HttpResponse = await this.client.get(endpoint, { params, headers });
    return {
      data: response.data,
      headers: response.headers
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async post(endpoint: string, data?: any, headers?: Record<string, string>): Promise<BaseResponse<any>> {
    const response: HttpResponse = await this.client.post(endpoint, data, { headers });
    return {
      data: response.data,
      headers: response.headers
    };
  }

  protected async put(endpoint: string, data?: any, headers?: Record<string, string>): Promise<BaseResponse<any>> {
    const response = await this.client.put(endpoint, data, { headers });
    return {
      data: response.data,
      headers: response.headers
    };
  }

  protected async patch(endpoint: string, data?: any, headers?: Record<string, string>): Promise<BaseResponse<any>> {
    const response = await this.client.patch(endpoint, data, { headers });
    return {
      data: response.data,
      headers: response.headers
    };
  }

  protected async httpDelete(endpoint: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<BaseResponse<any>> {
    const response = await this.client.delete(endpoint, { params, headers });
    return {
      data: response.data,
      headers: response.headers
    };
  }

}
