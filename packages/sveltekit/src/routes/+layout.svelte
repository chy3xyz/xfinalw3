<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { QueryClient } from '@tanstack/svelte-query';
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { setWagmiContext } from '$lib/contexts/wagmi.js';
  import { isLowRoute } from '$lib/utils/lowRoute.js';
  import ProvidersWrapper from '$lib/components/ProvidersWrapper.svelte';
  import '../app.css';

  // 检查是否是低配版本路由
  $: isLowVersionRoute = isLowRoute($page.url.pathname);
  // debug、blockexplorer 页面不显示底部导航
  $: hideFooter = $page.url.pathname === '/debug' || $page.url.pathname.startsWith('/debug/') || $page.url.pathname === '/blockexplorer' || $page.url.pathname.startsWith('/blockexplorer/');

  onMount(async () => {
    if (!browser) return;
    
    // 防止重复初始化
    if ((window as any).__lukeInitialized) return;
    (window as any).__lukeInitialized = true;

    try {
      const { wagmiConfig } = await import('$lib/config/wagmi.js');
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      });
      setWagmiContext(wagmiConfig, queryClient);
      await import('$lib/appkit');
    } catch (error) {
      console.error('Initialization error:', error);
    }
  });

  onDestroy(() => {
    if (browser) {
      (window as any).__lukeInitialized = false;
    }
  });
</script>

<ProvidersWrapper>
  <div class="luke-app-wrapper text-white" data-theme="dark">
    {#if isLowVersionRoute}
      <slot />
    {:else}
      <div class="background-container">
        <div class="content-wrapper">
          <Header />
          
          <main class="relative flex flex-col flex-1 text-foreground min-h-0">
            <slot />
          </main>

          {#if !hideFooter}
            <BottomNav />
          {/if}
        </div>
      </div>
    {/if}

    <Toast />
  </div>
</ProvidersWrapper>

<style>
  :global(html) {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    background: var(--luke-dark, #0a0a0a);
  }

  :global(body) {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    background: var(--luke-dark, #0a0a0a);
  }

  :global(#app) {
    background: var(--luke-dark, #0a0a0a);
  }

  .background-container {
    position: relative;
    min-height: 100vh;
    width: 100%;
    background: var(--luke-dark, #0a0a0a);
  }

  .content-wrapper {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
</style>
