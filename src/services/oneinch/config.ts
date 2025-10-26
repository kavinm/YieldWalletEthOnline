import { OneInchConfig } from "./types";

// 1inch API v6.1 configuration for Ethereum mainnet
export const ONEINCH_CONFIG: OneInchConfig = {
  apiUrl: `https://api.1inch.dev/swap/v6.1/${
    process.env.NEXT_PUBLIC_CHAIN_ID || 1
  }`, // 1inch API v6.1 for Ethereum
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1"), // Ethereum mainnet
  fee: 0.0005, // 0.05% fee
  apiKey: process.env.NEXT_PUBLIC_1INCH_API_KEY || "", // Add your 1inch API key
};

// Fallback configuration using Beefy's proxy (no API key required)
export const BEEFY_FALLBACK_CONFIG: OneInchConfig = {
  apiUrl: "https://api.beefy.finance/zap/providers/oneinch/ethereum",
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1"),
  fee: 0.0005,
};

// Aggregation Router V6 address for Ethereum
export const AGGREGATION_ROUTER_V6 =
  "0x111111125421ca6dc452d289314280a0f8842a65";

// Use Beefy's proxy API as fallback (to avoid CORS issues)
export const BEEFY_PROXY_CONFIG: OneInchConfig = {
  apiUrl: "https://api.beefy.finance/zap/providers/oneinch/ethereum",
  chainId: 1,
  fee: 0.0005,
};

// Token addresses for Ethereum mainnet (using environment variables)
export const TOKEN_ADDRESSES = {
  ETH: "0x0000000000000000000000000000000000000000",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Ethereum WETH
  USDC:
    process.env.NEXT_PUBLIC_USDC_ETH_ADDRESS ||
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum USDC
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  PYUSD:
    process.env.NEXT_PUBLIC_PYUSD_ETH_ADDRESS ||
    "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // Ethereum PYUSD
} as const;
