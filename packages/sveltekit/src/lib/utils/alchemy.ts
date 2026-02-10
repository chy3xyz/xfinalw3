import scaffoldConfig from 'scaffold.config';

export function getAlchemyHttpUrl(chainId: number): string | undefined {
  const chainIdToAlchemyNetwork: Record<number, string> = {
    1: 'eth-mainnet',
    5: 'eth-goerli',
    56: 'bsc-mainnet',
    97: 'bsc-testnet',
    11155111: 'eth-sepolia',
    137: 'polygon-mainnet',
    80001: 'polygon-mumbai',
    42161: 'arb-mainnet',
    421613: 'arb-goerli',
    10: 'opt-mainnet',
    420: 'opt-goerli',
    31337: 'foundry',
    31338: 'foundry-testnet',
    8453: 'base-mainnet',
    84531: 'base-goerli',
  };

  const network = chainIdToAlchemyNetwork[chainId];
  if (!network) {
    return undefined;
  }

  return `https://${network}.g.alchemy.com/v2/${scaffoldConfig.alchemyApiKey}`;
}
