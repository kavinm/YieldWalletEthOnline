export interface OneInchQuoteRequest {
  src: string; // Source token address
  dst: string; // Destination token address
  amount: string; // Amount in wei
  from?: string; // User address (optional for quotes)
  fee?: string; // Optional fee
}

export interface OneInchQuoteToken {
  address: string;
  decimals: number;
  logoURI: string;
  name: string;
  symbol: string;
  tags: string[];
}

export interface OneInchQuoteResponse {
  srcToken: OneInchQuoteToken;
  dstToken: OneInchQuoteToken;
  srcAmount: string; // Source amount in wei
  dstAmount: string; // Destination amount in wei
}

export interface OneInchSwapRequest {
  src: string; // Source token address
  dst: string; // Destination token address
  amount: string; // Amount in wei
  from: string; // User address
  slippage: number; // Slippage percentage (e.g., 1 for 1%)
  fee?: string; // Optional fee
  referrer?: string; // Optional referrer address
  disableEstimate?: boolean; // Disable gas estimation
}

export interface OneInchSwapTx {
  from: string;
  to: string;
  data: string;
  value: string;
  gasPrice: string;
  gas: string;
}

export interface OneInchSwapResponse {
  srcToken: OneInchQuoteToken;
  dstToken: OneInchQuoteToken;
  srcAmount: string; // Source amount in wei
  dstAmount: string; // Destination amount in wei
  tx: OneInchSwapTx;
}

export interface OneInchConfig {
  apiUrl: string;
  chainId: number;
  fee: number; // Fee percentage (e.g., 0.0005 for 0.05%)
  apiKey?: string; // Optional API key for authentication
}
