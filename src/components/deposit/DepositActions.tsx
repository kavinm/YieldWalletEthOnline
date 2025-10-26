"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDepositStepper } from "@/hooks/useDepositStepper";

interface DepositActionsProps {
  onSuccess?: () => void;
}

export default function DepositActions({ onSuccess }: DepositActionsProps) {
  const { error, isProcessing, isSuccess, startDepositFlow, reset } =
    useDepositStepper();

  const handleQuickDeposit = async () => {
    await startDepositFlow("max", true);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Deposit All */}
        <Button
          onClick={handleQuickDeposit}
          disabled={isProcessing}
          className="w-full"
          size="lg"
          variant="outline"
        >
          {isProcessing ? "Depositing All..." : "Deposit All PYUSD"}
        </Button>

        {/* Status Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {isSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">
              Deposit successful! Your PYUSD has been deposited to the vault.
            </p>
          </div>
        )}

        {/* Reset Button */}
        {isSuccess && (
          <Button onClick={reset} variant="outline" className="w-full">
            Reset
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
