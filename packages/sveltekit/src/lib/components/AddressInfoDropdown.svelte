<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { writable } from 'svelte/store';
  import type { Address } from 'viem';
  import { getAddress } from 'viem';
  import { disconnect, getAccount } from '@wagmi/core';
  import { wagmiConfig } from '$lib/config/wagmi.js';
  import { targetNetwork } from '$lib/stores/targetNetwork.js';
  import { getBlockExplorerAddressLink } from '$lib/utils/networks.js';
  import { isENS } from '$lib/utils/common.js';
  import { copyToClipboard } from '$lib/utils/common.js';
  import { outsideClick } from '$lib/stores/outsideClick.js';
  import AddressQRCodeModal from './AddressQRCodeModal.svelte';
  import NetworkOptions from './NetworkOptions.svelte';
  import { getTargetNetworks } from '$lib/utils/networks.js';
  import { hardhat } from 'viem/chains';
  import { blo } from 'blo';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Separator } from '$lib/components/ui/separator';

  export let address: Address;
  export let displayName: string;
  export let ensAvatar: string | undefined = undefined;
  export let blockExplorerAddressLink: string | undefined = undefined;
  const checkSumAddress = getAddress(address);
  const isAddressCopied = writable(false);
  const selectingNetwork = writable(false);
  const allowedNetworks = getTargetNetworks();
  const canSwitchNetwork = allowedNetworks.length > 1;
  const dropdownOpen = writable(false);

  let connectorId: string | undefined = undefined;

  onMount(() => {
    if (browser) {
      const account = getAccount(wagmiConfig);
      connectorId = account.connector?.id;
    }
  });

  function closeDropdown() {
    selectingNetwork.set(false);
    dropdownOpen.set(false);
  }

  async function handleCopyAddress() {
    const success = await copyToClipboard(checkSumAddress);
    if (success) {
      isAddressCopied.set(true);
      setTimeout(() => {
        isAddressCopied.set(false);
      }, 800);
    }
  }

  function handleDisconnect() {
    disconnect(wagmiConfig);
    closeDropdown();
  }

  function handleSwitchNetwork() {
    selectingNetwork.set(true);
  }

  // Generate blockie avatar using blo library
  const blockieUrl = blo(checkSumAddress);

  const displayAddress = isENS(displayName)
    ? displayName
    : `${checkSumAddress.slice(0, 2)}..${checkSumAddress.slice(-4)}`;

  $: finalBlockExplorerLink =
    blockExplorerAddressLink ||
    ($targetNetwork.id === hardhat.id
      ? `/blockexplorer/address/${address}`
      : getBlockExplorerAddressLink($targetNetwork, address));
</script>

<DropdownMenu.Root open={$dropdownOpen} onOpenChange={(open) => dropdownOpen.set(open)}>
  {#snippet children()}
    <DropdownMenu.Trigger asChild>
      {#snippet child({ props })}
        <Button {...props} size="sm" variant="secondary" class="gap-2 pl-1.5 pr-2.5">
        <span class="inline-block w-6 h-6 rounded-full overflow-hidden shrink-0">
          {#if ensAvatar}
            <img src={ensAvatar} alt="Avatar" class="w-full h-full object-cover" />
          {:else}
            <img src={blockieUrl} alt="Blockie" class="w-full h-full object-cover" />
          {/if}
        </span>
        <span class="font-medium text-foreground text-sm text-white">{displayAddress}</span>
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-56 bg-card text-white bg-gray-900">
    <NetworkOptions hidden={!$selectingNetwork} />
    
    {#if !$selectingNetwork}
      <!-- Copy Address -->
      <DropdownMenu.Item onSelect={handleCopyAddress}>
        {#if $isAddressCopied}
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">Copied!</span>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span class="text-sm">Copy address</span>
        {/if}
      </DropdownMenu.Item>
      
      <!-- View QR Code -->
      <DropdownMenu.Item
        onSelect={() => {
          const modal = document.getElementById('qrcode-modal') as HTMLInputElement;
          if (modal) {
            modal.checked = true;
            modal.dispatchEvent(new Event('change'));
          }
          closeDropdown();
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <span class="text-sm">View QR Code</span>
      </DropdownMenu.Item>
      
      <!-- View on Block Explorer -->
      <DropdownMenu.Item>
        <a
          href={finalBlockExplorerLink}
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 w-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span class="text-sm">View on Block Explorer</span>
        </a>
      </DropdownMenu.Item>
      
      {#if canSwitchNetwork}
        <DropdownMenu.Separator />
        <!-- Switch Network -->
        <DropdownMenu.Item onSelect={handleSwitchNetwork}>
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span class="text-sm">Switch Network</span>
        </DropdownMenu.Item>
      {/if}
      
      <DropdownMenu.Separator />
      
      <!-- Disconnect -->
      <DropdownMenu.Item onSelect={handleDisconnect} class="text-destructive focus:text-destructive">
        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span class="text-sm">Disconnect</span>
      </DropdownMenu.Item>
      {/if}
    </DropdownMenu.Content>
  {/snippet}
</DropdownMenu.Root>

<AddressQRCodeModal address={address} modalId="qrcode-modal" />

