// Type definitions for networks - no module-level code execution
// This file can be safely imported without SSR issues

// Define types without importing scaffold.config to avoid SSR issues
// These types will be compatible with scaffold.config.targetNetworks
export type ChainWithAttributes = {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
  };
  rpcUrls: {
    default: {
      http: string[];
    };
  };
  blockExplorers?: {
    default: {
      name: string;
      url: string;
    };
  };
  testnet?: boolean;
  color?: string | [string, string];
  icon?: string;
  nativeCurrencyTokenAddress?: string;
};

export type AllowedChainIds = number;

