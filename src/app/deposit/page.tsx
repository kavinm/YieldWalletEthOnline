"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import DepositEarnButton from "@/components/blocks/deposit-earn-button";
import ShowYieldStrategyButton from "@/components/blocks/show-yield-strategy-button";
import DepositForm from "@/components/deposit/DepositForm";
import DepositActions from "@/components/deposit/DepositActions";
import DepositStepper from "@/components/deposit/DepositStepper";
// ZapDepositForm removed - using direct 1inch integration instead
import OneInchV6Test from "@/components/oneinch/OneInchV6Test";
import CompleteZapForm from "@/components/zap/CompleteZapForm";
import ZapDebugTest from "@/components/zap/ZapDebugTest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBalance } from "wagmi";
import { useDepositStepper } from "@/hooks/useDepositStepper";

const PYUSD_ADDRESS =
  process.env.NEXT_PUBLIC_PYUSD_ETH_ADDRESS ||
  "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";
const BEEFY_VAULT_ADDRESS =
  process.env.NEXT_PUBLIC_BEEFY_VAULT_ADDRESS ||
  "0xdA19C56DcDf4fB333acBE9aA18024DD2e4A864Bc";

export default function DepositPage() {
  const { address, isConnected } = useAccount();
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("form");

  const { data: pyusdBalance, isLoading } = useBalance({
    address: address,
    token: PYUSD_ADDRESS as `0x${string}`,
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1"), // Ethereum mainnet
  });

  const {
    steps,
    currentStep,
    isProcessing,
    isSuccess,
    retryStep,
    reset: resetStepper,
  } = useDepositStepper();

  return (
    <main className="min-h-screen container py-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold">Deposit & Earn</h1>
        <ConnectButton />
      </div>

      {!isConnected ? (
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Please connect your wallet to view your PYUSD balance and start
                earning.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto">
          {/* Balance Display */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Your PYUSD Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading balance...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-3xl font-bold">
                    {pyusdBalance?.formatted || "0"}{" "}
                    {pyusdBalance?.symbol || "PYUSD"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ethereum Network
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Stepper */}
          {isProcessing && steps.length > 0 && (
            <DepositStepper
              steps={steps}
              currentStep={currentStep}
              onRetry={retryStep}
              onCancel={resetStepper}
            />
          )}

          {/* Success Message */}
          {isSuccess && (
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-600">
                      Deposit Successful!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your PYUSD has been successfully deposited to the Beefy
                      vault.
                    </p>
                  </div>
                  <button
                    onClick={resetStepper}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Make Another Deposit
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deposit Interface */}
          {!isProcessing && !isSuccess && (
            <div className="w-full space-y-6">
              {/* Tab Navigation */}
              <div className="flex justify-center">
                <div className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
                  <button
                    onClick={() => setActiveTab("form")}
                    className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] ${
                      activeTab === "form"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-foreground"
                    }`}
                  >
                    Deposit Form
                  </button>
                  <button
                    onClick={() => setActiveTab("quick")}
                    className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] ${
                      activeTab === "quick"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-foreground"
                    }`}
                  >
                    Quick Actions
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex justify-center">
                {activeTab === "form" ? (
                  <DepositForm onSuccess={() => setActiveTab("quick")} />
                ) : (
                  <DepositActions onSuccess={() => setActiveTab("form")} />
                )}
              </div>
            </div>
          )}

          {/* Debug Test */}
          <ZapDebugTest />

          {/* Complete Zap Integration */}
          <CompleteZapForm />

          {/* 1inch v6.1 Integration Test */}
          <OneInchV6Test />

          {/* Legacy Buttons */}
          <div className="flex gap-4">
            <DepositEarnButton
              onClick={() => {
                console.log("Deposit & Earn clicked");
                console.log("PYUSD Balance:", pyusdBalance?.formatted);
              }}
            />
            <ShowYieldStrategyButton onClick={() => setIsStrategyOpen(true)} />
          </div>
        </div>
      )}

      <Dialog open={isStrategyOpen} onOpenChange={setIsStrategyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yield Strategy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Vault:
              </span>
              <a
                href={`https://etherscan.io/address/${BEEFY_VAULT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-primary hover:underline"
              >
                BeefyVault7
              </a>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Chain:
              </span>
              <span className="text-lg font-semibold">Ethereum</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Platform:
              </span>
              <span className="text-lg font-semibold">Curve</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Strategy:
              </span>
              <a
                href="https://etherscan.io/address/0xE8B7ED624481D69f43d616Ae4a4C6531D088301F"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-primary hover:underline"
              >
                0xE8B7...301F
              </a>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Price Per Full Share:
              </span>
              <span className="text-lg font-semibold">1.001549</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Last Harvest:
              </span>
              <span className="text-lg font-semibold">
                {new Date(1761300011 * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
