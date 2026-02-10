import { getContext, setContext } from "svelte";
import { writable } from "svelte/store";
import type { Config } from "wagmi";
import type { QueryClient } from "@tanstack/svelte-query";

const WAGMI_CONTEXT_KEY = Symbol("wagmi-context");

// 模块级缓存，在 HMR 时保持不变
let cachedConfig: Config | null = null;
let cachedQueryClient: QueryClient | null = null;

// 创建 store
const wagmiStore = writable<{
  config: Config | null;
  queryClient: QueryClient | null;
}>({
  config: cachedConfig,
  queryClient: cachedQueryClient,
});

export function setWagmiContext(
  config: Config | null,
  queryClient: QueryClient | null,
) {
  const value = { config, queryClient };

  // 缓存值
  if (config && queryClient) {
    cachedConfig = config;
    cachedQueryClient = queryClient;
  }

  try {
    setContext(WAGMI_CONTEXT_KEY, value);
    wagmiStore.set(value);
  } catch {
    // 如果 setContext 失败（已在组件外调用），只更新 store
    wagmiStore.set(value);
  }
}

export function getWagmiContext(): {
  config: Config | null;
  queryClient: QueryClient | null;
} {
  try {
    const context = getContext<{
      config: Config | null;
      queryClient: QueryClient | null;
    }>(WAGMI_CONTEXT_KEY);

    return context || { config: null, queryClient: null };
  } catch {
    // 如果 context 不可用，返回 store 值
    let value: { config: Config | null; queryClient: QueryClient | null } = {
      config: null,
      queryClient: null,
    };
    wagmiStore.subscribe((v) => {
      value = v;
    })();
    return value;
  }
}

export const wagmiContextStore = wagmiStore;
