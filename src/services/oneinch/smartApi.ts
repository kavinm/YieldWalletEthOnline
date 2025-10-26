import { OneInchApi } from "./api";
import { ONEINCH_CONFIG, BEEFY_FALLBACK_CONFIG } from "./config";
import type {
  OneInchQuoteRequest,
  OneInchQuoteResponse,
  OneInchSwapRequest,
  OneInchSwapResponse,
} from "./types";

export class SmartOneInchApi {
  private primaryApi: OneInchApi;
  private fallbackApi: OneInchApi;

  constructor() {
    this.primaryApi = new OneInchApi(ONEINCH_CONFIG);
    this.fallbackApi = new OneInchApi(BEEFY_FALLBACK_CONFIG);
  }

  private async tryWithFallback<T>(
    primaryCall: () => Promise<T>,
    fallbackCall: () => Promise<T>
  ): Promise<T> {
    try {
      console.log("Trying primary 1inch API...");
      return await primaryCall();
    } catch (error) {
      console.warn("Primary API failed, trying fallback:", error);
      try {
        console.log("Trying fallback Beefy proxy API...");
        return await fallbackCall();
      } catch (fallbackError) {
        console.error("Both APIs failed:", {
          primary: error,
          fallback: fallbackError,
        });
        throw new Error(
          `Both 1inch APIs failed. Primary: ${
            error instanceof Error ? error.message : "Unknown error"
          }. Fallback: ${
            fallbackError instanceof Error
              ? fallbackError.message
              : "Unknown error"
          }`
        );
      }
    }
  }

  async getQuote(request: OneInchQuoteRequest): Promise<OneInchQuoteResponse> {
    return this.tryWithFallback(
      () => this.primaryApi.getQuote(request),
      () => this.fallbackApi.getQuote(request)
    );
  }

  async getSwap(request: OneInchSwapRequest): Promise<OneInchSwapResponse> {
    return this.tryWithFallback(
      () => this.primaryApi.getSwap(request),
      () => this.fallbackApi.getSwap(request)
    );
  }

  async getTokens(): Promise<Record<string, unknown>> {
    return this.tryWithFallback(
      () => this.primaryApi.getTokens(),
      () => this.fallbackApi.getTokens()
    );
  }

  async getProtocols(): Promise<unknown> {
    return this.tryWithFallback(
      () => this.primaryApi.getProtocols(),
      () => this.fallbackApi.getProtocols()
    );
  }

  async getGasPrice(): Promise<{
    standard: number;
    fast: number;
    instant: number;
  }> {
    return this.tryWithFallback(
      () => this.primaryApi.getGasPrice(),
      () => this.fallbackApi.getGasPrice()
    );
  }
}
