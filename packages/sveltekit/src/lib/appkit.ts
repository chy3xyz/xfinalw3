import { browser } from '$app/environment';
import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { createConfig, type Config } from 'wagmi';
import { createClient, fallback, http, type Chain } from 'viem';
import { foundry, mainnet, hardhat } from 'viem/chains';
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, type ScaffoldConfig } from 'scaffold.config';
import { getAlchemyHttpUrl } from './utils/alchemy.js';

const { targetNetworks } = scaffoldConfig;

// Override foundry chain RPC URLs to use local Anvil
const localFoundryChain: Chain = {
  ...foundry,
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
};

// Replace foundry chain in targetNetworks with local version
const networksWithLocalRpc = targetNetworks.map((chain: Chain) => {
  if (chain.id === foundry.id) {
    return localFoundryChain;
  }
  return chain;
}) as typeof targetNetworks;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = networksWithLocalRpc.find((network: Chain) => network.id === 1)
  ? networksWithLocalRpc
  : ([...networksWithLocalRpc, mainnet] as const);

// Create fallback config for SSR
function createFallbackConfig(): Config {
  return createConfig({
    chains: enabledChains,
    connectors: [],
    ssr: true,
    client: ({ chain }) => {
      let rpcFallbacks = [http()];
      const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig['rpcOverrides'])?.[chain.id];
      
      // For local chains (Foundry/Anvil), prioritize local RPC
      if (chain.id === foundry.id || chain.id === hardhat.id) {
        // Use localhost RPC for Anvil (default port 8545)
        const localRpcUrl = rpcOverrideUrl || 'http://127.0.0.1:8545';
        rpcFallbacks = [http(localRpcUrl)];
        
        // Log for debugging
        if (browser && import.meta.env.DEV) {
          console.log('[AppKit] Local chain RPC configured:', { chainId: chain.id, chainName: chain.name, rpcUrl: localRpcUrl });
        }
      } else if (rpcOverrideUrl) {
        rpcFallbacks = [http(rpcOverrideUrl), http()];
      } else {
        const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
        if (alchemyHttpUrl) {
          const isUsingDefaultKey = scaffoldConfig.alchemyApiKey === DEFAULT_ALCHEMY_API_KEY;
          rpcFallbacks = isUsingDefaultKey ? [http(), http(alchemyHttpUrl)] : [http(alchemyHttpUrl), http()];
        }
      }
      
      return createClient({
        chain,
        transport: fallback(rpcFallbacks),
        ...(chain.id !== (hardhat as Chain).id && chain.id !== (foundry as Chain).id
          ? { pollingInterval: scaffoldConfig.pollingInterval }
          : {}),
      });
    },
  });
}

// Only initialize in browser environment
let appKit: ReturnType<typeof createAppKit> | undefined = undefined;
let wagmiConfig: Config = createFallbackConfig();

if (browser) {
  const projectId = import.meta.env.VITE_PROJECT_ID || scaffoldConfig.walletConnectProjectId;
  
  if (!projectId) {
    console.warn('VITE_PROJECT_ID is not set, using default project ID');
  }

  // Use networks with local RPC, add mainnet if not present
  const networks = networksWithLocalRpc.find((n: Chain) => n.id === 1)
    ? networksWithLocalRpc
    : [...networksWithLocalRpc, mainnet];

  // Log for debugging
  if (browser && import.meta.env.DEV) {
    console.log('[AppKit] Creating WagmiAdapter with networks:', networks.map((n: Chain) => ({
      id: n.id,
      name: n.name,
      rpcUrls: n.rpcUrls?.default?.http
    })));
    console.log('[AppKit] Foundry chain RPC:', localFoundryChain.rpcUrls.default.http);
  }

  // Create adapter
  const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
  });

  // Use the adapter's wagmiConfig
  wagmiConfig = wagmiAdapter.wagmiConfig as Config;

  // Initialize AppKit
  appKit = createAppKit({
    adapters: [wagmiAdapter],
    networks,
    defaultNetwork: networksWithLocalRpc[0] || localFoundryChain,
    projectId,
    metadata: {
      name: 'W3S Scaffold',
      description: 'W3Final Scaffold using SvelteKit and AppKit',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://w3s.dev',
      icons: ['https://avatars.githubusercontent.com/u/179229932?s=200&v=4'],
    },
  });
}

export { appKit, wagmiConfig };
