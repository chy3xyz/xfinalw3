# Production Hardening Wave 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Checkboxes for tracking.

**Goal:** Runtime hardening — SvelteKit security headers + error page + safe env; cron graceful shutdown + write gate + health; indexer honest health; Foundry keystore/deploy/secret hygiene.

**Architecture:** Same Bun monorepo. Wave 1 already on branch `feat/prod-hardening-wave1` (uncommitted). Continue on that branch.

**Tech Stack:** SvelteKit 3 + adapter-bun, Bun.serve health for cron, Ponder API health, Foundry cast/keystore scripts

**Spec:** `docs/superpowers/specs/2026-11-21-production-hardening-design.md` §5

## Global Constraints

- Do NOT git commit unless user asks
- CSP must stay WalletConnect-friendly (start permissive: frame-ancestors, connect-src https/wss)
- `CRON_WRITE_ENABLED` default false
- No mass `$lib` rename; no full svelte-check cleanup

## Tasks

### Task 1: SvelteKit hooks + error page + env

**Files:** Create `packages/sveltekit/src/routes/+error.svelte`; Modify `packages/sveltekit/src/hooks.server.ts`; Modify `packages/sveltekit/src/env.ts`; Modify `packages/sveltekit/scaffold.config.ts` (dev-only key fallbacks with warn)

- [ ] Add `handle` with security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, baseline CSP that allows WC (`connect-src 'self' https: wss:`; `script-src 'self' 'unsafe-inline'` as needed for Kit)
- [ ] `handleError`: client message = generic `"Something went wrong"` (or i18n-safe string); log full error server-side only
- [ ] `+error.svelte`: simple dark-theme error UI with status + message, link home
- [ ] Extend `src/env.ts` for needed PUBLIC vars; document `FOUNDRY_BUILD_INFO_DIR` if private via `$env/dynamic/private` or process after declare
- [ ] `scaffold.config.ts`: if missing project id / alchemy in production (`!dev`), throw or skip silent shared keys; in dev console.warn when using placeholders
- [ ] Verify: `bun --filter @w3s/sveltekit build` && `bun --filter @w3s/sveltekit start` — `curl -I` shows headers

### Task 2: Cron shutdown drain + write gate + health

**Files:** `packages/cron/src/index.ts`, `packages/cron/src/jobs/contract-job.ts`, `packages/cron/src/utils/schedule.ts`, maybe `packages/cron/src/health.ts`, `.env.example`

- [ ] Track in-flight jobs; on SIGINT/SIGTERM stop schedules, await in-flight with timeout (e.g. 30s) then exit
- [ ] Gate writes behind `CRON_WRITE_ENABLED=true`; default off — reads still OK
- [ ] Lightweight health: `Bun.serve` on `CRON_HEALTH_PORT` (default 3001) `GET /health` → `{ ok: true, writesEnabled }`
- [ ] Schedule errors via `logger`, not only console.error
- [ ] Update `.env.example`
- [ ] Verify: typecheck; start without PRIVATE_KEY still fails; with key + WRITE false no writes

### Task 3: Indexer health honesty

**Files:** `packages/indexer/src/api/index.ts`, README note

- [ ] `/health` must not always claim ok if ponder status available — use ponder/api status if exposed; else return `{ status, ready: boolean, note }` reflecting whether indexing configured (contracts empty → `ready: false` or `degraded`)
- [ ] Document GraphQL needs gateway auth in prod (README one paragraph)
- [ ] Verify codegen still works with RPC env

### Task 4: Foundry keystore + deploy + secrets hygiene

**Files:** `packages/foundry/scripts-js/generateKeystore.js`, `Makefile`, `revealPK.js` / selectOrCreate, `.env.example`, `.gitignore`

- [ ] Fix `account:generate` → real keystore generation OR point script to correct implementation (cast wallet new / import flow)
- [ ] Live deploy: remove default `--skip-simulation`; add explicit `SKIP_SIMULATION=1` escape if needed
- [ ] `revealPK`: require `--yes-print` flag to print key; otherwise refuse
- [ ] Avoid putting private key on argv where easy (stdin/env file); document residual risk
- [ ] `.gitignore` broadcast (all or non-31337)
- [ ] Sanitize `.env.example` (Bun commands, no fake real-looking keys)
- [ ] Verify: `bun --filter @w3s/foundry account:generate --help` or dry run doesn't run ABI generator

### Task 5: Wave 2 verification

- [ ] rg headers/handleError/CRON_WRITE/skip-simulation
- [ ] build + curl -I security headers
- [ ] cron typecheck; foundry test still pass
- [ ] Report checklist vs spec §5.5

---

## Spec coverage

| §5 item | Task |
|---------|------|
| +error / handle headers / safe errors | T1 |
| env.ts / scaffold secrets | T1 |
| cron drain / write gate / health | T2 |
| indexer health | T3 |
| foundry keystore/deploy/gitignore/env | T4 |
| success criteria | T5 |
