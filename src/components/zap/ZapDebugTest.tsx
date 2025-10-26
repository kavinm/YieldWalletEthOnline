"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartOneInchApi } from "@/services/oneinch/smartApi";
import { CURVE_CONFIG } from "@/config/curve";
import { parseUnits } from "viem";

export default function ZapDebugTest() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: string) => {
    setResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const testZapQuote = async () => {
    setIsLoading(true);
    addResult("Testing Complete Zap quote call...");

    try {
      const api = new SmartOneInchApi();
      const amount = "0.1"; // Small amount for testing
      const parsedAmount = parseUnits(
        amount,
        CURVE_CONFIG.decimals.PYUSD
      ).toString();

      const request = {
        src:
          process.env.NEXT_PUBLIC_PYUSD_ETH_ADDRESS ||
          "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // PYUSD on Ethereum
        dst:
          process.env.NEXT_PUBLIC_USDC_ETH_ADDRESS ||
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
        amount: parsedAmount,
        from: "0x0000000000000000000000000000000000000000", // Use zero address for testing
      };

      addResult(`Request: ${JSON.stringify(request)}`);

      const quote = await api.getQuote(request);
      addResult(
        `✅ Zap quote successful: ${JSON.stringify(quote).substring(0, 200)}...`
      );
    } catch (error) {
      addResult(
        `❌ Zap quote failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    setIsLoading(false);
  };

  const testWorkingQuote = async () => {
    setIsLoading(true);
    addResult("Testing working quote call (from OneInchV6Test)...");

    try {
      const api = new SmartOneInchApi();
      const amount = "0.1"; // Small amount for testing
      const parsedAmount = parseUnits(amount, 6).toString(); // PYUSD decimals

      const request = {
        src:
          process.env.NEXT_PUBLIC_PYUSD_ETH_ADDRESS ||
          "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // PYUSD on Ethereum
        dst:
          process.env.NEXT_PUBLIC_USDC_ETH_ADDRESS ||
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
        amount: parsedAmount,
        from: "0x0000000000000000000000000000000000000000", // Use zero address for testing
      };

      addResult(`Request: ${JSON.stringify(request)}`);

      const quote = await api.getQuote(request);
      addResult(
        `✅ Working quote successful: ${JSON.stringify(quote).substring(
          0,
          200
        )}...`
      );
    } catch (error) {
      addResult(
        `❌ Working quote failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    setIsLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Zap Debug Test</CardTitle>
        <p className="text-sm text-muted-foreground">
          Debug the difference between working and failing API calls
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testZapQuote} disabled={isLoading} variant="outline">
            Test Zap Quote
          </Button>
          <Button
            onClick={testWorkingQuote}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            Test Working Quote
          </Button>
          <Button onClick={clearResults} variant="destructive">
            Clear Results
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Debug Results:</h3>
          <div className="bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500">
                No tests run yet. Click a test button above.
              </p>
            ) : (
              <div className="space-y-1">
                {results.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Zap Quote:</strong> Uses CURVE_CONFIG tokens and full amount
          </p>
          <p>
            <strong>Working Quote:</strong> Uses TOKEN_ADDRESSES and same amount
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
