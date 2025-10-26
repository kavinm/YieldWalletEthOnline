"use client";

import { useState, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";

const PYUSD_ADDRESS = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";
const BEEFY_VAULT_ADDRESS = "0xdA19C56DcDf4fB333acBE9aA18024DD2e4A864Bc";

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
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface DepositState {
  amount: string;
  isApproving: boolean;
  isDepositing: boolean;
  isApproved: boolean;
  error: string | null;
  txHash: string | null;
  isSuccess: boolean;
}

export function useDeposit() {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<DepositState>({
    amount: "",
    isApproving: false,
    isDepositing: false,
    isApproved: false,
    error: null,
    txHash: null,
    isSuccess: false,
  });

  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeDeposit, data: depositHash } = useWriteContract();

  const { isLoading: isApproving, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const { isLoading: isDepositing, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });

  const setAmount = useCallback((amount: string) => {
    setState((prev) => ({ ...prev, amount, error: null }));
  }, []);

  const setMaxAmount = useCallback((maxAmount: string) => {
    setState((prev) => ({ ...prev, amount: maxAmount, error: null }));
  }, []);

  const approve = useCallback(async () => {
    if (!isConnected || !address || !state.amount) {
      setState((prev) => ({
        ...prev,
        error: "Please connect wallet and enter amount",
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isApproving: true, error: null }));

      const amount = parseUnits(state.amount, 6); // PYUSD has 6 decimals

      await writeApprove({
        address: PYUSD_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [BEEFY_VAULT_ADDRESS as `0x${string}`, amount],
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isApproving: false,
        error: error instanceof Error ? error.message : "Approval failed",
      }));
    }
  }, [isConnected, address, state.amount, writeApprove]);

  const deposit = useCallback(async () => {
    if (!isConnected || !address || !state.amount) {
      setState((prev) => ({
        ...prev,
        error: "Please connect wallet and enter amount",
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isDepositing: true, error: null }));

      const amount = parseUnits(state.amount, 6); // PYUSD has 6 decimals

      await writeDeposit({
        address: BEEFY_VAULT_ADDRESS as `0x${string}`,
        abi: STANDARD_VAULT_ABI,
        functionName: "deposit",
        args: [amount],
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isDepositing: false,
        error: error instanceof Error ? error.message : "Deposit failed",
      }));
    }
  }, [isConnected, address, state.amount, writeDeposit]);

  const depositAll = useCallback(async () => {
    if (!isConnected || !address) {
      setState((prev) => ({ ...prev, error: "Please connect wallet" }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isDepositing: true, error: null }));

      await writeDeposit({
        address: BEEFY_VAULT_ADDRESS as `0x${string}`,
        abi: STANDARD_VAULT_ABI,
        functionName: "depositAll",
        args: [],
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isDepositing: false,
        error: error instanceof Error ? error.message : "Deposit failed",
      }));
    }
  }, [isConnected, address, writeDeposit]);

  const reset = useCallback(() => {
    setState({
      amount: "",
      isApproving: false,
      isDepositing: false,
      isApproved: false,
      error: null,
      txHash: null,
      isSuccess: false,
    });
  }, []);

  return {
    ...state,
    isApproving: state.isApproving || isApproving,
    isDepositing: state.isDepositing || isDepositing,
    isApproveSuccess,
    isDepositSuccess,
    setAmount,
    setMaxAmount,
    approve,
    deposit,
    depositAll,
    reset,
  };
}
