import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  sepolia,
  polygon,
  optimism,
  arbitrum,
  base,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Avail Nexus DApp',
  projectId: 'YOUR_PROJECT_ID', // IMPORTANT: Replace with your WalletConnect aCloud Project ID
  chains: [
    mainnet,
    sepolia,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  ssr: true,
});
