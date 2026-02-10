<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { writable, get } from 'svelte/store';
  import { createWalletClient, http, parseEther } from 'viem';
  import { hardhat, foundry } from 'viem/chains';
  import { getAccount, watchAccount, getBalance } from '@wagmi/core';
  import { wagmiConfig } from '$lib/config/wagmi.js';
  import { createTransactor } from '$lib/stores/transactor.js';
  import { Button } from '$lib/components/ui/button';

  const NUM_OF_ETH = '1';
  const FAUCET_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const;

  const localWalletClient = createWalletClient({
    chain: foundry,
    transport: http(),
  });

  const loading = writable(false);
  const connectedAddress = writable<`0x${string}` | undefined>(undefined);
  const connectedChainId = writable<number | undefined>(undefined);
  const balance = writable<bigint | null>(null);

  let unwatchAccount: (() => void) | undefined = undefined;

  async function fetchBalance() {
    if (!browser) return;
    const address = get(connectedAddress);
    if (!address) {
      balance.set(null);
      return;
    }

    try {
      const result = await getBalance(wagmiConfig, {
        address,
        chainId: foundry.id,
      });
      balance.set(result.value);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      balance.set(null);
    }
  }

  onMount(() => {
    if (browser) {
      const account = getAccount(wagmiConfig);
      connectedAddress.set(account.address);
      connectedChainId.set(account.chainId);
      if (account.address) {
        fetchBalance();
      }

      unwatchAccount = watchAccount(wagmiConfig, {
        onChange(data) {
          connectedAddress.set(data.address);
          connectedChainId.set(data.chainId);
          if (data.address) {
            fetchBalance();
          } else {
            balance.set(null);
          }
        },
      });
    }
  });

  onDestroy(() => {
    unwatchAccount?.();
  });

  async function sendETH() {
    const address = get(connectedAddress);
    if (!address) return;

    try {
      loading.set(true);
      const faucetTxn = createTransactor(localWalletClient);
      await faucetTxn({
        account: FAUCET_ADDRESS,
        to: address,
        value: parseEther(NUM_OF_ETH),
      });
      loading.set(false);
      // Refresh balance after sending
      await fetchBalance();
    } catch (error) {
      console.error('⚡️ ~ file: FaucetButton.svelte:sendETH ~ error', error);
      loading.set(false);
    }
  }

  // Only render on local chain (foundry or hardhat)
  $: isLocalChain = $connectedChainId === foundry.id || $connectedChainId === hardhat.id;
  $: shouldShow = isLocalChain && $connectedAddress !== undefined;
  $: isBalanceZero = $balance !== null && $balance === 0n;
</script>

{#if shouldShow}
  <div class="relative group" class:tooltip={isBalanceZero} class:tooltip-bottom={isBalanceZero} data-tip="Grab funds from faucet">
    <Button
      size="icon-sm"
      variant="ghost"
      on:click={sendETH}
      disabled={$loading}
      type="button"
      aria-label="Request ETH from faucet"
      class="text-white hover:text-white"
    >
      {#if $loading}
        <svg class="size-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      {/if}
    </Button>
    {#if isBalanceZero}
      <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full z-10 px-2 py-1 text-xs font-medium text-popover-foreground bg-popover border border-border rounded-md shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        Grab funds from faucet
      </span>
    {/if}
  </div>
{/if}

