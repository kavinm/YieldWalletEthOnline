"use client";

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDepositStepper } from "@/hooks/useDepositStepper";
import { formatUnits, parseUnits } from "viem";

const PYUSD_ADDRESS = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";

interface DepositFormProps {
  onSuccess?: () => void;
}

export default function DepositForm({ onSuccess }: DepositFormProps) {
  const { address, isConnected } = useAccount();
  const [isMaxClicked, setIsMaxClicked] = useState(false);

  const { data: pyusdBalance, isLoading: isBalanceLoading } = useBalance({
    address: address,
    token: PYUSD_ADDRESS as `0x${string}`,
    chainId: 1,
  });

  const {
    amount,
    error,
    isProcessing,
    isSuccess,
    setAmount,
    setMaxAmount,
    startDepositFlow,
    reset,
  } = useDepositStepper();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setIsMaxClicked(false);
    }
  };

  const handleMaxClick = () => {
    if (pyusdBalance) {
      const maxAmount = formatUnits(pyusdBalance.value, pyusdBalance.decimals);
      setMaxAmount(maxAmount);
      setIsMaxClicked(true);
    }
  };

  const handleDeposit = async () => {
    if (isMaxClicked && pyusdBalance) {
      // For max deposits, we need to approve the full balance first
      const maxAmount = formatUnits(pyusdBalance.value, pyusdBalance.decimals);
      setMaxAmount(maxAmount);
      await startDepositFlow(maxAmount, true);
    } else {
      await startDepositFlow(amount);
    }
  };

  const isAmountValid = amount && parseFloat(amount) > 0;
  const hasInsufficientBalance =
    pyusdBalance &&
    amount &&
    parseFloat(amount) >
      parseFloat(formatUnits(pyusdBalance.value, pyusdBalance.decimals));

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect Your Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please connect your wallet to start depositing PYUSD.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Deposit PYUSD</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Your PYUSD Balance
          </Label>
          {isBalanceLoading ? (
            <p className="text-muted-foreground">Loading balance...</p>
          ) : (
            <p className="text-2xl font-bold">
              {pyusdBalance
                ? formatUnits(pyusdBalance.value, pyusdBalance.decimals)
                : "0"}{" "}
              PYUSD
            </p>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount to Deposit</Label>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="text"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              disabled={isProcessing}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleMaxClick}
              disabled={
                isProcessing || !pyusdBalance || pyusdBalance.value === 0n
              }
            >
              Max
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Insufficient Balance Warning */}
        {hasInsufficientBalance && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-600">
              Insufficient PYUSD balance
            </p>
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">
              Deposit successful! Your PYUSD has been deposited to the vault.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleDeposit}
            disabled={!isAmountValid || hasInsufficientBalance || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? "Processing..." : "Deposit PYUSD"}
          </Button>
        </div>

        {/* Reset Button */}
        {isSuccess && (
          <Button onClick={reset} variant="outline" className="w-full">
            Make Another Deposit
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
