import {
  OneInchQuoteRequest,
  OneInchQuoteResponse,
  OneInchSwapRequest,
  OneInchSwapResponse,
  OneInchConfig,
} from "./types";

export class OneInchApi {
  private config: OneInchConfig;

  constructor(config: OneInchConfig) {
    this.config = config;
  }

  private buildQueryURL(path: string, params: Record<string, string>): string {
    const url = new URL(`${this.config.apiUrl}${path}`);
    url.search = new URLSearchParams(params).toString();
    return url.toString();
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string | number | boolean>
  ): Promise<T> {
    // Convert all params to strings (matching your working code)
    const stringParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      stringParams[key] = value.toString();
    });

    const url = this.buildQueryURL(endpoint, stringParams);

    // Prepare headers (matching your working code)
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    // Add API key if available (matching your working code)
    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `1inch API returned status ${response.status}: ${body}`
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        // Check for specific error types
        if (error.name === "AbortError") {
          throw new Error("Request timeout - please try again");
        }
        if (error.message.includes("Failed to fetch")) {
          throw new Error(
            "Network error - please check your internet connection and try again"
          );
        }
        if (error.message.includes("CORS")) {
          throw new Error("CORS error - please use a different API endpoint");
        }
        throw new Error(`Failed to fetch from 1inch API: ${error.message}`);
      }
      throw new Error("Unknown error occurred while fetching from 1inch API");
    }
  }

  /**
   * Get a quote for swapping tokens (matching your working code)
   */
  async getQuote(request: OneInchQuoteRequest): Promise<OneInchQuoteResponse> {
    return this.makeRequest<OneInchQuoteResponse>("/quote", {
      src: request.src,
      dst: request.dst,
      amount: request.amount,
      from:
        request.from?.toLowerCase() ||
        "0x0000000000000000000000000000000000000000", // Required parameter
      ...(request.fee && { fee: request.fee.toString() }),
    });
  }

  /**
   * Get swap transaction data (matching your working code)
   */
  async getSwap(request: OneInchSwapRequest): Promise<OneInchSwapResponse> {
    return this.makeRequest<OneInchSwapResponse>("/swap", {
      src: request.src,
      dst: request.dst,
      amount: request.amount,
      from: request.from.toLowerCase(), // Ensure lowercase (matching your code)
      slippage: request.slippage.toString(),
      disableEstimate: request.disableEstimate ? "true" : "false",
      allowPartialFill: "false", // Add this parameter from your working code
      ...(request.fee && { fee: request.fee.toString() }),
      ...(request.referrer && { referrer: request.referrer }),
    });
  }

  /**
   * Get supported tokens for the chain
   */
  async getTokens(): Promise<Record<string, unknown>> {
    return this.makeRequest<Record<string, unknown>>("/tokens", {});
  }

  /**
   * Get protocol information
   */
  async getProtocols(): Promise<unknown> {
    return this.makeRequest<unknown>("/protocols", {});
  }

  /**
   * Get gas price information
   */
  async getGasPrice(): Promise<{
    standard: number;
    fast: number;
    instant: number;
  }> {
    return this.makeRequest<{
      standard: number;
      fast: number;
      instant: number;
    }>("/gas-price", {});
  }
}
