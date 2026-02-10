<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { getTargetNetworks } from '$lib/utils/networks.js';
  import { getNetworkColor } from '$lib/stores/networkColor.js';
  import { switchChain, getAccount, watchAccount, getChainId, watchChainId } from '@wagmi/core';
  import { wagmiConfig } from '$lib/config/wagmi.js';
  import { writable } from 'svelte/store';

  export let hidden = false;

  const isDarkMode = writable(false);
  const allowedNetworks = getTargetNetworks();
  const currentChainId = writable<number | undefined>(undefined);

  let unwatchAccount: (() => void) | undefined = undefined;
  let unwatchChainId: (() => void) | undefined = undefined;
  let themeObserver: MutationObserver | undefined = undefined;

  function updateChainId() {
    if (!browser) return;
    const account = getAccount(wagmiConfig);
    const chainId = getChainId(wagmiConfig);
    currentChainId.set(account.chainId || chainId);
  }

  onMount(() => {
    if (browser) {
      updateChainId();

      // Check dark mode
      const checkDarkMode = () => {
        const theme = document.documentElement.getAttribute('data-theme');
        isDarkMode.set(theme === 'dark');
      };
      checkDarkMode();

      // Watch for theme changes
      themeObserver = new MutationObserver(checkDarkMode);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'class'],
      });

      // Watch for account changes
      unwatchAccount = watchAccount(wagmiConfig, {
        onChange() {
          updateChainId();
        },
      });

      // Watch for chain changes
      unwatchChainId = watchChainId(wagmiConfig, {
        onChange() {
          updateChainId();
        },
      });
    }
  });

  onDestroy(() => {
    unwatchAccount?.();
    unwatchChainId?.();
    themeObserver?.disconnect();
  });

  async function handleSwitchChain(chainId: number) {
    try {
      await switchChain(wagmiConfig, { chainId });
    } catch (error) {
      console.error('Failed to switch chain:', error);
    }
  }
</script>

{#if !hidden}
  {#each allowedNetworks.filter(network => network.id !== $currentChainId) as network}
    <button
      type="button"
      role="menuitem"
      class="flex w-full items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
      on:click={() => handleSwitchChain(network.id)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      <span>
        Switch to
        <span class="font-medium" style="color: {getNetworkColor(network, $isDarkMode)}">
          {network.name}
        </span>
      </span>
    </button>
  {/each}
{/if}

