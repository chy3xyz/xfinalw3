<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { useAllContracts } from '$lib/utils/contractsData.js';
  import ContractUI from '$lib/components/debug/ContractUI.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';

  const selectedContractStorageKey = 'scaffoldEth2.selectedContract';

  type ContractName = string;
  type GenericContract = { external?: boolean };

  let contractsData: Record<string, any> = {};
  let contractNames: ContractName[] = [];
  let selectedContract: ContractName = '' as ContractName;

  function selectContract(name: ContractName) {
    selectedContract = name;
    if (browser && name && contractNames.includes(name)) {
      try {
        sessionStorage.setItem(selectedContractStorageKey, name);
      } catch {
        // ignore
      }
    }
  }

  onMount(async () => {
    if (browser) {
      try {
        contractsData = await useAllContracts();
        contractNames = Object.keys(contractsData).sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        ) as ContractName[];
        try {
          const stored = sessionStorage.getItem(selectedContractStorageKey);
          if (stored && contractNames.includes(stored as ContractName)) {
            selectedContract = stored as ContractName;
          } else {
            selectedContract = contractNames[0] || ('' as ContractName);
          }
        } catch {
          selectedContract = contractNames[0] || ('' as ContractName);
        }
        if (selectedContract && contractNames.includes(selectedContract)) {
          try {
            sessionStorage.setItem(selectedContractStorageKey, String(selectedContract));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error('[Debug Page] onMount error:', err);
        throw err;
      }
    }
  });

  $: if (browser && selectedContract && contractNames.includes(selectedContract)) {
    try {
      sessionStorage.setItem(selectedContractStorageKey, String(selectedContract));
    } catch {
      // ignore
    }
  }

  $: if (browser && contractNames.length > 0 && !contractNames.includes(selectedContract)) {
    selectedContract = contractNames[0];
  }
</script>

<style>
  .debug-page {
    color: var(--color-foreground);
  }
</style>

<div class="debug-page container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12" data-theme="dark">
  {#if !browser}
    <div class="flex flex-col gap-4 max-w-2xl">
      <Skeleton class="h-10 w-full max-w-md" />
      <Skeleton class="h-64 w-full" />
      <Skeleton class="h-32 w-full" />
    </div>
  {:else if contractNames.length === 0}
    <Alert variant="default" class="max-w-md">
      <AlertTitle>No contracts found</AlertTitle>
      <AlertDescription>
        Deploy a contract first by running
        <code class="px-2 py-1 bg-muted rounded text-sm">bun deploy</code>
      </AlertDescription>
    </Alert>
  {:else}
    <div class="w-full max-w-7xl">
      {#if contractNames.length > 1}
        <div
          class="flex flex-row gap-2 w-full max-w-7xl mb-6 pb-4 border-b border-border overflow-x-auto scrollbar"
          role="tablist"
        >
          {#each contractNames as contractName}
            <Button
              type="button"
              size="sm"
              variant={contractName === selectedContract ? 'default' : 'ghost'}
              class="whitespace-nowrap shrink-0 {contractName === selectedContract ? '!bg-[var(--luke-primary)] !text-black hover:!bg-[var(--luke-primary)]/90' : 'text-white/90 hover:text-white'}"
              onclick={() => selectContract(contractName)}
            >
              {contractName}
              {#if (contractsData[String(contractName)] as GenericContract)?.external}
                <svg class="size-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0V6.5a.75.75 0 00-.75-.75h-6.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clip-rule="evenodd" />
                </svg>
              {/if}
            </Button>
          {/each}
        </div>
      {/if}
      <div class="w-full">
        {#key selectedContract}
          {#if selectedContract}
            <ContractUI contractName={selectedContract} />
          {/if}
        {/key}
      </div>
    </div>
  {/if}
</div>
