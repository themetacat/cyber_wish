import { chains } from "./wagmiConfig";
import { Chain, Hex } from "viem";

export const chainId = import.meta.env.CHAIN_ID;
export const worldAddress = import.meta.env.WORLD_ADDRESS;
export const startBlock = BigInt(import.meta.env.START_BLOCK ?? 0n);

export let indexerUrl = "http://127.0.0.1:3001";
export let apiServer = "http://127.0.0.1:5000";

if (chainId == 31338) {
  indexerUrl = "https://indexerdev.pixelaw.world"
  apiServer = "https://api.metacat.world"
}

export const url = new URL(window.location.href);
export type Entity = Hex;

export function getWorldAddress() {
  if (!worldAddress) {
    throw new Error("No world address configured. Is the world still deploying?");
  }
  return worldAddress;
}

export function getChain(): Chain {
  const chain = chains.find((c) => c.id === chainId);
  if (!chain) {
    throw new Error(`No chain configured for chain ID ${chainId}.`);
  }
  return chain;
}

// export function useDetectedChainId() {
//   const [chainId, setChainId] = useState(31338);

//   useEffect(() => {
//     if (!window.ethereum) {
//       console.error('No window.ethereum');
//       return;
//     }

//     const getChainId = async () => {
//       try {
//         const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
//         setChainId(parseInt(chainIdHex, 16));
//       } catch (error) {
//         console.error('get chainId error', error);
//       }
//     };

//     getChainId();

//     const handleChainChanged = (chainIdHex: string) => {
//       setChainId(parseInt(chainIdHex, 16));
//     };

//     window.ethereum.on('chainChanged', handleChainChanged);

//     return () => {
//       window.ethereum.removeListener('chainChanged', handleChainChanged);
//     };
//   }, []);

//   return chainId;
// }
