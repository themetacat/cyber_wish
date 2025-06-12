import { useClient } from "wagmi";
import { chainId, getWorldAddress, getChain } from "../common";
import { Account, Chain, Client, GetContractReturnType, Transport, getContract, createWalletClient, custom, fallback, webSocket, http, ClientConfig } from "viem";
import { useQuery } from "@tanstack/react-query";
// import { useSessionClient } from "@latticexyz/entrykit/internal";
import { observer } from "@latticexyz/explorer/observer";
import worldAbi from "contracts/out/IWorld.sol/IWorld.abi.json";
import { transactionQueue, writeObserver } from "@latticexyz/common/actions";
import { ContractWrite, transportObserver } from "@latticexyz/common";
import { Subject } from "rxjs";

export function useWorldContract():
  | GetContractReturnType<
      typeof worldAbi,
      {
        public: Client<Transport, Chain>;
        wallet: Client<Transport, Chain, Account>;
      }
    >
  | undefined {
  const client = useClient({ chainId });

  const { data: worldContract } = useQuery({
    queryKey: ["worldContract", client?.uid],
    queryFn: () => {
      if (!client) throw new Error("Not connected.");

      return getEoaContractFun().then((eoaWalletClient) => {
        
        return getContract({
          abi: worldAbi,
          address: getWorldAddress(),
          client: {
            public: client,
            wallet: eoaWalletClient,
          },
        });
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

const write$ = new Subject<ContractWrite>();

export const getEoaContractFun = async () => {
  const [account] = await window.ethereum!.request({
    method: "eth_requestAccounts",
  });

  const eoaWalletClient = createWalletClient({
    chain: clientOptions.chain,
    transport: custom(window.ethereum!),
    account: account,
  }).extend(transactionQueue());

  return eoaWalletClient;
};
