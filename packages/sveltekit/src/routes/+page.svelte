<script lang="ts">
  import { browser } from '$app/environment';
  import { get } from 'svelte/store';
  import { getAccount } from '@wagmi/core';
  import { createScaffoldReadContractStore } from '$lib/stores/scaffoldReadContract.js';
  import { createScaffoldWriteContractStore } from '$lib/stores/scaffoldWriteContract.js';
  import type { ContractName } from '$lib/utils/contract.js';
  import { wagmiContextStore } from '$lib/contexts/wagmi.js';
  import { notification } from '$lib/utils/notification.js';
  
  // Components
  import EarthAnimation from '$lib/components/EarthAnimation.svelte';
  import AnnouncementBanner from '$lib/components/AnnouncementBanner.svelte';
  import InviteFriend from '$lib/components/InviteFriend.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Skeleton } from '$lib/components/ui/skeleton';
  
  // Counter contract stores - 在组件内部创建以避免 QueryClient context 错误
  let counterReadStore: ReturnType<typeof createScaffoldReadContractStore> | null = null;
  let counterWriteStore: ReturnType<typeof createScaffoldWriteContractStore> | null = null;
  let isMiningStore: ReturnType<typeof createScaffoldWriteContractStore>['isMining'] | null = null;
  
  // 在客户端初始化后创建 stores
  $: if (browser && get(wagmiContextStore).config) {
    if (!counterReadStore) {
      counterReadStore = createScaffoldReadContractStore({
        contractName: "Counter",
        functionName: "getCount",
        watch: true,
      });
      counterWriteStore = createScaffoldWriteContractStore({
        contractName: 'Counter' as ContractName,
      });
      isMiningStore = counterWriteStore.isMining;
    }
  }
  
  let countInput = '';
  
  async function handleIncrement() {
    if (!counterWriteStore) return;
    try {
      await counterWriteStore.writeContractAsync({
        functionName: "increment",
      });
      notification.success("计数器增加成功！");
    } catch (error: any) {
      notification.error(error?.message || "操作失败");
    }
  }
  
  async function handleDecrement() {
    if (!counterWriteStore) return;
    try {
      await counterWriteStore.writeContractAsync({
        functionName: "decrement",
      });
      notification.success("计数器减少成功！");
    } catch (error: any) {
      notification.error(error?.message || "操作失败");
    }
  }
  
  async function handleSetCount() {
    if (!counterWriteStore) return;
    const count = parseInt(countInput);
    if (isNaN(count) || count < 0) {
      notification.error("请输入有效的数字");
      return;
    }
    try {
      await counterWriteStore.writeContractAsync({
        functionName: "setCount",
        args: [count],
      });
      notification.success(`计数器已设置为 ${count}！`);
      countInput = '';
    } catch (error: any) {
      notification.error(error?.message || "操作失败");
    }
  }
  
  let account: ReturnType<typeof getAccount> | null = null;
  let isConnected = false;
  $: if (browser) {
    try {
      const { config } = get(wagmiContextStore);
      if (config) {
        account = getAccount(config);
        isConnected = account?.isConnected ?? false;
      }
    } catch {
      account = null;
      isConnected = false;
    }
  }
</script>

<svelte:head>
  <title>xfinalw3 - Web3 Development Framework</title>
</svelte:head>

<!-- 通告横幅 -->
<AnnouncementBanner />

<!-- 地球动画区域 -->
<div class="relative w-full overflow-hidden bg-black">
  <div class="flex justify-center items-center py-8">
    <div class="w-full max-w-4xl">
      <EarthAnimation />
    </div>
  </div>
</div>

