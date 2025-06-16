import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactNode } from "react";
import { SyncProvider } from "@latticexyz/store-sync/react";
import { wagmiConfig } from "./wagmiConfig";
import { chainId, getWorldAddress, indexerUrl, startBlock } from "./common";
import { syncAdapter } from "./mud/recs";
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';

const queryClient = new QueryClient();

export type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  const worldAddress = getWorldAddress();
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
        theme={darkTheme()}
          initialChain={chainId}
          appInfo={{
            appName: 'CyberWish',
          }}>
          <SyncProvider chainId={chainId} address={worldAddress} startBlock={startBlock} indexerUrl={indexerUrl} adapter={syncAdapter}>
            {children}
          </SyncProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
