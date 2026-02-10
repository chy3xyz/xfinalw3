import { writable, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import scaffoldConfig from 'scaffold.config';
import { NETWORKS_EXTRA_DATA } from '../utils/networks.js';

export type ChainWithAttributes = (typeof scaffoldConfig.targetNetworks)[number] & {
  color?: string;
  icon?: string;
  blockExplorer?: {
    name: string;
    url: string;
  };
};

const targetNetworkStore = writable<ChainWithAttributes>(
  scaffoldConfig.targetNetworks[0] as ChainWithAttributes,
);

// Update target network when chain changes (only in browser)
if (browser) {
  import('../appkit.js').then(({ wagmiConfig }) => {
  import('@wagmi/core').then((wagmiCore) => {
      if (wagmiConfig) {
      // Watch for chain changes
      wagmiCore.watchAccount(wagmiConfig, {
        onChange(data) {
          if (data.chainId) {
            const newSelectedNetwork = scaffoldConfig.targetNetworks.find((n) => n.id === data.chainId);
            if (newSelectedNetwork) {
              targetNetworkStore.set({
                ...newSelectedNetwork,
                ...NETWORKS_EXTRA_DATA[newSelectedNetwork.id],
              } as ChainWithAttributes);
            }
          }
        },
      });
      }
    });
  });
}

// Simple hook that returns the store directly
export function useTargetNetwork(): { targetNetwork: Readable<ChainWithAttributes> } {
  return {
    targetNetwork: { subscribe: targetNetworkStore.subscribe },
  };
}

// Export the store directly for simpler usage
export const targetNetwork = targetNetworkStore;
