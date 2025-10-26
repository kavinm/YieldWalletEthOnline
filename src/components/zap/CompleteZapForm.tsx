"use client";

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompleteZap } from "@/hooks/useCompleteZap";
import { formatUnits } from "viem";
import { CURVE_CONFIG, BEEFY_VAULT_CONFIG } from "@/config/curve";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface CompleteZapFormProps {
  onSuccess?: () => void;
}

export default function CompleteZapForm({ onSuccess }: CompleteZapFormProps) {
  const { address, isConnected } = useAccount();
  const [isMaxClicked, setIsMaxClicked] = useState(false);

  const { data: pyusdBalance, isLoading: isBalanceLoading } = useBalance({
    address: address,
    token: CURVE_CONFIG.tokens.PYUSD as `0x${string}`,
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1"),
  });

  const {
    amount,
    error,
    isProcessing,
    isSuccess,
    steps,
    currentStep,
    quote,
    lpAmount,
    allowance,
    setAmount,
    getQuote,
    executeCompleteZap,
    reset,
  } = useCompleteZap();

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
      setAmount(maxAmount);
      setIsMaxClicked(true);
    }
  };

  const handleGetQuote = async () => {
    if (amount) {
      await getQuote(amount);
    }
  };

  const handleZap = async () => {
    if (amount) {
      await executeCompleteZap(amount);
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
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Connect Your Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Please connect your wallet to use the complete zap functionality.
          </p>
          <div className="mt-4">
            <ConnectButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Complete Zap: PYUSD → Beefy Vault</CardTitle>
        <p className="text-sm text-muted-foreground">
          Automatically swap PYUSD for USDC, create LP tokens, and deposit to
          Beefy vault
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="flex items-center justify-between">
          <Label htmlFor="balance" className="text-muted-foreground">
            Your PYUSD Balance:
          </Label>
          {isBalanceLoading ? (
            <p className="text-muted-foreground">Loading...</p>
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
          <Label htmlFor="amount">Amount to Zap</Label>
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
                isProcessing ||
                !pyusdBalance ||
                pyusdBalance.value === BigInt(0)
              }
            >
              Max
            </Button>
          </div>
        </div>

        {/* Quote Display */}
        {quote && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-semibold text-blue-800 mb-2">Swap Preview</h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>From:</strong> {formatUnits(BigInt(quote.srcAmount), 6)}{" "}
                PYUSD
              </p>
              <p>
                <strong>To:</strong> {formatUnits(BigInt(quote.dstAmount), 6)}{" "}
                USDC
              </p>
              <p>
                <strong>Provider:</strong> 1inch v6.1
              </p>
              <p className="text-xs text-muted-foreground">
                Note: This shows the full amount quote. The actual zap will swap
                half and use the other half for LP creation.
              </p>
            </div>
          </div>
        )}

        {/* Allowance Display */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="font-semibold text-gray-800 mb-2">
            Current Allowances
          </h4>
          <div className="text-sm space-y-1">
            <p>
              <strong>PYUSD → 1inch:</strong>{" "}
              {allowance.pyusd ? formatUnits(allowance.pyusd, 6) : "0"}
            </p>
            <p>
              <strong>USDC → Curve:</strong>{" "}
              {allowance.usdc ? formatUnits(allowance.usdc, 6) : "0"}
            </p>
            <p>
              <strong>LP → Beefy:</strong>{" "}
              {allowance.lp ? formatUnits(allowance.lp, 18) : "0"}
            </p>
          </div>
        </div>

        {/* Steps Display */}
        {steps.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Zap Progress:</h4>
            <div className="space-y-1">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-3 rounded text-sm ${
                    index === currentStep
                      ? "bg-blue-100 border border-blue-300"
                      : step.status === "completed"
                      ? "bg-green-100 border border-green-300"
                      : step.status === "error"
                      ? "bg-red-100 border border-red-300"
                      : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{step.title}</span>
                    <span className="text-xs">
                      {step.status === "completed" && "✅"}
                      {step.status === "loading" && "⏳"}
                      {step.status === "error" && "❌"}
                      {step.status === "pending" && "⏸️"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                  {step.error && (
                    <p className="text-xs text-red-600 mt-1">{step.error}</p>
                  )}
                  {step.txHash && (
                    <p className="text-xs text-blue-600 mt-1">
                      TX: {step.txHash.substring(0, 10)}...
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {hasInsufficientBalance && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">Insufficient PYUSD balance</p>
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">
              Zap successful! Created {lpAmount} LP tokens and deposited to
              Beefy vault.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleGetQuote}
            disabled={!isAmountValid || hasInsufficientBalance || isProcessing}
            variant="outline"
            className="flex-1"
          >
            Get Quote
          </Button>
          <Button
            onClick={handleZap}
            disabled={!isAmountValid || hasInsufficientBalance || isProcessing}
            className="flex-1"
            size="lg"
          >
            {isProcessing ? "Zapping..." : "Execute Zap"}
          </Button>
        </div>

        {/* Reset Button */}
        {isSuccess && (
          <Button onClick={reset} variant="outline" className="w-full">
            Make Another Zap
          </Button>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Zap Process:</strong> PYUSD → USDC (1inch) → LP tokens
            (Curve) → Beefy vault
          </p>
          <p>
            <strong>Vault:</strong> {BEEFY_VAULT_CONFIG.vaultName} (
            {BEEFY_VAULT_CONFIG.platform})
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
