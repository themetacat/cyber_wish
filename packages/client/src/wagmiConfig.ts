import { Chain, defineChain, webSocket } from "viem";
import { anvil } from "viem/chains";
import { createWagmiConfig } from "@latticexyz/entrykit/internal";
import { chainId } from "./common";

const MetaCatDev = defineChain({
  id: 31_338,
  name: 'MetaCat Devnet',
  network: 'MetaCat Devnet',
  iconUrl: 'https://poster-phi.vercel.app/MetaCat_Logo_Circle.png',
  contracts: {
    ...anvil.contracts,
    paymaster: {
      address: "0xf03E61E7421c43D9068Ca562882E98d1be0a6b6e",
    },
  },
  nativeCurrency: {
    decimals: 18,
    name: 'Binance Coin',
    symbol: 'BNB',
  },

  rpcUrls: {
    default: {
      http: ['https://devnet.pixelaw.world/rpc'],
      webSocket: ['wss://devnet.pixelaw.world/rpc'],
    },
    public: {
      http: ['https://devnet.pixelaw.world/rpc'],
      webSocket: ['wss://devnet.pixelaw.world/rpc'],
    },
  },
  blockExplorers: {
    default: {} as never,
  },
})

const BSC = defineChain({
  id: 56,
  name: 'BNB Smart Chain Mainnet',
  network: 'BNB Smart Chain Mainnet',
  iconUrl: 'https://ugc.production.linktr.ee/a31e9139-afd3-4ea2-bb1c-62de47a6ad49_Group-480971734--4-.png?io=true&size=avatar-v3_0',
  nativeCurrency: {
    decimals: 18,
    name: 'Binance Coin',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: {
      http: ['https://bsc-dataseed.bnbchain.org'],
      webSocket: ['wss://bsc-rpc.publicnode.com'],
    },
    public: {
      http: ['https://bsc-dataseed.bnbchain.org'],
      webSocket: ['wss://bsc-rpc.publicnode.com'],
    },
  },
  blockExplorers: {
    default: {} as never,
    worldsExplorer: {
      name: "BNB Smart Chain Explorer",
      url: "https://bscscan.com/",
    },
  },
})

export const chains = [
  BSC,
  // MetaCatDev,
  // {
  //   ...anvil,
  //   contracts: {
  //     ...anvil.contracts,
  //     paymaster: {
  //       address: "0xf03E61E7421c43D9068Ca562882E98d1be0a6b6e",
  //     },
  //   },
  //   blockExplorers: {
  //     default: {} as never,
  //     worldsExplorer: {
  //       name: "MUD Worlds Explorer",
  //       url: "http://localhost:13690/anvil/worlds",
  //     },
  //   },
  // },
] as const satisfies Chain[];

export const transports = {
  // [MetaCatDev.id]: webSocket(),
  // [anvil.id]: webSocket(),
  [BSC.id]: webSocket(),
} as const;

export const wagmiConfig = createWagmiConfig({
  chainId,
  // TODO: swap this with another default project ID or leave empty
  walletConnectProjectId: "e4cf17cbcf19b89caa3e3343a0b33240",
  appName: document.title,
  chains,
  transports,
  pollingInterval: {
    // [MetaCatDev.id]: 2000,
    // [anvil.id]: 2000,
    [BSC.id]: 2000,
  },
});
