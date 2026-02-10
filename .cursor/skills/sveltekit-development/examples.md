# SvelteKit 开发示例

## 典型开发场景

### 场景 1: 创建新页面并读取合约数据

```svelte
<!-- src/routes/counter/+page.svelte -->
<script lang="ts">
  import { createScaffoldReadContractStore } from '$lib/stores/scaffoldReadContract.js';
  import { createScaffoldWriteContractStore } from '$lib/stores/scaffoldWriteContract.js';
  import { notification } from '$lib/utils/notification.js';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  
  // 读取计数
  const countStore = createScaffoldReadContractStore({
    contractName: "Counter",
    functionName: "getCount",
    watch: true,
  });
  
  // 写入操作
  const writeStore = createScaffoldWriteContractStore({
    contractName: "Counter"
  });
  
  // 提取 isMining store 用于响应式订阅
  const isMiningStore = writeStore.isMining;
  
  async function handleIncrement() {
    try {
      await writeStore.writeContractAsync({
        functionName: "increment",
      });
      notification.success("Incremented!");
    } catch (error) {
      notification.error("Failed");
    }
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Counter Page</CardTitle>
  </CardHeader>
  <CardContent>
    {#if $countStore?.data !== undefined}
      <p>Count: {$countStore.data}</p>
    {/if}
    <Button on:click={handleIncrement} disabled={$isMiningStore}>
      {#if $isMiningStore}
        处理中...
      {:else}
        Increment
      {/if}
    </Button>
  </CardContent>
</Card>
```

### 场景 2: 监听合约事件

```svelte
<script lang="ts">
  import { createScaffoldEventHistoryStore } from '$lib/stores/scaffoldEventHistory.js';
  
  const countEvents = createScaffoldEventHistoryStore({
    contractName: "Counter",
    eventName: "CountUpdated",
    watch: true,
  });
</script>

<div>
  <h2>Recent Count Updates</h2>
  {#if $countEvents.data}
    {#each $countEvents.data as event (event.logIndex)}
      <div>
        <p>New Count: {event.args.newCount}</p>
        <p>Time: {new Date(Number(event.blockNumber) * 1000).toLocaleString()}</p>
      </div>
    {/each}
  {:else}
    <p>No events</p>
  {/if}
</div>
```

### 场景 3: 使用自定义 Store

```typescript
// src/lib/stores/myStore.ts
import { createScaffoldReadContractStore } from './scaffoldReadContract.js';
import { writable, derived } from 'svelte/store';

export function createCounterStore() {
  const baseStore = createScaffoldReadContractStore({
    contractName: "Counter",
    functionName: "getCount",
    watch: true,
  });
  
  // 派生 store
  const formattedStore = derived(baseStore, ($data) => {
    if ($data?.data === undefined) return null;
    return {
      count: Number($data.data),
      isEven: Number($data.data) % 2 === 0,
    };
  });
  
  return formattedStore;
}
```

### 场景 4: 处理加载和错误状态

```svelte
<script lang="ts">
  import { createScaffoldReadContractStore } from '$lib/stores/scaffoldReadContract.js';
  import { Skeleton } from '$lib/components/ui/skeleton';
  
  const countStore = createScaffoldReadContractStore({
    contractName: "Counter",
    functionName: "getCount",
    watch: true,
  });
</script>

{#if $countStore.isLoading}
  <Skeleton class="h-8 w-full" />
{:else if $countStore.error}
  <div class="text-red-500">
    Error: {$countStore.error.message}
  </div>
{:else if $countStore.data !== undefined}
  <div>
    <p>Current Count: {$countStore.data}</p>
  </div>
{/if}
```

### 场景 5: 响应式数据计算

```svelte
<script lang="ts">
  let amount = $state(0);
  let rate = $state(0.1);
  
  // 使用 $derived 自动计算
  let result = $derived(amount * rate);
  
  // 使用 $effect 处理副作用
  $effect(() => {
    if (result > 1000) {
      console.log('结果超过 1000');
    }
  });
</script>

<div>
  <input type="number" bind:value={amount} />
  <p>结果: {result}</p>
</div>
```
