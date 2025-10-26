import type { Address } from "viem";

// Curve pool configuration for PYUSD/USDC
export const CURVE_CONFIG = {
  // PYUSD/USDC Curve pool on Ethereum mainnet (using environment variables)
  poolAddress: (process.env.NEXT_PUBLIC_CURVE_POOL_ADDRESS ||
    "0xE8B7ED624481D69f43d616Ae4a4C6531D088301F") as Address,
  lpTokenAddress: (process.env.NEXT_PUBLIC_CURVE_POOL_ADDRESS ||
    "0xE8B7ED624481D69f43d616Ae4a4C6531D088301F") as Address, // Same as pool for this pool type

  // Token addresses in the pool (using environment variables)
  tokens: {
    PYUSD: (process.env.NEXT_PUBLIC_PYUSD_ETH_ADDRESS ||
      "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8") as Address,
    USDC: (process.env.NEXT_PUBLIC_USDC_ETH_ADDRESS ||
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48") as Address,
  },

  // Token indices in the pool (0 = PYUSD, 1 = USDC)
  tokenIndices: {
    PYUSD: 0,
    USDC: 1,
  },

  // Decimals
  decimals: {
    PYUSD: 6,
    USDC: 6,
  },

  // Slippage tolerance (0.5%)
  slippage: 0.005,
} as const;

// Beefy vault configuration (using environment variables)
export const BEEFY_VAULT_CONFIG = {
  vaultAddress: (process.env.NEXT_PUBLIC_BEEFY_VAULT_ADDRESS ||
    "0xdA19C56DcDf4fB333acBE9aA18024DD2e4A864Bc") as Address,
  vaultName: "PYUSD/USDC LP Vault",
  platform: "Curve",
} as const;
