# Production Hardening Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CI a real gate (Biome + Foundry + SvelteKit build/check + cron typecheck), remove React wagmi from scaffold read/event stores, and fix cron ABI / env examples so Counter-shaped jobs work.

**Architecture:** Align all contract UI stores on `@wagmi/core` + Svelte stores (same pattern as write). CI installs Foundry + submodules and runs real Biome (`@biomejs/biome`). Indexer/cron get fail-fast env + `.env.example` without pretending to be full production indexers yet.

**Tech Stack:** Bun 1.4.5, `@biomejs/biome`, Foundry, SvelteKit 3, `@wagmi/core`, viem, Ponder 0.18, croner

**Spec:** `docs/superpowers/specs/2026-11-21-production-hardening-design.md` §4 (Wave 1 only)

## Global Constraints

- Bun-only; no Node/pnpm as first-class
- UI contract APIs remain `createScaffoldReadContractStore` / `createScaffoldWriteContractStore` / `createScaffoldEventHistoryStore` (+ watch helper)
- No React `wagmi` hooks (`useReadContract`, `useBlockNumber`, `usePublicClient`, `useWatchContractEvent`, `WagmiProvider`) in scaffold stores/components after this wave
- Do not git commit unless the user explicitly asks
- Wave 2/3 (security headers, keystore rewrite, deploy docs) are OUT OF SCOPE

## File map

| Path | Role |
|------|------|
| `package.json` | Biome dep, husky prepare, delete `foundry:deploy-verify` |
| `biome.json` | May need ignore tweaks after correct Biome |
| `.github/workflows/lint.yaml` | Real CI; also trigger on `master` |
| `.lintstagedrc.js` | Include `*.svelte` |
| `packages/sveltekit/src/lib/stores/scaffoldReadContract.ts` | @wagmi/core rewrite |
| `packages/sveltekit/src/lib/stores/scaffoldContract.ts` | @wagmi/core rewrite |
| `packages/sveltekit/src/lib/stores/scaffoldEventHistory.ts` | @wagmi/core rewrite |
| `packages/sveltekit/src/lib/stores/scaffoldWatchContractEvent.ts` | @wagmi/core rewrite |
| `packages/sveltekit/src/lib/components/ProvidersWrapper.svelte` | Drop WagmiProvider |
| `packages/sveltekit/package.json` | Fix lint script |
| `packages/cron/src/jobs/contract-job.ts` | Counter ABI + chain + CONTRACT_ADDRESS |
| `packages/cron/.env.example` | New |
| `packages/indexer/.env.example` | New |
| `packages/indexer/ponder.config.ts` | RPC fail-fast |
| `packages/indexer/ponder.schema.ts` | Minimal real schema |

---

### Task 1: Fix Biome package + root scripts hygiene

**Files:**
- Modify: `package.json`
- Modify: `.lintstagedrc.js` (if present)
- Test: `bunx @biomejs/biome --version` / `bun biome:ci`

**Interfaces:**
- Produces: root scripts `biome:*` invoke `@biomejs/biome`; no `foundry:deploy-verify`; `prepare` for husky

- [ ] **Step 1: Swap Biome dependency**

```bash
cd /Users/n0x/ws_xfinal/w3_scalfold/xfinalw3
bun remove biome
bun add -d @biomejs/biome@1.8.3
```

Keep `biome.json` schema 1.8.3 aligned with installed version (or bump both together if 1.8.3 unavailable — pin one consistent pair).

- [ ] **Step 2: Update `package.json` scripts / husky / dead alias**

In root `package.json`:

- Remove script `"foundry:deploy-verify": ...`
- Change `"postinstall": "husky install"` → `"prepare": "husky"`
- Ensure `devDependencies` has `"@biomejs/biome": "1.8.3"` (or chosen pin), not `"biome"`
- Optionally add:

```json
"check": "bun --filter @w3s/sveltekit check",
"typecheck:cron": "bun --filter @w3s/cron typecheck"
```

- [ ] **Step 3: Verify Biome CLI**

