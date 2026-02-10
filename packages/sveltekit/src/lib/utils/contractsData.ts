import { browser } from '$app/environment';

// Cache for contracts data to avoid re-importing
let contractsCache: any = null;
let scaffoldConfigCache: any = null;

export async function useAllContracts(): Promise<Record<string, any>> {
  try {
    console.log('[useAllContracts] Starting, browser:', browser);
    
    // Only execute in browser
    if (!browser) {
      console.log('[useAllContracts] Not in browser, returning empty');
      return {};
    }

    // Use cached values if available, otherwise import
    if (!contractsCache) {
      try {
        console.log('[useAllContracts] Importing contracts module...');
        const contractsModule = await import('./contract.js');
        contractsCache = contractsModule.contracts;
        console.log('[useAllContracts] Contracts module loaded:', !!contractsCache);
      } catch (err: any) {
        console.error('[useAllContracts] Failed to import contracts module:', err);
        console.error('[useAllContracts] Error details:', err?.message, err?.stack);
        return {};
      }
    }
    
    if (!scaffoldConfigCache) {
      try {
        console.log('[useAllContracts] Importing scaffold.config...');
        // @ts-ignore - scaffold.config is aliased in vite.config.ts
        scaffoldConfigCache = await import('scaffold.config');
        console.log('[useAllContracts] Scaffold config loaded:', !!scaffoldConfigCache);
      } catch (err: any) {
        console.error('[useAllContracts] Failed to import scaffold.config:', err);
        console.error('[useAllContracts] Error details:', err?.message, err?.stack);
        return {};
      }
    }
    
    const contracts = contractsCache;
    const scaffoldConfig = scaffoldConfigCache.default || scaffoldConfigCache;
    const allContracts: Record<string, any> = {};
    
    console.log('[useAllContracts] contracts:', contracts);
    console.log('[useAllContracts] scaffoldConfig:', scaffoldConfig);
    
    if (!contracts) {
      console.warn('[useAllContracts] No contracts found');
      return allContracts;
    }

    if (!scaffoldConfig?.targetNetworks) {
      console.warn('[useAllContracts] No targetNetworks in config');
      return allContracts;
    }

    console.log('[useAllContracts] targetNetworks:', scaffoldConfig.targetNetworks);
    scaffoldConfig.targetNetworks.forEach((network: any) => {
      try {
        console.log(`[useAllContracts] Processing network: ${network.id} (${network.name})`);
        const chainContracts = contracts?.[network.id];
        console.log(`[useAllContracts] Chain contracts for ${network.id}:`, chainContracts ? Object.keys(chainContracts) : 'none');
        if (chainContracts) {
          Object.entries(chainContracts).forEach(([name, contract]) => {
            if (!allContracts[name]) {
              allContracts[name] = contract;
              console.log(`[useAllContracts] Added contract: ${name}`);
            }
          });
        }
      } catch (err) {
        console.error(`[useAllContracts] Error processing network ${network.id}:`, err);
      }
    });

    console.log('[useAllContracts] Final contracts:', Object.keys(allContracts));
    return allContracts;
  } catch (err: any) {
    console.error('[useAllContracts] Fatal error:', err);
    console.error('[useAllContracts] Error message:', err?.message);
    console.error('[useAllContracts] Error stack:', err?.stack);
    // Don't throw, return empty object instead
    return {};
  }
}

