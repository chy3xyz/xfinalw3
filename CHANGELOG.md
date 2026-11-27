# Changelog

本仓库遵循 [docs/API_STABILITY.md](./docs/API_STABILITY.md)。格式参考 [Keep a Changelog](https://keepachangelog.com/)。

## [Unreleased]

### Added

- Stack smoke：`bun smoke`（Anvil → deploy → 可选 indexer → Solid CSP 头）
- Solid 生产安全头：`securityHeaders` / `public/_headers` / `scripts/serve-solid-static.ts`
- Cron：`PRIVATE_KEY_FILE` 加载；生产拒绝明文 `PRIVATE_KEY`
- Indexer：`X-Request-Id` + 结构化访问日志（`LOG_FORMAT`）
- `SECURITY.md`、`docs/API_STABILITY.md`、`deploy/` Caddy/compose 草图
- Foundry：`Counter.fuzz.t.sol` / `Counter.invariants.t.sol` 样板
- Dependabot（npm + GitHub Actions）
- 单测：`graphqlGuard`、`adminRoles`、`loadPrivateKey`、Solid `utils` / `getDeployedContract`

### Changed

- `bun start:prod` 改为带安全头的静态服务器（原 Vinxi start 保留为 `start:vinxi`）
- README 以 Solid + Bun 为唯一权威入口（去除 SvelteKit/`adapter-bun` 主路径表述）

## [0.0.1] — 2026-11

- 初始 Solid + Foundry + bponder + cron 脚手架基线