```bash
bun biome:ci
```

Expected: runs `@biomejs/biome` (not the env-var `biome` tool). Fix `biome.json` ignores only if needed to get a clean or intentionally documented baseline — prefer green CI.

- [ ] **Step 4: lint-staged include svelte**

Update `.lintstagedrc.js` so Svelte files are formatted/checked, e.g.:

```js
"*.{js,jsx,ts,tsx,svelte,json,css,md}": ["bun biome check --write --no-errors-on-unmatched --files-ignore-unknown=true"],
```

(Adjust flags to match installed Biome CLI; keep foundry sol path as today.)

---

### Task 2: Real CI workflow

**Files:**
- Modify: `.github/workflows/lint.yaml` (or rename to `ci.yaml` and delete old — prefer edit in place)

**Interfaces:**
- Consumes: Task 1 Biome
- Produces: CI on `master` + `main`; submodules; Foundry; check/build/typecheck

- [ ] **Step 1: Rewrite workflow**

```yaml
name: CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.4.5

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Biome
        run: bun biome:ci

      - name: Foundry lint
        run: bun foundry:lint

      - name: Foundry tests
        run: bun foundry:test

      - name: Cron typecheck
        run: bun --filter @w3s/cron typecheck

      - name: SvelteKit check
        run: bun --filter @w3s/sveltekit check

      - name: SvelteKit build
        run: bun --filter @w3s/sveltekit build
```

- [ ] **Step 2: Local dry-run of non-GH steps**

```bash
bun biome:ci
bun foundry:test
bun --filter @w3s/cron typecheck
bun --filter @w3s/sveltekit check
bun --filter @w3s/sveltekit build
```

Expected: after Tasks 3–4, check/build green for P0 paths. If historical svelte-check noise blocks, fix errors introduced by store rewrite first; only as last resort document remaining errors — prefer green.

---

### Task 3: Rewrite scaffold read/event stores onto `@wagmi/core`

**Files:**
- Modify: `packages/sveltekit/src/lib/stores/scaffoldReadContract.ts`
- Modify: `packages/sveltekit/src/lib/stores/scaffoldContract.ts`
- Modify: `packages/sveltekit/src/lib/stores/scaffoldEventHistory.ts`
- Modify: `packages/sveltekit/src/lib/stores/scaffoldWatchContractEvent.ts`
- Modify: `packages/sveltekit/src/lib/components/ProvidersWrapper.svelte`
- Modify: `packages/sveltekit/package.json` (lint script)

**Interfaces:**
- Consumes: `wagmiContextStore` / `get(wagmiContextStore).config` (same as write store)
- Produces: stores with no imports from `wagmi` React hooks; public function names unchanged

- [ ] **Step 1: Rewrite `scaffoldReadContract.ts`**

Replace React hooks with polling/`watchBlockNumber` + `readContract` from `@wagmi/core`. Skeleton:

