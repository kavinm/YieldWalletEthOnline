'use client';

import { useAccount } from 'wagmi';
import { useNexus } from '@/providers/NexusProvider';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function NexusInit({ onReady }: { onReady: () => void }) {
  const { isConnected } = useAccount();
  const { handleInit, nexusSDK } = useNexus();

  if (!isConnected) {
    return null;
  }

  if (nexusSDK?.isInitialized()) {
    onReady();
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Initialize Nexus</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <p>
          To view your unified balance and use the cross-chain features,
          you first need to initialize the Avail Nexus SDK.
        </p>
        <Button onClick={handleInit}>Initialize Nexus SDK</Button>
      </CardContent>
    </Card>
  );
}
