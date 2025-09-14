export type Candle = {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  [key: string]: any;
};

export const SYMBOL_NAME_MAP: Record<string, string> = {
  BTCUSD: "Bitcoin",
  ETHUSD: "Ethereum",
  SOLUSD: "Solana",
  AVAXUSD: "Avalanche",
  DOGEUSD: "Dogecoin",
  LINKUSD: "Chainlink",
  LTCUSD: "Litecoin",
  BCHUSD: "Bitcoin Cash",
  UNIUSD: "Uniswap",
  XRPUSD: "XRP",
};