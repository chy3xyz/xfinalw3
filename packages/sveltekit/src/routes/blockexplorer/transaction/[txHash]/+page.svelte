<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { formatEther } from 'viem';
  import type { Transaction, TransactionReceipt, Log } from 'viem';
  import { getTestClient } from '$lib/stores/fetchBlocks.js';
  import BackButton from '$lib/components/blockexplorer/BackButton.svelte';
  import Address from '$lib/components/Address.svelte';
  import TransactionHash from '$lib/components/blockexplorer/TransactionHash.svelte';
  import TransactionLogs from '$lib/components/blockexplorer/TransactionLogs.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { useTargetNetwork } from '$lib/stores/targetNetwork.js';
  import { hardhat } from 'viem/chains';

  export let data: { txHash: `0x${string}` };

  const { targetNetwork } = useTargetNetwork();
  $: network = $targetNetwork;
  $: isLocal = network?.id === hardhat.id;

  let tx: Transaction | null = null;
  let receipt: TransactionReceipt | null = null;
  let logs: Log[] = [];
  let error: string | null = null;
  let loading = true;

  onMount(async () => {
    if (!browser || !data.txHash) {
      loading = false;
      return;
    }
    try {
      const client = getTestClient();
      const [txRes, receiptRes] = await Promise.all([
        client.getTransaction({ hash: data.txHash }),
        client.getTransactionReceipt({ hash: data.txHash }),
      ]);
      tx = txRes;
      receipt = receiptRes;
      logs = receiptRes.logs || [];
    } catch (e: any) {
      error = e?.message ?? 'Failed to load transaction';
    } finally {
      loading = false;
    }
  });
</script>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 text-white">
  <div class="flex justify-start mb-5">
    <BackButton />
  </div>

  {#if loading}
    <Card class="border-border bg-card/95">
      <CardContent class="pt-6">
        <p class="text-white/80">Loading transaction...</p>
      </CardContent>
    </Card>
  {:else if error}
    <Card class="border-border bg-card/95 border-destructive">
      <CardContent class="pt-6">
        <p class="text-destructive">{error}</p>
        <p class="text-white/70 text-sm mt-2">Make sure the chain is running (bun chain) and the hash is valid.</p>
      </CardContent>
    </Card>
  {:else if !tx && !receipt}
    <Card class="border-border bg-card/95">
      <CardContent class="pt-6">
        <p class="text-white/80">Transaction not found.</p>
      </CardContent>
    </Card>
  {:else}
    <!-- Transaction Details - Compact Grid Layout -->
    <Card class="border-border bg-card/95 mb-6">
      <CardHeader class="pb-4">
        <CardTitle class="text-xl text-white">Transaction Details</CardTitle>
      </CardHeader>
      <CardContent>
        <!-- 3-column grid on PC, 2-column on tablet, 1-column on mobile -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <!-- Transaction Hash -->
          <div class="bg-muted/30 rounded-lg p-3 border border-border/50">
            <span class="text-white/60 text-xs uppercase tracking-wider font-medium">Transaction Hash</span>
            <div class="mt-1">
              {#if isLocal}
                <TransactionHash hash={data.txHash} />
              {:else}
                <span class="font-mono text-sm break-all">{data.txHash}</span>
              {/if}
            </div>
          </div>

          {#if receipt}
            <!-- Status -->
            <div class="bg-muted/30 rounded-lg p-3 border border-border/50">
              <span class="text-white/60 text-xs uppercase tracking-wider font-medium">Status</span>
              <div class="mt-1">
                <span class={receipt.status === 'success' ? 'text-green-500 font-medium text-sm' : 'text-destructive font-medium text-sm'}>
                  {receipt.status === 'success' ? 'Success' : 'Failed'}
                </span>
              </div>
            </div>

            <!-- Block Number -->
            <div class="bg-muted/30 rounded-lg p-3 border border-border/50">
              <span class="text-white/60 text-xs uppercase tracking-wider font-medium">Block Number</span>
              <div class="mt-1">
                {#if isLocal}
                  <a href="/blockexplorer" class="link link-primary font-mono text-sm">{receipt.blockNumber?.toString()}</a>
                {:else}
                  <span class="font-mono text-sm">{receipt.blockNumber?.toString()}</span>
                {/if}
              </div>
            </div>

            <!-- Gas Used -->
            <div class="bg-muted/30 rounded-lg p-3 border border-border/50">
              <span class="text-white/60 text-xs uppercase tracking-wider font-medium">Gas Used</span>
              <div class="mt-1 font-mono text-sm">{receipt.gasUsed?.toString() ?? '—'}</div>
            </div>

            <!-- Gas Price (if available) -->
            {#if receipt.effectiveGasPrice}
              <div class="bg-muted/30 rounded-lg p-3 border border-border/50">
                <span class="text-white/60 text-xs uppercase tracking-wider font-medium">Gas Price</span>
                <div class="mt-1 font-mono text-sm">{formatEther(receipt.effectiveGasPrice)} Gwei</div>
              </div>
            {/if}
          {/if}

          {#if tx}
            <!-- From -->
            <div class="bg-muted/30 rounded-lg p-3 border border-border/50 md:col-span-2 lg:col-span-2">
              <span class="text-white/60 text-xs uppercase tracking-wider font-medium">From</span>
              <div class="mt-1">
                <Address
                  address={tx.from}
                  format="long"
                  size="sm"
                  blockExplorerAddressLink={isLocal ? `/blockexplorer/address/${tx.from}` : undefined}
                />
              </div>
            </div>

            <!-- To -->
            <div class="bg-muted/30 rounded-lg p-3 border border-border/50">
              <span class="text-white/60 text-xs uppercase tracking-wider font-medium">To</span>
              <div class="mt-1">
                {#if tx.to}
                  <Address
                    address={tx.to}
                    format="long"
                    size="sm"
                    blockExplorerAddressLink={isLocal ? `/blockexplorer/address/${tx.to}` : undefined}
                  />
                {:else}
                  <span class="text-white/70 text-sm">Contract Creation</span>
                {/if}
              </div>
            </div>

            <!-- Value -->
            <div class="bg-muted/30 rounded-lg p-3 border border-border/50">
              <span class="text-white/60 text-xs uppercase tracking-wider font-medium">Value</span>
              <div class="mt-1 font-mono text-sm">{formatEther(tx.value ?? 0n)} ETH</div>
            </div>

            <!-- Nonce -->
            {#if tx.nonce !== undefined}
              <div class="bg-muted/30 rounded-lg p-3 border border-border/50">
                <span class="text-white/60 text-xs uppercase tracking-wider font-medium">Nonce</span>
                <div class="mt-1 font-mono text-sm">{tx.nonce}</div>
              </div>
            {/if}

            <!-- Input Data (if present) -->
            {#if tx.input && tx.input !== '0x'}
              <div class="bg-muted/30 rounded-lg p-3 border border-border/50 md:col-span-2 lg:col-span-3">
                <span class="text-white/60 text-xs uppercase tracking-wider font-medium">Input Data</span>
                <div class="mt-1 font-mono text-xs break-all text-white/80">{tx.input}</div>
              </div>
            {/if}
          {/if}
        </div>
      </CardContent>
    </Card>
    
    <!-- Transaction Logs -->
    <Card class="border-border bg-card/95">
      <CardHeader class="pb-4">
        <CardTitle class="text-xl text-white">Transaction Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionLogs logs={logs} txHash={data.txHash} />
      </CardContent>
    </Card>
  {/if}
</div>
