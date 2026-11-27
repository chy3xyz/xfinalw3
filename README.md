# Xfinalw3

A Bun monorepo scaffold for Ethereum dApps: **Foundry** contracts, **SolidStart + `@wagmi/solid`** user/admin UI, **bponder** indexer, and **Bun keepers**.

Clone, open four terminals, and run the Counter sample end-to-end. Production defaults are fail-closed (GraphQL, RPC proxy, secrets, security headers).

> Package manager and runtime: **Bun only** (do not treat Node/pnpm as first-class). Scaffold version `0.0.1` (pre-stable — see [API_STABILITY](./docs/API_STABILITY.md)).

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | SolidStart (Vinxi `static`) + `@wagmi/solid` + Viem / Reown AppKit |
| Contracts | Foundry (`forge` / `anvil`) |
| Indexer | [bponder](https://github.com/chy3xyz/bponder) `1.0.8` (Bun-native Ponder) |
| Jobs | `@w3s/cron` (`packages/job`) |
| Landing | `packages/landing` static site |

## Highlights

- Scaffold hooks: `useScaffoldReadContract` / `Write` / `Contract` / `EventHistory`
- User shell `/` (Home / Trade / Swap / Me) and admin shell `/mng` (cookie auth → indexer; roles viewer ⊂ operator ⊂ owner)
- Local Anvil + `deploy:local` writes `deployedContracts.ts`
- Indexer: Counter sample, gated `POST /rpc`, production GraphQL API key, `X-Request-Id`
- Cron: prefer `PRIVATE_KEY_FILE`; plaintext `PRIVATE_KEY` refused in production
- Production static serve with CSP / nosniff / `X-Frame-Options` (`bun start:prod`)
- `bun smoke` / `bun probe` for stack smoke and readiness probes

## Quick start

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.4.0 (repo pins `1.4.5`)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge` / `anvil` / `cast`)
- Git; Postgres optional for the indexer (see `packages/indexer/.env.example`)

### Install

```bash
git clone <repository-url>
cd xfinalw3
bun install
# optional Release CLI
bun run bponder:install
```

Copy env templates as needed:

```bash
cp packages/solid/.env.example packages/solid/.env
cp packages/indexer/.env.example packages/indexer/.env
cp packages/job/.env.example packages/job/.env
cp packages/foundry/.env.example packages/foundry/.env
```

Solid needs at least `VITE_WALLET_CONNECT_PROJECT_ID` (or `VITE_PROJECT_ID`). Full matrix: [ENV_MATRIX](./docs/ENV_MATRIX.md).

### Local four-terminal flow

```bash
bun stack          # print the recommended pane recipe

bun chain          # 1) Anvil :8545
bun deploy:local   # 2) deploy Counter → solid contracts
bun indexer        # 3) bponder :42069
bun start          # 4) Solid :5173
```

Open <http://localhost:5173>. Debug at `/debug`; admin at `/mng`.

Optional: `bun cron` (`:3001/health`), `bun landing` (`:8931`).

### Smoke / probe

```bash
bun smoke    # Anvil → deploy → (optional indexer) → Solid security headers
bun probe    # curl health of already-running services (no start/stop)
bun test     # Foundry + keystore + indexer + cron + solid unit tests
```

## Ports and health

| Service | Default | Probe |
|---------|---------|-------|
| Solid (dev) | `:5173` | `GET /` |
| Solid (prod) | `:3000` | `GET /` (includes CSP headers) |
| Indexer | `:42069` | `GET /health` · `GET /app/ready` |
| Cron | `:3001` | `GET /health` → `{ ok, writesEnabled }` |
| Anvil | `:8545` | `eth_blockNumber` |

Details: [HEALTH](./docs/HEALTH.md).

## Production (short)

```bash
bun run build
bun start:prod     # scripts/serve-solid-static.ts + security headers
# or reverse-proxy packages/solid/.output/public (see deploy/Caddyfile)
```

Run indexer/cron alongside the dApp. Secrets and GraphQL/RPC defaults: [SECURITY](./SECURITY.md). Deploy guide: [DEPLOY_BUN](./docs/DEPLOY_BUN.md). Compose sketch: `deploy/`.

## Layout

```
xfinalw3/
├── packages/
│   ├── foundry/     # contracts · tests · deploy · keystore scripts
│   ├── solid/       # dApp (user shell + /mng)
│   ├── indexer/     # bponder + Hono edge API
│   ├── job/         # keepers (@w3s/cron)
│   └── landing/     # framework marketing site
├── deploy/          # Caddy + docker-compose sketch
├── docs/            # env matrix · deploy · keystore · API stability…
├── scripts/         # smoke · probe · serve-solid-static · slim-disk
├── SECURITY.md
└── CHANGELOG.md
```

## Commands

**Contracts**

| Command | Description |
|---------|-------------|
| `bun chain` | Local Anvil |
| `bun compile` / `bun foundry:test` | Compile / tests (includes fuzz · invariant samples) |
| `bun deploy:local` | Local deploy and generate solid ABIs |
| `bun account:generate` | Keystore account (never put private keys on argv) |

**Frontend / site**

| Command | Description |
|---------|-------------|
| `bun start` | Solid dev (Vinxi `:5173`; proxies `/api` `/rpc` → indexer) |
| `bun run build` | Static output → `packages/solid/.output/public` |
| `bun start:prod` | Static server with security headers |
| `bun landing` | Landing site preview |
| `bun run slim:disk` | Clear nested caches; shared root `node_modules` (catalog + hoisted) |

**Indexer / jobs / quality**

| Command | Description |
|---------|-------------|
| `bun indexer` | bponder dev |
| `bun cron` | Keepers |
| `bun smoke` / `bun probe` | Smoke / readiness probe |
| `bun test` / `bun check` | Unit tests / Solid typecheck |
| `bun biome:ci` | Biome CI |

## Sample contract

- Source: `packages/foundry/contracts/Counter.sol`
- Unit tests: `packages/foundry/test/Counter.t.sol`
- Fuzz / invariant samples: `Counter.fuzz.t.sol` · `Counter.invariants.t.sol`

Use `~/lib/scaffold` for reads/writes. Addresses/ABIs live under `packages/solid/src/lib/contracts/` (generated by `deploy:local` — do not hand-edit long-term).

## Docs

| Doc | Topic |
|-----|--------|
| [SECURITY.md](./SECURITY.md) | Production checklist and disclosure |
| [docs/API_STABILITY.md](./docs/API_STABILITY.md) | Stable / Draft surfaces and change rules |
| [CHANGELOG.md](./CHANGELOG.md) | Changelog |
| [dev.md](./dev.md) | Development details |
| [docs/ENV_MATRIX.md](./docs/ENV_MATRIX.md) | Environment variables |
| [docs/DEPLOY_BUN.md](./docs/DEPLOY_BUN.md) | Production deploy |
| [docs/DEPLOY_LOCAL.md](./docs/DEPLOY_LOCAL.md) / [ANVIL_SETUP](./docs/ANVIL_SETUP.md) | Local chain |
| [docs/DEPLOYER_KEYSTORE.md](./docs/DEPLOYER_KEYSTORE.md) | Deployer keystore |
| [docs/HEALTH.md](./docs/HEALTH.md) | Health-check conventions |
| [docs/BUN_DISK.md](./docs/BUN_DISK.md) | Disk / catalog / slim |

## License

MIT
