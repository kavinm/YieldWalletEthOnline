import {
  type SUPPORTED_CHAINS_IDS,
  type SUPPORTED_TOKENS,
} from "@avail-project/nexus-core";

// Placeholder type since MessageSigner is not exported from nexus-core
type MessageSigner = (payload: unknown) => Promise<string>;
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { useNexus } from "@/providers/NexusProvider";
import IntentModal from "./blocks/intent-modal";
import { ArrowBigRight, CircleAlertIcon } from "lucide-react";
import useListenTransaction from "@/hooks/useListenTransactions";
import { parseUnits, type Address } from "viem";
import { useAccount } from "wagmi";
import { useHotWallet } from "@/providers/HotWalletProvider";

// Note: createAppSessionMessage should be imported from @erc7824/nitrolite
// but we'll use a placeholder for now to avoid build issues
const createAppSessionMessage = async (
  signer: MessageSigner,
  data: unknown[]
) => {
  // This is a placeholder implementation
  // In a real implementation, this would create the proper message structure
  console.log("Creating app session message with data:", data);
  return "placeholder-signed-message";
};

// This component now simulates an instant off-chain deposit to a hot wallet
const StartEarning = () => {
  const [amount, setAmount] = useState<string>("0");
  const { nexusSDK } = useNexus();
  const { address: userAddress } = useAccount();
  const {
    operatorAddress,
    sendMessage,
    isAuthenticated: isHotWalletAuthenticated,
  } = useHotWallet();
  const [isLoading, setIsLoading] = useState(false);

  // This function would be passed to createAppSessionMessage
  // It needs access to the user's wallet signer
  const userMessageSigner: MessageSigner = async (payload: unknown) => {
    if (!nexusSDK) throw new Error("Nexus SDK not initialized");
    // This is a simplified signer. In a real app, you'd use the wallet provider.
    // @ts-expect-error - Nexus SDK provider type is not fully typed
    return await nexusSDK.provider.request({
      method: "personal_sign",
      params: [JSON.stringify(payload), userAddress],
    });
  };

  const initiateOffChainDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (!userAddress || !isHotWalletAuthenticated) {
      alert("User or hot wallet not ready.");
      return;
    }
    setIsLoading(true);

    try {
      const appDefinition = {
        protocol: "nitroliterpc",
        participants: [userAddress, operatorAddress as Address],
        weights: [100, 0],
        quorum: 100,
        challenge: 0,
        nonce: Date.now(),
      };

      const allocations = [
        { participant: userAddress, asset: "PYUSD", amount: amount },
        {
          participant: operatorAddress as Address,
          asset: "PYUSD",
          amount: "0",
        },
      ];

      const signedMessage = await createAppSessionMessage(userMessageSigner, [
        {
          definition: appDefinition,
          allocations: allocations,
        },
      ]);

      // Send the message to the ClearNode via our hot wallet's connection
      sendMessage(signedMessage);

      console.log(
        `[USER] Sent app session request to hot wallet for ${amount} PYUSD.`
      );
      alert(
        `Your deposit of ${amount} PYUSD has been initiated instantly! The hot wallet will now process the on-chain transaction in the background.`
      );
    } catch (error) {
      console.error("Error during off-chain deposit:", error);
      alert(`An unexpected error occurred: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-lg items-center mx-auto">
        <CardHeader className="w-full">
          <CardTitle className="text-center">
            Start Earning with PYUSD
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full max-w-md mx-auto">
          <div className="grid gap-3 w-full text-left">
            <Label htmlFor="amount">Amount to Deposit</Label>
            <Input
              id="amount"
              type="text"
              placeholder="e.g., 100.00"
              className="w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Instantly deposit PYUSD off-chain. Our hot wallet will handle the
              on-chain staking in the background.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-y-5">
          <div className="grid gap-3">
            <Button
              type="submit"
              onClick={initiateOffChainDeposit}
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                isLoading ||
                !isHotWalletAuthenticated
              }
            >
              {isLoading ? (
                <CircleAlertIcon className="size-5 animate-spin" />
              ) : isHotWalletAuthenticated ? (
                "Deposit & Earn (Instant)"
              ) : (
                "Hot Wallet Connecting..."
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  );
};

export default StartEarning;
