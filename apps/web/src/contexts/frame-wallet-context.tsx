"use client";

import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected, metaMask, walletConnect } from "wagmi/connectors";

// WalletConnect Project ID - get one from https://cloud.walletconnect.com
// Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your .env file
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Build connectors array
const connectors: any[] = [
  farcasterMiniApp(),
  metaMask(),
  injected(), // Generic injected connector for other browser wallets
];

// Add WalletConnect only if project ID is provided
if (projectId && projectId !== "YOUR_PROJECT_ID") {
  connectors.push(
    walletConnect({ 
      projectId: projectId as string,
      showQrModal: true,
    })
  );
}

const config = createConfig({
  chains: [celo, celoAlfajores],
  connectors,
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
  },
  // Set Celo mainnet as the default chain (first in array)
  ssr: false,
});

const queryClient = new QueryClient();

export default function FrameWalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
