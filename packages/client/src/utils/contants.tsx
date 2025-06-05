import { getChain } from "../common";

export const WISH_POOL_ID = "0x0000000000000000000000000000000000000000000000000000000000000001" as const;
export const CURRENCY_SYMBOL = getChain()?.nativeCurrency?.symbol ?? "ETH";