<!-- 主要内容区域 -->
<div class="container mx-auto px-4 py-6 max-w-4xl space-y-6 pb-24 text-white">
  
  <!-- Counter 示例 -->
  <Card class="bg-card/50 border-[var(--luke-primary)]/20">
    <CardHeader>
      <CardTitle class="text-lg flex items-center gap-2">
        <svg class="w-5 h-5 text-[var(--luke-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Counter 合约示例
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <p class="text-sm text-muted-foreground">
        这是一个简单的合约交互示例。连接钱包后可以尝试与 Counter 合约进行交互。
      </p>
      
      {#if !isConnected}
        <div class="p-4 bg-muted rounded-lg text-center">
          <p class="text-sm text-muted-foreground mb-2">请先连接钱包以与合约交互</p>
        </div>
      {:else if !counterReadStore}
        <div class="p-6 bg-gradient-to-br from-[var(--luke-primary)]/10 to-[var(--luke-primary)]/5 rounded-lg border border-[var(--luke-primary)]/20">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-muted-foreground">当前计数：</span>
            <Skeleton class="h-8 w-20" />
          </div>
        </div>
      {:else}
        <!-- 当前计数 -->
        <div class="p-6 bg-gradient-to-br from-[var(--luke-primary)]/10 to-[var(--luke-primary)]/5 rounded-lg border border-[var(--luke-primary)]/20">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-muted-foreground">当前计数：</span>
            {#if ($counterReadStore as { isLoading?: boolean })?.isLoading}
              <Skeleton class="h-8 w-20" />
            {:else if ($counterReadStore as { error?: unknown })?.error}
              <span class="text-destructive text-sm">加载错误</span>
            {:else}
              <span class="text-4xl font-bold text-[var(--luke-primary)]">{($counterReadStore as { data?: bigint })?.data ?? 0}</span>
            {/if}
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-2">
          <Button 
            on:click={handleIncrement}
            disabled={isMiningStore ? $isMiningStore : false}
            class="flex-1 bg-[var(--luke-primary)] text-black hover:bg-[var(--luke-primary)]/90"
          >
            {#if isMiningStore && $isMiningStore}
              处理中...
            {:else}
              ➕ 增加
            {/if}
          </Button>
          <Button 
            on:click={handleDecrement}
            disabled={isMiningStore ? $isMiningStore : false}
            variant="outline"
            class="flex-1"
          >
            ➖ 减少
          </Button>
        </div>

        <!-- 设置计数 -->
        <div class="flex gap-2">
          <Input
            type="number"
            placeholder="输入数字"
            bind:value={countInput}
            class="flex-1"
            min="0"
          />
          <Button 
            on:click={handleSetCount}
            disabled={(isMiningStore ? $isMiningStore : false) || !countInput}
            variant="secondary"
          >
            设置
          </Button>
        </div>
      {/if}
    </CardContent>
  </Card>

  <!-- 邀请好友 -->
  <InviteFriend />

  <!-- 快速开始 -->
  <Card class="bg-card/50 border-[var(--luke-primary)]/20">
    <CardHeader>
      <CardTitle class="text-lg">快速开始</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <div class="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <code class="bg-black/50 px-3 py-1 rounded text-[var(--luke-primary)]">bun chain</code>
        <span class="text-muted-foreground">启动本地区块链</span>
      </div>
      <div class="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <code class="bg-black/50 px-3 py-1 rounded text-[var(--luke-primary)]">bun deploy:local</code>
        <span class="text-muted-foreground">部署合约</span>
      </div>
      <div class="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <code class="bg-black/50 px-3 py-1 rounded text-[var(--luke-primary)]">bun start</code>
        <span class="text-muted-foreground">启动前端</span>
      </div>
      <div class="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <code class="bg-black/50 px-3 py-1 rounded text-[var(--luke-primary)]">bun foundry:test</code>
        <span class="text-muted-foreground">运行测试</span>
      </div>
      <p class="mt-4 text-xs text-muted-foreground text-center">
        查看 <a href="/dev.md" class="text-[var(--luke-primary)] underline">dev.md</a> 获取详细文档
      </p>
    </CardContent>
  </Card>
</div>

<style>
  :global(body) {
    background: #000000;
  }
  
  :global(.luke-app-wrapper) {
    background: #000000;
  }
</style>
