<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { writable, get } from 'svelte/store';
  import { getAccount, watchAccount, getChainId } from '@wagmi/core';
  import { wagmiConfig } from '$lib/config/wagmi.js';
  import { useTargetNetwork } from '$lib/stores/targetNetwork.js';
  import { getNetworkColor } from '$lib/stores/networkColor.js';
  import { getBlockExplorerAddressLink } from '$lib/utils/networks.js';
  import { appKit } from '$lib/appkit.js';
  import Balance from './Balance.svelte';
  import AddressInfoDropdown from './AddressInfoDropdown.svelte';
  import { hardhat } from 'viem/chains';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

  const { targetNetwork: targetNetworkStore } = useTargetNetwork();
  const connected = writable(false);
  const accountAddress = writable<`0x${string}` | undefined>(undefined);
  const accountDisplayName = writable<string>('');
  const accountEnsAvatar = writable<string | undefined>(undefined);
  const chainId = writable<number | undefined>(undefined);
  const chainName = writable<string>('');
  const chainUnsupported = writable(false);
  const isDarkMode = writable(false);

  let unwatchAccount: (() => void) | undefined = undefined;
  let themeObserver: MutationObserver | undefined = undefined;

  function updateAccountInfo() {
    if (!browser) return;

    const account = getAccount(wagmiConfig);
    const currentChainId = getChainId(wagmiConfig);
    const $targetNetwork = get(targetNetworkStore);

    if (get(connected) !== !!account.address) connected.set(!!account.address);
    if (get(accountAddress) !== account.address) accountAddress.set(account.address);
    
    // AppKit may extend account with displayName and ensAvatar
    const accountWithExtras = account as typeof account & { displayName?: string; ensAvatar?: string };
    const newDisplayName = accountWithExtras.displayName || account.address || '';
    if (get(accountDisplayName) !== newDisplayName) accountDisplayName.set(newDisplayName);
    
    if (get(accountEnsAvatar) !== accountWithExtras.ensAvatar) accountEnsAvatar.set(accountWithExtras.ensAvatar);

    if (get(chainId) !== currentChainId) chainId.set(currentChainId);
    
    // Check if chain is unsupported by comparing with target network
    const isUnsupported = account.chain ? account.chain.id !== $targetNetwork.id : false;
    if (get(chainUnsupported) !== isUnsupported) chainUnsupported.set(isUnsupported);

    // Get chain name
    let newChainName = 'Unknown';
    if (account.chain) {
      newChainName = account.chain.name;
    } else if (currentChainId === $targetNetwork.id) {
      newChainName = $targetNetwork.name;
    }
    
    if (get(chainName) !== newChainName) chainName.set(newChainName);
  }

  function openConnectModal() {
    if (appKit) {
      appKit.open({ view: 'Connect' });
    }
  }

  onMount(() => {
    if (browser) {
      updateAccountInfo();

      // Watch for account changes (includes chain changes)
      unwatchAccount = watchAccount(wagmiConfig, {
        onChange() {
          updateAccountInfo();
        },
      });

      // Watch for theme changes
      const checkDarkMode = () => {
        const theme = document.documentElement.getAttribute('data-theme');
        isDarkMode.set(theme === 'dark');
      };
      checkDarkMode();

      themeObserver = new MutationObserver(checkDarkMode);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'class'],
      });
    }
  });

  onDestroy(() => {
    unwatchAccount?.();
    themeObserver?.disconnect();
  });

  $: networkColor = $chainId
    ? getNetworkColor(
        { ...$targetNetworkStore, id: $chainId, name: $chainName },
        $isDarkMode,
      )
    : undefined;

  $: blockExplorerAddressLink =
    $accountAddress && $chainId
      ? $chainId === hardhat.id
        ? `/blockexplorer/address/${$accountAddress}`
        : getBlockExplorerAddressLink($targetNetworkStore, $accountAddress)
      : undefined;
</script>

{#if !$connected}
  <Button
    size="sm"
    type="button"
    onclick={openConnectModal}
    class="bg-[var(--luke-primary)] text-black hover:bg-[var(--luke-primary)]/90 shadow-md"
  >
    Connect Wallet
  </Button>
{:else if $chainUnsupported || ($chainId !== undefined && $chainId !== $targetNetworkStore.id)}
  <DropdownMenu.Root>
    {#snippet children()}
      <DropdownMenu.Trigger asChild>
        {#snippet child({ props })}
          <Button {...props} size="sm" variant="destructive">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Wrong Network
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" class="w-52">
        <div class="p-3">
          <p class="text-sm text-muted-foreground">
            Please switch to <strong class="text-foreground">{$targetNetworkStore.name}</strong>
          </p>
        </div>
      </DropdownMenu.Content>
    {/snippet}
  </DropdownMenu.Root>
{:else}
  <div class="flex items-center gap-1">
    <div class="flex flex-col items-end">
      {#if $accountAddress}
        <Balance address={$accountAddress} style="font-size: 0.575rem; font-weight: 400; color: white;" />
      {/if}
      {#if networkColor}
        <span class="text-xs font-medium" style="color: {networkColor}">
          {$chainName}
        </span>
      {:else}
        <span class="text-xs text-muted-foreground text-white">
          {$chainName}
        </span>
      {/if}
    </div>
    {#if $accountAddress}
      <AddressInfoDropdown
        address={$accountAddress}
        displayName={$accountDisplayName}
        ensAvatar={$accountEnsAvatar}
        blockExplorerAddressLink={blockExplorerAddressLink}
      />
    {/if}
  </div>
{/if}

