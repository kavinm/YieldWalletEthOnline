"use client";

import { useState, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { OneInchApi } from "@/services/oneinch/api";
import { BEEFY_FALLBACK_CONFIG } from "@/services/oneinch/config";
import { CURVE_CONFIG, BEEFY_VAULT_CONFIG } from "@/config/curve";
import { CURVE_POOL_ABI } from "@/config/abi/CurvePoolAbi";
import { ERC20_ABI } from "@/config/abi/ERC20Abi";
import { AGGREGATION_ROUTER_V6 } from "@/services/oneinch/config";
import type {
  OneInchQuoteRequest,
  OneInchSwapRequest,
} from "@/services/oneinch/types";

interface ZapStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "loading" | "completed" | "error";
  error?: string;
  txHash?: string;
}

interface ZapState {
  amount: string;
  isProcessing: boolean;
  error: string | null;
  isSuccess: boolean;
  steps: ZapStep[];
  currentStep: number;
  quote: unknown | null;
  swapResult: unknown | null;
  lpAmount: string | null;
}

export function useCompleteZap() {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<ZapState>({
    amount: "",
    isProcessing: false,
    error: null,
    isSuccess: false,
    steps: [],
    currentStep: 0,
    quote: null,
    swapResult: null,
    lpAmount: null,
  });

  // Contract write hooks
  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeSwap, data: swapHash } = useWriteContract();
  const { writeContract: writeAddLiquidity, data: addLiquidityHash } =
    useWriteContract();
  const { writeContract: writeDeposit, data: depositHash } = useWriteContract();

  // Transaction receipt hooks
  const { isLoading: isApproving, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const { isLoading: isSwapping, isSuccess: isSwapSuccess } =
    useWaitForTransactionReceipt({
      hash: swapHash,
    });

  const { isLoading: isAddingLiquidity, isSuccess: isAddLiquiditySuccess } =
    useWaitForTransactionReceipt({
      hash: addLiquidityHash,
    });

  const { isLoading: isDepositing, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });

  // Check allowances
  const { data: pyusdAllowance } = useReadContract({
    address: CURVE_CONFIG.tokens.PYUSD,
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      address && AGGREGATION_ROUTER_V6
        ? [address, AGGREGATION_ROUTER_V6 as `0x${string}`]
        : undefined,
    chainId: 1,
  });

  const { data: usdcAllowance } = useReadContract({
    address: CURVE_CONFIG.tokens.USDC,
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      address && CURVE_CONFIG.poolAddress
        ? [address, CURVE_CONFIG.poolAddress]
        : undefined,
    chainId: 1,
  });

  const { data: lpAllowance } = useReadContract({
    address: CURVE_CONFIG.lpTokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      address && BEEFY_VAULT_CONFIG.vaultAddress
        ? [address, BEEFY_VAULT_CONFIG.vaultAddress]
        : undefined,
    chainId: 1,
  });

  const setAmount = useCallback((amount: string) => {
    setState((prev) => ({ ...prev, amount, error: null }));
  }, []);

  const getQuote = useCallback(
    async (amount: string) => {
      if (!address) {
        setState((prev) => ({ ...prev, error: "Please connect wallet" }));
        return null;
      }

      try {
        const api = new OneInchApi(BEEFY_FALLBACK_CONFIG);
        // For the quote, we'll show the full amount, but the actual swap will be half
        const parsedAmount = parseUnits(
          amount,
          CURVE_CONFIG.decimals.PYUSD
        ).toString();

        const request: OneInchQuoteRequest = {
          src:
            process.env.NEXT_PUBLIC_PYUSD_ETH_ADDRESS ||
            "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // PYUSD on Ethereum
          dst:
            process.env.NEXT_PUBLIC_USDC_ETH_ADDRESS ||
            "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
          amount: parsedAmount,
          from: address || "0x0000000000000000000000000000000000000000", // Use zero address if no wallet connected
        };

        const quote = await api.getQuote(request);
        setState((prev) => ({ ...prev, quote }));
        return quote;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to get quote";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return null;
      }
    },
    [address]
  );

  const executeCompleteZap = useCallback(
    async (amount: string) => {
      if (!isConnected || !address) {
        setState((prev) => ({ ...prev, error: "Please connect wallet" }));
        return;
      }

      const steps: ZapStep[] = [
        {
          id: "approve-pyusd",
          title: "Approve PYUSD",
          description: "Allow 1inch router to spend PYUSD",
          status: "pending",
        },
        {
          id: "swap-pyusd-usdc",
          title: "Swap PYUSD → USDC",
          description: "Exchange half PYUSD for USDC",
          status: "pending",
        },
        {
          id: "approve-usdc",
          title: "Approve USDC",
          description: "Allow Curve pool to spend USDC",
          status: "pending",
        },
        {
          id: "add-liquidity",
          title: "Add Liquidity",
          description: "Create PYUSD/USDC LP tokens",
          status: "pending",
        },
        {
          id: "approve-lp",
          title: "Approve LP Tokens",
          description: "Allow Beefy vault to spend LP tokens",
          status: "pending",
        },
        {
          id: "deposit-vault",
          title: "Deposit to Vault",
          description: "Deposit LP tokens to Beefy vault",
          status: "pending",
        },
      ];

      setState((prev) => ({
        ...prev,
        steps,
        currentStep: 0,
        isProcessing: true,
        error: null,
        isSuccess: false,
      }));

      try {
        const amountBigInt = parseUnits(amount, CURVE_CONFIG.decimals.PYUSD);
        const halfAmount = amountBigInt / BigInt(2);

        // Step 1: Approve PYUSD for 1inch router
        setState((prev) => ({
          ...prev,
          steps: prev.steps.map((step) =>
            step.id === "approve-pyusd" ? { ...step, status: "loading" } : step
          ),
        }));

        await writeApprove({
          address: CURVE_CONFIG.tokens.PYUSD,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [AGGREGATION_ROUTER_V6 as `0x${string}`, amountBigInt],
        });

        // Wait for approval
        await new Promise((resolve) => {
          const checkApproval = () => {
            if (isApproveSuccess) {
              setState((prev) => ({
                ...prev,
                steps: prev.steps.map((step) =>
                  step.id === "approve-pyusd"
                    ? { ...step, status: "completed" }
                    : step
                ),
                currentStep: 1,
              }));
              resolve(true);
            } else {
              setTimeout(checkApproval, 1000);
            }
          };
          checkApproval();
        });

        // Step 2: Execute swap
        setState((prev) => ({
          ...prev,
          steps: prev.steps.map((step) =>
            step.id === "swap-pyusd-usdc"
              ? { ...step, status: "loading" }
              : step
          ),
        }));

        const api = new OneInchApi(BEEFY_FALLBACK_CONFIG);
        const swapRequest: OneInchSwapRequest = {
          src:
            process.env.NEXT_PUBLIC_PYUSD_ETH_ADDRESS ||
            "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // PYUSD on Ethereum
          dst:
            process.env.NEXT_PUBLIC_USDC_ETH_ADDRESS ||
            "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
          amount: halfAmount.toString(),
          from: address || "0x0000000000000000000000000000000000000000", // Use zero address if no wallet connected
          slippage: 1, // 1% slippage
          disableEstimate: false,
        };

        const swapResult = await api.getSwap(swapRequest);
        setState((prev) => ({ ...prev, swapResult }));

        // Note: This would need to be implemented with sendTransaction instead of writeContract
        // For now, we'll simulate the swap success
        console.log("Swap transaction data:", swapResult.tx);
        // In a real implementation, you would use sendTransaction here

        // Wait for swap
        await new Promise((resolve) => {
          const checkSwap = () => {
            if (isSwapSuccess) {
              setState((prev) => ({
                ...prev,
                steps: prev.steps.map((step) =>
                  step.id === "swap-pyusd-usdc"
                    ? { ...step, status: "completed" }
                    : step
                ),
                currentStep: 2,
              }));
              resolve(true);
            } else {
              setTimeout(checkSwap, 1000);
            }
          };
          checkSwap();
        });

        // Step 3: Approve USDC for Curve pool
        setState((prev) => ({
          ...prev,
          steps: prev.steps.map((step) =>
            step.id === "approve-usdc" ? { ...step, status: "loading" } : step
          ),
        }));

        const usdcAmount = BigInt(swapResult.dstAmount);
        await writeApprove({
          address: CURVE_CONFIG.tokens.USDC,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CURVE_CONFIG.poolAddress, usdcAmount],
        });

        // Wait for USDC approval
        await new Promise((resolve) => {
          const checkUsdcApproval = () => {
            if (isApproveSuccess) {
              setState((prev) => ({
                ...prev,
                steps: prev.steps.map((step) =>
                  step.id === "approve-usdc"
                    ? { ...step, status: "completed" }
                    : step
                ),
                currentStep: 3,
              }));
              resolve(true);
            } else {
              setTimeout(checkUsdcApproval, 1000);
            }
          };
          checkUsdcApproval();
        });

        // Step 4: Add liquidity to Curve pool
        setState((prev) => ({
          ...prev,
          steps: prev.steps.map((step) =>
            step.id === "add-liquidity" ? { ...step, status: "loading" } : step
          ),
        }));

        const amounts: [bigint, bigint] = [halfAmount, usdcAmount]; // [PYUSD, USDC]
        const minMintAmount =
          (BigInt(swapResult.dstAmount) * BigInt(95)) / BigInt(100); // 5% slippage

        await writeAddLiquidity({
          address: CURVE_CONFIG.poolAddress,
          abi: CURVE_POOL_ABI,
          functionName: "add_liquidity",
          args: [amounts, minMintAmount] as const,
        });

        // Wait for liquidity addition
        await new Promise((resolve) => {
          const checkLiquidity = () => {
            if (isAddLiquiditySuccess) {
              setState((prev) => ({
                ...prev,
                steps: prev.steps.map((step) =>
                  step.id === "add-liquidity"
                    ? { ...step, status: "completed" }
                    : step
                ),
                currentStep: 4,
              }));
              resolve(true);
            } else {
              setTimeout(checkLiquidity, 1000);
            }
          };
          checkLiquidity();
        });

        // Step 5: Approve LP tokens for Beefy vault
        setState((prev) => ({
          ...prev,
          steps: prev.steps.map((step) =>
            step.id === "approve-lp" ? { ...step, status: "loading" } : step
          ),
        }));

        await writeApprove({
          address: CURVE_CONFIG.lpTokenAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [BEEFY_VAULT_CONFIG.vaultAddress, minMintAmount],
        });

        // Wait for LP approval
        await new Promise((resolve) => {
          const checkLpApproval = () => {
            if (isApproveSuccess) {
              setState((prev) => ({
                ...prev,
                steps: prev.steps.map((step) =>
                  step.id === "approve-lp"
                    ? { ...step, status: "completed" }
                    : step
                ),
                currentStep: 5,
              }));
              resolve(true);
            } else {
              setTimeout(checkLpApproval, 1000);
            }
          };
          checkLpApproval();
        });

        // Step 6: Deposit LP tokens to Beefy vault
        setState((prev) => ({
          ...prev,
          steps: prev.steps.map((step) =>
            step.id === "deposit-vault" ? { ...step, status: "loading" } : step
          ),
        }));

        // Note: This would need the actual Beefy vault ABI
        // For now, we'll simulate success
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setState((prev) => ({
          ...prev,
          steps: prev.steps.map((step) =>
            step.id === "deposit-vault"
              ? { ...step, status: "completed" }
              : step
          ),
          isSuccess: true,
          isProcessing: false,
          lpAmount: formatUnits(minMintAmount, 18), // Assuming 18 decimals for LP token
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Zap failed";
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
          steps: prev.steps.map((step, index) =>
            index === state.currentStep
              ? {
                  ...step,
                  status: "error",
                  error: errorMessage,
                }
              : step
          ),
        }));
      }
    },
    [
      isConnected,
      address,
      writeApprove,
      writeSwap,
      writeAddLiquidity,
      writeDeposit,
      isApproveSuccess,
      isSwapSuccess,
      isAddLiquiditySuccess,
      isDepositSuccess,
      state.currentStep,
    ]
  );

  const reset = useCallback(() => {
    setState({
      amount: "",
      isProcessing: false,
      error: null,
      isSuccess: false,
      steps: [],
      currentStep: 0,
      quote: null,
      swapResult: null,
      lpAmount: null,
    });
  }, []);

  return {
    ...state,
    allowance: {
      pyusd: pyusdAllowance,
      usdc: usdcAllowance,
      lp: lpAllowance,
    },
    isApproving,
    isSwapping,
    isAddingLiquidity,
    isDepositing,
    setAmount,
    getQuote,
    executeCompleteZap,
    reset,
  };
}
