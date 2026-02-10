<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { WagmiProvider } from 'wagmi';
  import type { Config } from 'wagmi';
  import type { QueryClient } from '@tanstack/svelte-query';
  import { browser } from '$app/environment';
  import { getWagmiContext } from '$lib/contexts/wagmi.js';

  // 从 context 获取配置，而不是从 props
  // 这样可以避免当配置变化时组件重新渲染
  const context = getWagmiContext();
  
  // 使用本地变量来避免响应式更新导致的重新渲染
  let configValue: Config | null = null;
  let clientValue: QueryClient | null = null;
  
  // 只在客户端且配置可用时才获取值
  if (browser && context.config && context.queryClient) {
    configValue = context.config;
    clientValue = context.queryClient;
  }
</script>

{#if configValue && clientValue}
  {@const WagmiProviderComponent = WagmiProvider as any}
  {@const QueryClientProviderComponent = QueryClientProvider as any}
  <WagmiProviderComponent config={configValue}>
    <QueryClientProviderComponent client={clientValue}>
      <slot />
    </QueryClientProviderComponent>
  </WagmiProviderComponent>
{:else}
  <slot />
{/if}
