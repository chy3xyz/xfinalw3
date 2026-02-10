import { derived } from 'svelte/store';
import { useSelectedNetwork } from './selectedNetwork.js';
import type { AllowedChainIds, ChainWithAttributes } from '../utils/networks.js';

export const DEFAULT_NETWORK_COLOR: [string, string] = ['#666666', '#bbbbbb'];

export function getNetworkColor(network: ChainWithAttributes, isDarkMode: boolean) {
  const colorConfig = network.color ?? DEFAULT_NETWORK_COLOR;
  return Array.isArray(colorConfig) ? (isDarkMode ? colorConfig[1] : colorConfig[0]) : colorConfig;
}

/**
 * Gets the color of the target network
 * @param chainId - optional chainId to get color for specific network
 * @param isDarkMode - whether dark mode is enabled
 */
export function createNetworkColorStore(chainId?: AllowedChainIds, isDarkMode = false) {
  const selectedNetwork = useSelectedNetwork(chainId);

  return derived(selectedNetwork, $network => getNetworkColor($network, isDarkMode));
}