```typescript
import { readable, derived, get } from 'svelte/store';
import { readContract, watchBlockNumber } from '@wagmi/core';
import { browser } from '$app/env';
import { wagmiContextStore } from '../contexts/wagmi.js';
import { useSelectedNetwork } from './selectedNetwork.js';
import { createDeployedContractStore } from './deployedContract.js';
// ... keep existing exported types / createScaffoldReadContractStore signature

export function createScaffoldReadContractStore<...>(config: ...) {
  const { contractName, functionName, args, chainId, watch: watchConfig, query: queryOptions } = config;
  const defaultWatch = watchConfig ?? true;
  const selectedNetwork = useSelectedNetwork(chainId);
  const deployedContractStore = createDeployedContractStore({ contractName, chainId });

  return readable(
    { data: undefined, error: null, isLoading: true, isSuccess: false, refetch: async () => {} },
    (set) => {
      if (!browser) return;

      let unwatch: (() => void) | undefined;
      let cancelled = false;

      const run = async () => {
        const { config: wagmiConfig } = get(wagmiContextStore);
        const network = get(selectedNetwork);
        const deployed = get(deployedContractStore);
        if (!wagmiConfig || !deployed?.data?.address || !deployed?.data?.abi) {
          set({ data: undefined, error: null, isLoading: false, isSuccess: false, refetch: run });
          return;
        }
        const enabled = queryOptions?.enabled ?? (!Array.isArray(args) || !args.some((a) => a === undefined));
        if (!enabled) {
          set({ data: undefined, error: null, isLoading: false, isSuccess: false, refetch: run });
          return;
        }
        try {
          const data = await readContract(wagmiConfig, {
            address: deployed.data.address,
            abi: deployed.data.abi,
            functionName,
            args: args as any,
            chainId: network.id,
          });
          if (!cancelled) set({ data, error: null, isLoading: false, isSuccess: true, refetch: run });
        } catch (error) {
          if (!cancelled) set({ data: undefined, error, isLoading: false, isSuccess: false, refetch: run });
        }
      };

      void run();
      if (defaultWatch) {
        const { config: wagmiConfig } = get(wagmiContextStore);
        if (wagmiConfig) {
          unwatch = watchBlockNumber(wagmiConfig, {
            onBlockNumber: () => { void run(); },
            poll: true,
          });
        }
      }

      return () => {
        cancelled = true;
        unwatch?.();
      };
    },
  );
}
```

Adapt types so homepage `{$readStore?.data}` still works. Prefer matching prior shape (`data`, `error`, `isLoading`, `refetch`) used by `+page.svelte`.

- [ ] **Step 2: Rewrite `scaffoldContract.ts` / event stores similarly**

- Use `getPublicClient` / `getWalletClient` from `@wagmi/core` instead of `usePublicClient` / `useWalletClient`.
- `scaffoldEventHistory`: `getLogs` / `watchContractEvent` via `@wagmi/core` or viem public client from config.
- `scaffoldWatchContractEvent`: `watchContractEvent` from `@wagmi/core`.

Verify no file under `packages/sveltekit/src/lib/stores` imports:

```bash
rg -n "useReadContract|useBlockNumber|usePublicClient|useWalletClient|useWatchContractEvent|from 'wagmi'" packages/sveltekit/src/lib/stores packages/sveltekit/src/lib/components/ProvidersWrapper.svelte
```

Expected: no React hook matches (config types from `wagmi` / `@wagmi/core` OK).

- [ ] **Step 3: Simplify `ProvidersWrapper.svelte`**

```svelte
<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import type { QueryClient } from '@tanstack/svelte-query';
  import { browser } from '$app/env';
  import { getWagmiContext } from '$lib/contexts/wagmi.js';

  const context = getWagmiContext();
  let clientValue: QueryClient | null = null;
  if (browser && context.queryClient) {
    clientValue = context.queryClient;
  }
</script>

{#if clientValue}
  <QueryClientProvider client={clientValue}>
    <slot />
  </QueryClientProvider>
{:else}
  <slot />
{/if}
```

(Use Kit3/Svelte5 slot vs `{@render children}` per file conventions already in tree.)

- [ ] **Step 4: Fix sveltekit lint script**

In `packages/sveltekit/package.json`, replace broken eslint lint with:

```json
"lint": "bun biome check ."
```

or prettier-only if biome not wired in package — prefer calling root biome on package path.

- [ ] **Step 5: Verify build + Counter types**

```bash
bun --filter @w3s/sveltekit check
bun --filter @w3s/sveltekit build
```

Expected: exit 0, or only pre-existing errors unrelated to stores (must not leave React hook type errors).

---

### Task 4: Cron Counter ABI + env example + fail-fast

**Files:**
- Modify: `packages/cron/src/jobs/contract-job.ts`
- Modify: `packages/cron/src/index.ts` (if needed for CONTRACT_ADDRESS check)
- Create: `packages/cron/.env.example`

**Interfaces:**
- Produces: ABI `getCount`/`setCount`; require `CONTRACT_ADDRESS`; chain map at least 31337→foundry

- [ ] **Step 1: Replace ABI and address handling**

