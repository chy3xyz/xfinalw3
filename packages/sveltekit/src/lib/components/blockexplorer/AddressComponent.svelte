<script lang="ts">
  import type { Address } from 'viem';
  import { hardhat } from 'viem/chains';
  import { useTargetNetwork } from '$lib/stores/targetNetwork.js';
  import AddressDisplay from '$lib/components/Address.svelte';
  import Balance from '$lib/components/Balance.svelte';
  import BackButton from './BackButton.svelte';
  import ContractTabs from './ContractTabs.svelte';
  import { Card, CardContent } from '$lib/components/ui/card';

  export let address: Address;
  export let contractData: { bytecode: string; assembly: string } | null;

  const { targetNetwork } = useTargetNetwork();
</script>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 text-white">
  <div class="flex justify-start mb-5">
    <BackButton />
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
    <Card class="border-border bg-card/95">
      <CardContent class="pt-6">
        <div class="flex flex-col gap-2">
          <AddressDisplay
            {address}
            format="long"
            blockExplorerAddressLink={$targetNetwork.id === hardhat.id ? `/blockexplorer/address/${address}` : undefined}
          />
          <div class="flex gap-1 items-center text-white/95">
            <span class="font-bold text-sm">Balance:</span>
            <Balance {address} />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
  <ContractTabs {address} {contractData} />
</div>

