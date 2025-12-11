import { logger } from "@/utils/logger";
import { AppError, ErrorType } from "@/utils/errorUtils";

type RequestOptions = {
  headers?: Record<string, string>;
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

type FetchOptions = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

/**
 * Centralized API client for making HTTP requests
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(
    baseUrl: string = "",
    defaultHeaders: Record<string, string> = {}
  ) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || "";
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...defaultHeaders,
    };
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: "GET",
      headers: { ...this.defaultHeaders, ...options.headers },
      cache: options.cache,
      next: options.next,
    });
  }

  /**
   * Make a POST request
   */
  async post<T>(
    endpoint: string,
    data: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      headers: { ...this.defaultHeaders, ...options.headers },
      body: JSON.stringify(data),
      cache: options.cache,
      next: options.next,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T>(
    endpoint: string,
    data: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      headers: { ...this.defaultHeaders, ...options.headers },
      body: JSON.stringify(data),
      cache: options.cache,
      next: options.next,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      headers: { ...this.defaultHeaders, ...options.headers },
      cache: options.cache,
      next: options.next,
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(
    endpoint: string,
    data: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      headers: { ...this.defaultHeaders, ...options.headers },
      body: JSON.stringify(data),
      cache: options.cache,
      next: options.next,
    });
  }

  /**
   * Make a generic request
   */
  private async request<T>(
    endpoint: string,
    options: FetchOptions
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const startTime = performance.now();

    try {
      const response = await fetch(url, options);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log request details in development
      if (process.env.NODE_ENV === "development") {
        logger.debug(
          `API ${options.method} ${endpoint} - ${duration.toFixed(2)}ms`
        );
      }

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle empty responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error(`API request failed: ${endpoint}`, error);
      throw new AppError(
        "Failed to complete request. Please check your connection and try again.",
        ErrorType.NETWORK,
        { endpoint, method: options.method }
      );
    }
  }

  /**
   * Build the full URL for the request
   */
  private buildUrl(endpoint: string): string {
    // If the endpoint is already a full URL, return it
    if (endpoint.startsWith("http")) {
      return endpoint;
    }

    // Make sure there's a leading slash on the endpoint
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    return `${this.baseUrl}${normalizedEndpoint}`;
  }

  /**
   * Handle error responses with appropriate error types
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: "An unexpected error occurred" };
    }

    const message =
      errorData.message || `Request failed with status ${response.status}`;

    let errorType: ErrorType;
    switch (response.status) {
      case 400:
        errorType = ErrorType.VALIDATION;
        break;
      case 401:
        errorType = ErrorType.AUTHENTICATION;
        break;
      case 403:
        errorType = ErrorType.AUTHORIZATION;
        break;
      case 404:
        errorType = ErrorType.NOT_FOUND;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = ErrorType.SERVER;
        break;
      default:
        errorType = ErrorType.UNKNOWN;
    }

    throw new AppError(message, errorType, {
      status: response.status,
      url: response.url,
      ...errorData,
    });
  }
}

// Create and export a default instance
export const apiClient = new ApiClient();

// Export a function to create custom instances
export function createApiClient(
  baseUrl: string,
  headers: Record<string, string> = {}
) {
  return new ApiClient(baseUrl, headers);
}
