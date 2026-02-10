import { derived, get } from 'svelte/store';
import scaffoldConfig from 'scaffold.config';
import { useTargetNetwork } from './targetNetwork.js';
import type { AllowedChainIds } from '../utils/networks.js';
import { NETWORKS_EXTRA_DATA, type ChainWithAttributes } from '../utils/networks.js';

/**
 * Given a chainId, retrieves the network object from `scaffold.config`,
 * if not found default to network set by `useTargetNetwork` hook
 */
export function useSelectedNetwork(chainId?: AllowedChainIds) {
	const { targetNetwork } = useTargetNetwork();

	return derived(targetNetwork, ($targetNetwork) => {
		if (chainId) {
			const targetNetwork = scaffoldConfig.targetNetworks.find((network) => network.id === chainId);
			if (targetNetwork) {
				return {
					...targetNetwork,
					...NETWORKS_EXTRA_DATA[targetNetwork.id],
				} as ChainWithAttributes;
			}
		}

		return $targetNetwork;
	});
}

