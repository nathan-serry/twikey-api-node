import {BaseService} from "./BaseService";
import {PaylinkRefundRequest, PaylinkRequest} from "../../models/PaylinkRequest";
import {PaylinkResponse} from "../../models/PaylinkResponse";
import {FeedOptions} from "../../models/Shared";

export class PaylinkService extends BaseService {

  async create(request: PaylinkRequest): Promise<PaylinkResponse> {
    return this.post("/payment/link", request).then(value => value.data);
  }

  async detail(plId: number | string, includeRefunds = false): Promise<PaylinkResponse> {
    const path = `/payment/link?id=${plId}${includeRefunds ? '&include=refunds' : ''}`;
    return this.get(path).then(value => value.data.Links?.[0] ?? value.data);
  }

  async refund(request: PaylinkRefundRequest): Promise<void> {
    await this.post("/payment/link/refund", request);
  }

  async *feed(options?: FeedOptions): AsyncGenerator<PaylinkResponse> {

    const formData = new URLSearchParams();
    let _headers:any = {};
    if(options){
      if(options.start_position)
        _headers['X-RESUME-AFTER'] = options.start_position;
      if(options.includes){
        for (const include of options.includes) {
          formData.append("include", include);
        }
      }
    }
    else {
      options = {}
    }

    let isEmpty = false;
    while (!isEmpty) {
      const response = await this.get("/payment/link/feed", formData, _headers);
      if (!response.data.Links.length) {
        isEmpty = true;
      } else {
        options.last_position = response.headers['x-last'];
        for (const link of response.data.Links) {
          yield link;
        }
      }
    }
  }
}
