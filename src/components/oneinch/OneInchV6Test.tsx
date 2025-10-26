"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOneInchSwapV6 } from "@/hooks/useOneInchSwapV6";
import { TOKEN_ADDRESSES } from "@/services/oneinch/config";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function OneInchV6Test() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("100");
  const [slippage, setSlippage] = useState(1);

  const {
    quote,
    swapResult,
    isLoading,
    error,
    allowance,
    isApproving,
    isSwapping,
    isApproveSuccess,
    isSwapSuccess,
    getQuote,
    getSwapTransaction,
    approveToken,
    executeSwap,
    reset,
  } = useOneInchSwapV6();

  const handleGetQuote = async () => {
    await getQuote(
      process.env.NEXT_PUBLIC_PYUSD_ETH_ADDRESS ||
        "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // PYUSD on Ethereum
      process.env.NEXT_PUBLIC_USDC_ETH_ADDRESS ||
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
      amount,
      6 // PYUSD decimals
    );
  };

  const handleGetSwap = async () => {
    await getSwapTransaction(
      process.env.NEXT_PUBLIC_PYUSD_ETH_ADDRESS ||
        "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // PYUSD on Ethereum
      process.env.NEXT_PUBLIC_USDC_ETH_ADDRESS ||
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
      amount,
      slippage,
      6
    );
  };

  const handleApprove = async () => {
    await approveToken(
      process.env.NEXT_PUBLIC_PYUSD_ETH_ADDRESS ||
        "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
      amount,
      6
    ); // PYUSD on Ethereum
  };

  const handleExecuteSwap = async () => {
    if (swapResult) {
      await executeSwap(swapResult);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect Your Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please connect your wallet to test 1inch v6.1 integration.</p>
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
        <CardTitle>1inch v6.1 Integration Test</CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the complete 1inch v6.1 swap flow with PYUSD → USDC
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (PYUSD)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slippage">Slippage (%)</Label>
            <Input
              id="slippage"
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value))}
              placeholder="1"
              min="0.1"
              max="10"
              step="0.1"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Current Allowance:</h3>
          <p className="text-sm text-muted-foreground">
            {allowance ? allowance.toString() : "Loading..."} PYUSD
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleGetQuote} disabled={isLoading}>
            {isLoading ? "Getting Quote..." : "Get Quote"}
          </Button>
          <Button onClick={handleGetSwap} disabled={isLoading || !quote}>
            {isLoading ? "Getting Swap..." : "Get Swap Tx"}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isApproving || isApproveSuccess}
            variant="outline"
          >
            {isApproving
              ? "Approving..."
              : isApproveSuccess
              ? "Approved ✅"
              : "Approve"}
          </Button>
          <Button
            onClick={handleExecuteSwap}
            disabled={isSwapping || isSwapSuccess || !swapResult}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSwapping
              ? "Swapping..."
              : isSwapSuccess
              ? "Swapped ✅"
              : "Execute Swap"}
          </Button>
          <Button onClick={reset} variant="destructive">
            Reset
          </Button>
        </div>

        {quote && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-semibold text-blue-800 mb-2">Quote Result:</h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>From:</strong> {amount} PYUSD
              </p>
              <p>
                <strong>To:</strong> {quote.dstAmount} USDC
              </p>
              <p>
                <strong>Provider:</strong> 1inch v6.1
              </p>
            </div>
          </div>
        )}

        {swapResult && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-semibold text-green-800 mb-2">
              Swap Transaction:
            </h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>To:</strong> {swapResult.tx.to}
              </p>
              <p>
                <strong>Value:</strong> {swapResult.tx.value} ETH
              </p>
              <p>
                <strong>Data:</strong> {swapResult.tx.data.substring(0, 20)}...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> This test uses 1inch API v6.1 with proper
            authentication.
          </p>
          <p>
            <strong>Required:</strong> Set NEXT_PUBLIC_1INCH_API_KEY in your
            .env.local file.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
