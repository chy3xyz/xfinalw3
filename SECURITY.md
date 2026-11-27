# Security

## Reporting

Please report vulnerabilities privately to the maintainers (do not open a public issue with exploit details). Include impact, affected package, and reproduction steps when possible.

Dependency updates: GitHub Dependabot (`.github/dependabot.yml`, weekly npm / monthly Actions).

## Production checklist

| Area | Expectation |
|------|-------------|
| **Indexer GraphQL** | Set `GRAPHQL_API_KEY`. Production requires a key by default (`GRAPHQL_REQUIRE_API_KEY` unset). Opt out only with `=0`. |
| **Indexer RPC proxy** | Set `RPC_GATEWAY_UPSTREAM`. Unknown methods denied in production unless `RPC_GATEWAY_ALLOW_UNKNOWN=1`. |
| **Admin** | `ADMIN_PASSWORD_SHA256` / `ADMIN_ACCOUNTS` + `ADMIN_SESSION_SECRET` (or `SESSION_SECRET_FILE`). Roles: viewer ⊂ operator ⊂ owner. |
| **Keeper** | Prefer `X-Keeper-Secret` + `KEEPER_SECRET` for machine writes; never expose keeper secret to browsers. |
| **Cron / job** | Prefer `PRIVATE_KEY_FILE` (mode `0600`). Plaintext `PRIVATE_KEY` is refused when `NODE_ENV=production` unless `ALLOW_PLAINTEXT_PRIVATE_KEY=1`. Keep `CRON_WRITE_ENABLED=false` until intentional. |
| **Foundry deployer** | Use keystore workflows in `docs/DEPLOYER_KEYSTORE.md` — never put private keys on argv or in committed `.env`. |
| **dApp** | Serve via `bun start:prod` (security-header static server) or Caddy/`public/_headers`. Set WalletConnect project id via `VITE_*`. Do not enable `VITE_USE_RPC_PROXY` against untrusted networks without indexer gates. |

## Headers

Solid static responses include CSP, `X-Frame-Options: DENY`, `nosniff`, COOP, and a locked-down Permissions-Policy. CSP allows WalletConnect/`wss:` and local Anvil — tighten `connect-src` / `frame-src` for your product.

## Out of scope for this scaffold

- Formal audits of sample `Counter` or product contracts
- Secrets management SaaS (Vault, etc.) — integrate in your deploy path
- Browser extension / phishing resistance beyond CSP and cookie flags
