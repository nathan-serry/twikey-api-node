export class TwikeyError extends Error {
  // statusCode, not status: the response models use `status` for business state strings.
  readonly statusCode: number;
  readonly code: string;
  /** The API's `extra` field: which parameter was at fault, or a fuller explanation. */
  readonly extra: string;
  /** The API's `message` field — the human-readable reason. Python calls this `error`. */
  readonly apiMessage: string;
  /** Where the error came from, e.g. "POST /invoice", "Config" for login, "Logout". */
  readonly ctx: string;

  constructor(statusCode: number, code: string, extra = '', apiMessage = '', ctx = '') {
    super(
      `status=${statusCode} error=${code}`
      + (extra ? ` extra=${extra}` : '')
      + (apiMessage ? ` msg=${apiMessage}` : '')
      + (ctx ? ` ctx=${ctx}` : ''),
    );
    this.statusCode = statusCode;
    this.code = code;
    this.extra = extra;
    this.apiMessage = apiMessage;
    this.ctx = ctx;
  }
}

type RequestOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any> | URLSearchParams;
  headers?: Record<string, string>;
  responseType?: 'arraybuffer';
  /** Overrides the `ctx` on a thrown TwikeyError; defaults to "<METHOD> <path>". */
  ctx?: string;
};

export type HttpResponse = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  headers: Record<string, string>;
  statusCode: number;
};

export class FetchClient {
  private readonly baseURL: string;
  private readonly defaultHeaders: Record<string, string>;
  private authProvider?: () => Promise<string>;

  constructor(baseURL: string, defaultHeaders: Record<string, string>) {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.defaultHeaders = { ...defaultHeaders };
  }

  setAuthProvider(fn: () => Promise<string>): void {
    this.authProvider = fn;
  }

  private buildUrl(path: string, params?: Record<string, unknown> | URLSearchParams): string {
    if (!params) return this.baseURL + path;

    let qs: string;
    if (params instanceof URLSearchParams) {
      qs = params.toString();
    } else {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) sp.append(k, String(v));
      }
      qs = sp.toString();
    }

    if (!qs) return this.baseURL + path;
    const sep = path.includes('?') ? '&' : '?';
    return `${this.baseURL}${path}${sep}${qs}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async execute(method: string, path: string, body?: any, options: RequestOptions = {}): Promise<HttpResponse> {
    const url = this.buildUrl(path, options.params);

    const headers: Record<string, string> = { ...this.defaultHeaders };
    if (this.authProvider) {
      headers['Authorization'] = await this.authProvider();
    }
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    let fetchBody: string | Buffer | undefined;
    if (body !== undefined && body !== null) {
      if (Buffer.isBuffer(body)) {
        fetchBody = body;
      } else if (body instanceof URLSearchParams) {
        fetchBody = body.toString();
      } else if (typeof body === 'object') {
        const ct = headers['Content-Type'] ?? '';
        if (ct.includes('application/json')) {
          fetchBody = JSON.stringify(body);
        } else {
          const sp = new URLSearchParams();
          for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
            if (v !== undefined && v !== null) sp.append(k, String(v));
          }
          fetchBody = sp.toString();
        }
      } else {
        fetchBody = String(body);
      }
    }

    // Retry only on 429 (rate limiting): the request was rejected before processing, so
    // replaying it is safe even for non-idempotent verbs like POST. Other statuses and
    // network errors are not retried. Honour the server's Retry-After (seconds) when
    // present, otherwise back off exponentially (500ms, 1s, 2s), capped at maxRetries.
    // You can revert this change if not wanted
    const maxRetries = 3;
    let response: Response;
    let attempt = 0;
    for (;;) {
      response = await fetch(url, { method, headers, body: fetchBody });
      if (response.status !== 429 || attempt >= maxRetries) break;
      const retryAfter = Number(response.headers.get('retry-after'));
      const delayMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt;
      await new Promise(resolve => setTimeout(resolve, delayMs));
      attempt++;
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => { responseHeaders[key] = value; });

    if (!response.ok) {
      let errorData: { code?: string; message?: string; extra?: string } = {};
      try { errorData = await response.json() as { code?: string; message?: string; extra?: string }; } catch { /* ignore */ }
      throw new TwikeyError(
        response.status,
        errorData.code ?? '',
        errorData.extra ?? '',
        errorData.message ?? '',
        options.ctx ?? `${method} ${path || '/'}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any;
    if (options.responseType === 'arraybuffer') {
      data = await response.arrayBuffer();
    } else {
      const text = await response.text();
      if (text) {
        try { data = JSON.parse(text); } catch { data = text; }
      } else {
        data = null;
      }
    }

    return { data, headers: responseHeaders, statusCode: response.status };
  }

  get(path: string, options: RequestOptions = {}): Promise<HttpResponse> {
    return this.execute('GET', path, undefined, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post(path: string, body?: any, options: RequestOptions = {}): Promise<HttpResponse> {
    return this.execute('POST', path, body, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put(path: string, body?: any, options: RequestOptions = {}): Promise<HttpResponse> {
    return this.execute('PUT', path, body, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch(path: string, body?: any, options: RequestOptions = {}): Promise<HttpResponse> {
    return this.execute('PATCH', path, body, options);
  }

  delete(path: string, options: RequestOptions = {}): Promise<HttpResponse> {
    return this.execute('DELETE', path, undefined, options);
  }
}
