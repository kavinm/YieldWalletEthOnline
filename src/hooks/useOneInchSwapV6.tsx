"use client";

import { useState, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { SmartOneInchApi } from "@/services/oneinch/smartApi";
import {
  AGGREGATION_ROUTER_V6,
  TOKEN_ADDRESSES,
} from "@/services/oneinch/config";
import { ERC20_ABI } from "@/config/abi/ERC20Abi";
import type {
  OneInchQuoteRequest,
  OneInchSwapRequest,
} from "@/services/oneinch/types";

interface OneInchSwapState {
  quote: unknown | null;
  swapResult: unknown | null;
  isLoading: boolean;
  error: string | null;
  allowance: bigint | null;
  isApproving: boolean;
  isSwapping: boolean;
}

export function useOneInchSwapV6() {
  const { address, chainId } = useAccount();
  const [state, setState] = useState<OneInchSwapState>({
    quote: null,
    swapResult: null,
    isLoading: false,
    error: null,
    allowance: null,
    isApproving: false,
    isSwapping: false,
  });

  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeSwap, data: swapHash } = useWriteContract();

  const { isLoading: isApproving, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const { isLoading: isSwapping, isSuccess: isSwapSuccess } =
    useWaitForTransactionReceipt({
      hash: swapHash,
    });

  // Check allowance
  const { data: allowance } = useReadContract({
    address: (process.env.NEXT_PUBLIC_PYUSD_ETH_ADDRESS ||
      "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8") as `0x${string}`, // PYUSD on Ethereum
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      address && AGGREGATION_ROUTER_V6
        ? [address, AGGREGATION_ROUTER_V6 as `0x${string}`]
        : undefined,
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1"), // Ethereum mainnet
  });

  const getQuote = useCallback(
    async (
      fromToken: string,
      toToken: string,
      amount: string,
      decimals: number = 18
    ) => {
      if (!address) {
        setState((prev) => ({ ...prev, error: "Please connect wallet" }));
        return null;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const api = new SmartOneInchApi();
        const parsedAmount = parseUnits(amount, decimals).toString();

        const request: OneInchQuoteRequest = {
          src: fromToken,
          dst: toToken,
          amount: parsedAmount,
          from: address, // Required for 1inch API
        };

        const quote = await api.getQuote(request);
        setState((prev) => ({ ...prev, quote, isLoading: false }));
        return quote;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to get quote";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        return null;
      }
    },
    [address]
  );

  const getSwapTransaction = useCallback(
    async (
      fromToken: string,
      toToken: string,
      amount: string,
      slippage: number,
      decimals: number = 18
    ) => {
      if (!address) {
        setState((prev) => ({ ...prev, error: "Please connect wallet" }));
        return null;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const api = new SmartOneInchApi();
        const parsedAmount = parseUnits(amount, decimals).toString();

        const request: OneInchSwapRequest = {
          src: fromToken,
          dst: toToken,
          amount: parsedAmount,
          from: address,
          slippage: slippage,
          disableEstimate: false,
        };

        const swapResult = await api.getSwap(request);
        setState((prev) => ({ ...prev, swapResult, isLoading: false }));
        return swapResult;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to get swap transaction";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        return null;
      }
    },
    [address]
  );

  const approveToken = useCallback(
    async (tokenAddress: string, amount: string, decimals: number = 18) => {
      if (!address) {
        setState((prev) => ({ ...prev, error: "Please connect wallet" }));
        return;
      }

      setState((prev) => ({ ...prev, isApproving: true, error: null }));

      try {
        const parsedAmount = parseUnits(amount, decimals);

        await writeApprove({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [AGGREGATION_ROUTER_V6 as `0x${string}`, parsedAmount],
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Approval failed";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isApproving: false,
        }));
      }
    },
    [address, writeApprove]
  );

  const executeSwap = useCallback(
    async (swapTx: unknown) => {
      if (!address) {
        setState((prev) => ({ ...prev, error: "Please connect wallet" }));
        return;
      }

      setState((prev) => ({ ...prev, isSwapping: true, error: null }));

      try {
        // For 1inch swaps, we need to use sendTransaction instead of writeContract
        // This is a placeholder - in a real implementation, you'd use sendTransaction
        console.log("Swap transaction data:", swapTx.tx);
        throw new Error(
          "Swap execution not implemented - use sendTransaction for 1inch swaps"
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Swap failed";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isSwapping: false,
        }));
      }
    },
    [address, writeSwap]
  );

  const checkTokenPairSupport = useCallback(
    async (fromToken: string, toToken: string): Promise<boolean> => {
      try {
        // Try to get a small quote to check if the pair is supported
        const quote = await getQuote(fromToken, toToken, "1", 18);
        return quote !== null;
      } catch {
        return false;
      }
    },
    [getQuote]
  );

  const getGasPrice = useCallback(async () => {
    try {
      const api = new SmartOneInchApi();
      return await api.getGasPrice();
    } catch (error) {
      throw new Error(
        `Failed to get gas price: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      quote: null,
      swapResult: null,
      isLoading: false,
      error: null,
      allowance: null,
      isApproving: false,
      isSwapping: false,
    });
  }, []);

  return {
    ...state,
    allowance,
    isApproving: isApproving || state.isApproving,
    isSwapping: isSwapping || state.isSwapping,
    isApproveSuccess,
    isSwapSuccess,
    getQuote,
    getSwapTransaction,
    approveToken,
    executeSwap,
    checkTokenPairSupport,
    getGasPrice,
    reset,
  };
}
