<script lang="ts">
  import { useTargetNetwork } from '$lib/stores/targetNetwork.js';
  import { hardhat } from 'viem/chains';
  import { goto } from '$app/navigation';

  export let hash: `0x${string}`;

  const { targetNetwork } = useTargetNetwork();
  // targetNetwork 是 store，用 $targetNetwork 取当前值
  $: network = $targetNetwork;
</script>

{#if network?.id === hardhat.id}
  <a href="/blockexplorer/transaction/{hash}" class="link link-primary text-primary hover:text-primary/80 font-mono transition-colors">
    {hash.substring(0, 6)}...{hash.substring(hash.length - 4)}
  </a>
{:else}
  <span class="font-mono">{hash.substring(0, 6)}...{hash.substring(hash.length - 4)}</span>
{/if}

