<script lang="ts">
  import type { PageData } from './$types';
  import type { Address } from 'viem';
  import { isZeroAddress } from '$lib/utils/common.js';
  import AddressComponent from '$lib/components/blockexplorer/AddressComponent.svelte';

  export let data: PageData;
  
  const address: Address = data.address;
  const contractData = data.contractData;
</script>

{#if isZeroAddress(address)}
  <div class="container mx-auto px-4 py-10 text-white">
    <p class="text-center text-destructive">Invalid address</p>
  </div>
{:else}
  <AddressComponent {address} {contractData} />
{/if}

