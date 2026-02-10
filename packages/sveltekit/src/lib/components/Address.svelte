<script lang="ts">
  import type { Address as AddressType } from 'viem';

  export let address: AddressType;
  export let size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  export let format: 'short' | 'long' = 'short';
  export let blockExplorerAddressLink: string | undefined = undefined;

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  function formatAddress(addr: string): string {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }

  const displayAddress = format === 'long' ? address : formatAddress(address);
</script>

{#if blockExplorerAddressLink}
  <a href={blockExplorerAddressLink} class="link text-primary hover:text-primary/80 font-mono {sizeClasses[size]} transition-colors">
    {displayAddress}
  </a>
{:else}
  <span class="font-mono {sizeClasses[size]}">{displayAddress}</span>
{/if}

