import { useClient, useChainId } from "wagmi";
import { getWorldAddress, getChain } from "../common";
import { Account, Chain, Client, GetContractReturnType, Transport, getContract, createWalletClient, custom, fallback, webSocket, http, ClientConfig } from "viem";
import { useQuery } from "@tanstack/react-query";
import worldAbi from "contracts/out/IWorld.sol/IWorld.abi.json";
import { transactionQueue } from "@latticexyz/common/actions";
import { transportObserver } from "@latticexyz/common";
import { useAccount } from "wagmi";

export function useWorldContract():
  | GetContractReturnType<
      typeof worldAbi,
      {
        public: Client<Transport, Chain>;
        wallet: Client<Transport, Chain, Account>;
      }
    >
  | undefined {
  const chainId = useChainId();
  const client = useClient({ chainId });
  const { address: userAddress } = useAccount();
  const eoaWalletClient = useEOAWalletFun();

  const { data: worldContract } = useQuery({
    queryKey: ["worldContract", client?.uid, userAddress, chainId],
    queryFn: () => {
      if (!client) throw new Error("Not connected.");
        return getContract({
          abi: worldAbi,
          address: getWorldAddress(),
          client: {
            public: client,
            wallet: eoaWalletClient,
          },
        });
    },
    enabled: !!client,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
  return worldContract;
}

const clientOptions = {
  chain: getChain(),
  transport: transportObserver(fallback([webSocket(), http()])),
  pollingInterval: 1000,
} as const satisfies ClientConfig;

export const useEOAWalletFun =  () => {
  const { address: userAddress } = useAccount();
  
  const eoaWalletClient = createWalletClient({
    chain: clientOptions.chain,
    transport: custom(window.ethereum!),
    account: userAddress,
  }).extend(transactionQueue());

  return eoaWalletClient;
};