```typescript
const COUNTER_ABI = [
  { type: 'function', name: 'getCount', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'setCount', stateMutability: 'nonpayable', inputs: [{ name: 'newCount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'increment', stateMutability: 'nonpayable', inputs: [], outputs: [] },
] as const;
```

- Read via `getCount`; write via `setCount` / `increment` as appropriate.
- If `!process.env.CONTRACT_ADDRESS`, log error and `process.exit(1)` at construction or in `index.ts`.
- Keep chain selection: `31337 → foundry`; unknown chainId → error (do not silently use foundry).

- [ ] **Step 2: Add `.env.example`**

```env
PRIVATE_KEY=
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
CONTRACT_ADDRESS=
```

- [ ] **Step 3: typecheck**

```bash
bun --filter @w3s/cron typecheck
```

Expected: exit 0.

---

### Task 5: Indexer env fail-fast + minimal schema + `.env.example`

**Files:**
- Modify: `packages/indexer/ponder.config.ts`
- Modify: `packages/indexer/ponder.schema.ts`
- Create: `packages/indexer/.env.example`

**Interfaces:**
- Produces: non-empty schema export; RPC required; example env

- [ ] **Step 1: Fail-fast RPC in config**

```typescript
import { createConfig } from "ponder";

const rpc = process.env.PONDER_RPC_URL_1;
if (!rpc) {
  throw new Error("PONDER_RPC_URL_1 is required");
}

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc,
    },
  },
  contracts: {},
});
```

(If local indexing of Counter is in scope for Wave1 minimal path, add foundry chain + contract from env — only if ponder 0.18 APIs are clear; otherwise empty contracts + real schema table is enough for “not a stub file”.)

- [ ] **Step 2: Minimal schema**

Per Ponder 0.18 docs, define at least one `onchainTable` (e.g. placeholder `meta` or Counter event table). Do not leave `export {}` only.

- [ ] **Step 3: `.env.example`**

```env
PONDER_RPC_URL_1=https://cloudflare-eth.com
# DATABASE_URL=  # optional; pglite default for local
```

- [ ] **Step 4: Smoke**

```bash
cd packages/indexer && PONDER_RPC_URL_1=https://cloudflare-eth.com bun --bun ponder codegen
```

Expected: success without Node version hard-fail.

---

### Task 6: Wave 1 verification gate

**Files:** none (run + report)

- [ ] **Step 1: Regression rg**

```bash
rg -n "useReadContract|useBlockNumber|WagmiProvider|from 'wagmi'" packages/sveltekit/src/lib --glob '*.ts' --glob '*.svelte'
rg -n "getValue|setValue" packages/cron/src
rg -n '"biome":' package.json
rg -n "foundry:deploy-verify" package.json
```

Expected: no React hooks/WagmiProvider; no getValue/setValue; no wrong biome package; no deploy-verify script.

- [ ] **Step 2: Commands**

```bash
bun install
bun biome:ci
bun foundry:test
bun --filter @w3s/cron typecheck
bun --filter @w3s/sveltekit check
bun --filter @w3s/sveltekit build
```

- [ ] **Step 3: Optional Counter smoke** (if anvil available)

```bash
bun chain   # bg
bun deploy:local
bun start   # curl / → 200; manual Counter read if possible
```

- [ ] **Step 4: Mark Wave 1 complete in progress notes; Wave 2/3 wait for next plan**

---

## Spec coverage (Wave 1)

| Spec §4 item | Task |
|--------------|------|
| @biomejs/biome | T1 |
| CI submodule/Foundry/check/build/cron | T2 |
| Delete deploy-verify | T1 |
| sveltekit lint | T3 |
| husky prepare | T1 |
| lint-staged svelte | T1 |
| wagmi core read/event stores | T3 |
| ProvidersWrapper | T3 |
| cron ABI + env example | T4 |
| indexer env/schema/example | T5 |
| Verification | T6 |

## Placeholder scan

No TBD steps; store rewrite skeleton must be adapted to existing store consumer shapes — Task 3 Step 1 calls out matching `+page.svelte` usage.
