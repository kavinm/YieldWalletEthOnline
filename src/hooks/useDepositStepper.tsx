"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
// Note: Zap functionality removed - using direct 1inch integration instead

const PYUSD_ADDRESS =
  process.env.NEXT_PUBLIC_PYUSD_ETH_ADDRESS ||
  "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";
const BEEFY_VAULT_ADDRESS =
  process.env.NEXT_PUBLIC_BEEFY_VAULT_ADDRESS ||
  "0xdA19C56DcDf4fB333acBE9aA18024DD2e4A864Bc";

// Standard Vault ABI for deposit functionality
const STANDARD_VAULT_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "depositAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ERC20 ABI for approvals
const ERC20_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export interface Step {
  id: string;
  title: string;
  description: string;
  status: "pending" | "loading" | "completed" | "error";
  error?: string;
}

export interface DepositStepperState {
  amount: string;
  steps: Step[];
  currentStep: number;
  isProcessing: boolean;
  error: string | null;
  isSuccess: boolean;
}

export function useDepositStepper() {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<DepositStepperState>({
    amount: "",
    steps: [],
    currentStep: 0,
    isProcessing: false,
    error: null,
    isSuccess: false,
  });

  // Note: Zap functionality has been removed
  // Use direct 1inch integration via OneInchV6Test component instead

  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeDeposit, data: depositHash } = useWriteContract();

  const {
    isLoading: isApproving,
    isSuccess: isApproveSuccess,
    error: approveError,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const {
    isLoading: isDepositing,
    isSuccess: isDepositSuccess,
    error: depositError,
  } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Update steps based on transaction status
  useEffect(() => {
    if (state.steps.length === 0) return;

    setState((prev) => {
      const newSteps = [...prev.steps];

      // Update approval step
      if (newSteps[0]) {
        if (isApproving) {
          newSteps[0] = { ...newSteps[0], status: "loading" };
        } else if (isApproveSuccess) {
          newSteps[0] = { ...newSteps[0], status: "completed" };
        } else if (approveError) {
          newSteps[0] = {
            ...newSteps[0],
            status: "error",
            error: approveError.message || "Approval failed",
          };
        }
      }

      // Update deposit step
      if (newSteps[1]) {
        if (isDepositing) {
          newSteps[1] = { ...newSteps[1], status: "loading" };
        } else if (isDepositSuccess) {
          newSteps[1] = { ...newSteps[1], status: "completed" };
          return {
            ...prev,
            steps: newSteps,
            isSuccess: true,
            isProcessing: false,
          };
        } else if (depositError) {
          newSteps[1] = {
            ...newSteps[1],
            status: "error",
            error: depositError.message || "Deposit failed",
          };
        }
      }

      return { ...prev, steps: newSteps };
    });
  }, [
    isApproving,
    isApproveSuccess,
    approveError,
    isDepositing,
    isDepositSuccess,
    depositError,
    state.steps.length,
  ]);

  // Note: Automatic execution is now handled by the zap functionality
  // No need for separate approval -> deposit flow since zap handles everything

  const setAmount = useCallback((amount: string) => {
    setState((prev) => ({ ...prev, amount, error: null }));
  }, []);

  const setMaxAmount = useCallback((maxAmount: string) => {
    setState((prev) => ({ ...prev, amount: maxAmount, error: null }));
  }, []);

  const startDepositFlow = useCallback(
    async (amount: string, isMaxDeposit = false) => {
      if (!isConnected || !address) {
        setState((prev) => ({ ...prev, error: "Please connect wallet" }));
        return;
      }

      // For LP vaults, we need to use zap functionality
      // The current vault (0xdA19C56DcDf4fB333acBE9aA18024DD2e4A864Bc) is a PYUSD/USDC LP vault
      // which requires LP tokens, not raw PYUSD tokens

      setState((prev) => ({
        ...prev,
        amount,
        isProcessing: true,
        error: null,
        isSuccess: false,
      }));

      try {
        // Note: Zap functionality has been removed
        // For now, this will show an error message
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error:
            "Zap functionality has been removed. Please use the 1inch v6.1 integration test component below.",
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error instanceof Error ? error.message : "Deposit failed",
        }));
      }
    },
    [isConnected, address]
  );

  // executeDeposit is no longer needed since we're using zap functionality

  const retryStep = useCallback(async (stepId: string) => {
    // Note: Zap functionality has been removed
    console.log("Retry step:", stepId);
  }, []);

  const reset = useCallback(() => {
    setState({
      amount: "",
      steps: [],
      currentStep: 0,
      isProcessing: false,
      error: null,
      isSuccess: false,
    });
  }, []);

  return {
    ...state,
    isApproveSuccess,
    isDepositSuccess,
    setAmount,
    setMaxAmount,
    startDepositFlow,
    retryStep,
    reset,
  };
}
