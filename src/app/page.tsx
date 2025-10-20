'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import NexusInit from '@/components/nexus-init';
import UnifiedBalance from '@/components/unified-balance';
import StartEarning from '@/components/bridge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Page() {
  const { isConnected } = useAccount();
  const [initialized, setInitialized] = useState(false);

  return (
    <main className="min-h-screen container py-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold">Yield Nexus</h1>
        <ConnectButton />
      </div>

      {!isConnected ? (
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Please connect your wallet to proceed.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          <NexusInit onReady={() => setInitialized(true)} />
          {initialized && (
            <>
              <UnifiedBalance />
              <Separator />
              <StartEarning />
            </>
          )}
        </div>
      )}
    </main>
  );
}
