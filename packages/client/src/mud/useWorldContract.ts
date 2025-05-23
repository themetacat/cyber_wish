import { useClient } from "wagmi";
import { chainId, getWorldAddress } from "../common";
import { Account, Chain, Client, GetContractReturnType, Transport, getContract, createWalletClient } from "viem";
import { useQuery } from "@tanstack/react-query";
import { useSessionClient } from "@latticexyz/entrykit/internal";
import { observer } from "@latticexyz/explorer/observer";
import worldAbi from "contracts/out/IWorld.sol/IWorld.abi.json";
import { transactionQueue, writeObserver } from "@latticexyz/common/actions";

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
  const { data: sessionClient } = useSessionClient();
  console.log(sessionClient);
  
  const { data: worldContract } = useQuery({
    queryKey: ["worldContract", client?.uid, sessionClient?.uid],
    queryFn: () => {
      if (!client || !sessionClient) {
        throw new Error("Not connected.");
      }

      return getContract({
        abi: worldAbi,
        address: getWorldAddress(),
        client: {
          public: client,
          wallet: sessionClient.extend(observer()),
        },
      });
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return worldContract;
}

// const getEoaContractFun = async () => {
//   const [account] = await window.ethereum!.request({
//     method: "eth_requestAccounts",
//   });

//   const eoaWalletClient = createWalletClient({
//     chain: clientOptions.chain,
//     transport: custom(window.ethereum!),
//     account: account,
//   }).extend(transactionQueue())
//     .extend(writeObserver({ onWrite: (write) => write$.next(write) });

//   return eoaWalletClient;
// };
