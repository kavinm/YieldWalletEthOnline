import { useNexus } from "@/providers/NexusProvider";
import { CHAIN_METADATA, type UserAsset } from "@avail-project/nexus-core";
import { DollarSign, Loader2 } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { Label } from "./ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { SelectSeparator } from "./ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";

const UnifiedBalance = () => {
  const [pyusdBalance, setPyusdBalance] = useState<UserAsset | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const { nexusSDK } = useNexus();

  const fetchPyusdBalance = async () => {
    setIsLoading(true);
    try {
      // Fetch only PYUSD balance
      const balance = await nexusSDK?.getUnifiedBalance("PYUSD");
      console.log("PYUSD Balance:", balance);
      setPyusdBalance(balance);
    } catch (error) {
      console.error("Error fetching PYUSD balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (nexusSDK?.isInitialized()) {
      fetchPyusdBalance();
    }
  }, [nexusSDK]);

  const formatBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance);
    return num.toFixed(Math.min(6, decimals));
  };

  if (isLoading) {
    return (
      <div className="w-full text-center p-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your PYUSD Balance</CardTitle>
      </CardHeader>
      <CardContent>
        {pyusdBalance && parseFloat(pyusdBalance.balance) > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-2xl font-bold">
              <Label>Total Balance:</Label>
              <div className="flex items-center">
                <DollarSign className="w-6 h-6 mr-1" strokeWidth={3} />
                {pyusdBalance.balanceInFiat.toFixed(2)}
              </div>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value={pyusdBalance.symbol}>
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      {pyusdBalance.icon && (
                        <img
                          src={pyusdBalance.icon}
                          alt={pyusdBalance.symbol}
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <div className="text-left">
                        <h3 className="font-semibold">{pyusdBalance.symbol}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${pyusdBalance.balanceInFiat.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-medium">
                      {formatBalance(pyusdBalance.balance, pyusdBalance.decimals)}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {pyusdBalance.breakdown
                      .filter((chain) => parseFloat(chain.balance) > 0)
                      .map((chain, index, filteredChains) => (
                        <Fragment key={chain.chain.id}>
                          <div className="flex items-center justify-between px-2 py-1">
                            <div className="flex items-center gap-2">
                              <img
                                src={CHAIN_METADATA[chain.chain.id]?.logo}
                                alt={chain.chain.name}
                                className="h-6 w-6 rounded-full"
                              />
                              <span className="text-sm">{chain.chain.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {formatBalance(chain.balance, chain.decimals)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${chain.balanceInFiat.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          {index < filteredChains.length - 1 && (
                            <SelectSeparator />
                          )}
                        </Fragment>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Button className="w-full" size="lg">
                Start Earning
            </Button>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            You do not have any PYUSD in your wallet.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedBalance;
