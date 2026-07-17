import { StandardError } from '~/core/class/standardError';

/**
 * ApiManager is a lightweight HTTP client that wraps fetch with features like
 * bearer token injection, timeout, custom headers, FormData, and typed responses.
 */
export default class ApiManager {
    protected Token?: string;
    protected URL!: string;
    protected TokenKey: string = 'Authorization';

    /**
     * Initializes the ApiManager with a base URL and optional token.
     * @param {string} [url] - The base URL of the API.
     * @param {string} [token] - Authorization token.
     * @param {string} [tokenKey] - Custom header key (defaults to "Authorization").
     */
    constructor(url?: string, token?: string, tokenKey?: string) {
        if (url) this.URL = url;
        if (tokenKey) this.TokenKey = tokenKey;
        if (token) this.Token = this.TokenKey === 'Authorization' ? `Bearer ${token}` : token;
    }

    /**
     * Builds the request headers, injecting token and custom headers.
     * @param {Record<string, string>} [headersRequest] - Additional headers to merge.
     * @returns {Headers}
     */
    private buildHeaders(headersRequest?: Record<string, string>): Headers {
        const headers = new Headers();
        if (this.Token) headers.set(this.TokenKey, this.Token);
        headers.set('Accept', 'application/json');
        if (headersRequest) {
            for (const [key, value] of Object.entries(headersRequest)) {
                headers.set(key, value);
            }
        }
        return headers;
    }

    /**
     * Builds the full URL with optional query parameters.
     * @param {string} route - API endpoint route.
     * @param {Record<string, string | number | boolean>} [queryParams] - Query parameters to append.
     * @returns {string}
     */
    private buildUrl(route: string, queryParams?: Record<string, string | number | boolean>): string {
        const url = new URL(`${this.URL}/${route}`);
        if (queryParams) {
            for (const [key, value] of Object.entries(queryParams)) {
                url.searchParams.append(key, value.toString());
            }
        }
        return url.toString();
    }

    /**
     * Base HTTP request handler used by all methods.
     * @template T
     * @param {'GET' | 'POST' | 'PUT' | 'DELETE'} method - HTTP method.
     * @param {string} route - API route.
     * @param {RequestOption} [options] - Request options.
     * @returns {Promise<T>}
     * @throws {StandardError} if fetch fails or response is not ok.
     */
    private async request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', route: string, options: RequestOption = {}): Promise<T> {
        const { body, formData, headers, queryParams, timeout = 8000 } = options;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        const requestHeaders = this.buildHeaders(headers);

        if (!formData && body && method !== 'GET') {
            if (body instanceof URLSearchParams) {
                requestHeaders.set('Content-Type', 'application/x-www-form-urlencoded');
            } else {
                requestHeaders.set('Content-Type', 'application/json');
            }
        }
        let payload = body;
        if (formData) {
            payload = formData
        } else {
            if (requestHeaders.has("Content-Type") && requestHeaders.get("Content-Type") !== "application/x-www-form-urlencoded") {
                payload = JSON.stringify(body);
            }
        }
        const fetchOptions: RequestInit = {
            method,
            headers: requestHeaders,
            credentials: 'include',
            signal: controller.signal,
            body: method !== 'GET' ? payload : undefined,
        };

        const url = this.buildUrl(route, queryParams);

        try {
            console.log(`Api Manager Fetching URL (${method}):`, url);
            const response = await fetch(url, fetchOptions);
            clearTimeout(timer);
            console.log(response, fetchOptions)
            if (!response.ok) {
                const text = await response.text();
                throw new StandardError('ApiManager.request', 'FATAL', 'error_happened', 'An error happened while api request', `HTTP ${response.status}: ${response.statusText}`, false, text);
            }

            return await this.onResponse<T>(response);
        } catch (error) {
            clearTimeout(timer);
            console.log(error);
            throw new StandardError('ApiManager.request', 'BAD_REQUEST', 'error_happened', 'An error happened while api request', `An error happened while trying call external Api`, false, error);
        } finally {
            console.log("Api Manager Fetch Successful ✅");
        }
    }

    /**
     * Executes a GET request.
     * @template T
     * @param {string} route
     * @param {Record<string, string | number | boolean>} [queryParams]
     * @param {Record<string, string>} [headers]
     * @returns {Promise<T>}
     */
    protected get<T>(route: string, queryParams?: Record<string, string | number | boolean>, headers?: Record<string, string>): Promise<T> {
        return this.request<T>('GET', route, { queryParams, headers });
    }

    /**
     * Executes a POST request.
     * @template T
     * @param {string} route
     * @param {any} [body]
     * @param {FormData} [formData]
     * @param {Record<string, string>} [headers]
     * @returns {Promise<T>}
     */
    protected post<T>(route: string, body?: any, formData?: FormData, headers?: Record<string, string>): Promise<T> {
        return this.request<T>('POST', route, { body, formData, headers });
    }

    /**
     * Executes a PUT request.
     * @template T
     * @param {string} route
     * @param {any} [body]
     * @param {FormData} [formData]
     * @param {Record<string, string>} [headers]
     * @returns {Promise<T>}
     */
    protected put<T>(route: string, body?: any, formData?: FormData, headers?: Record<string, string>): Promise<T> {
        return this.request<T>('PUT', route, { body, formData, headers });
    }

    /**
     * Executes a DELETE request.
     * @template T
     * @param {string} route
     * @param {any} [body]
     * @param {Record<string, string>} [headers]
     * @returns {Promise<T>}
     */
    protected delete<T>(route: string, body?: any, headers?: Record<string, string>): Promise<T> {
        return this.request<T>('DELETE', route, { body, headers });
    }

    /**
     * Called after a successful response to allow custom processing.
     * Can be overridden in child classes.
     * @template T
     * @param {Response} response
     * @returns {Promise<T>}
     */
    protected async onResponse<T>(response: Response): Promise<T> {
        if (response.statusText.toLowerCase() === "no content") return;
        return await response.json();
    }
}

/**
 * @typedef {Object} RequestOption
 * @property {any} [body] - Request body (for POST/PUT/DELETE).
 * @property {FormData} [formData] - Optional form data.
 * @property {Record<string, string>} [headers] - Additional headers.
 * @property {Record<string, string | number | boolean>} [queryParams] - Query params for GET.
 * @property {number} [timeout] - Timeout in milliseconds (default: 8000).
 */
type RequestOption = {
    body?: any;
    formData?: FormData;
    headers?: Record<string, string>;
    queryParams?: Record<string, string | number | boolean>;
    timeout?: number;
};
