import { defineEnvVars } from "@sveltejs/kit/env"

// Kit 3: env vars must be declared explicitly. Exposed via `$app/env/public`
// (replaces the deprecated `$env/dynamic/public`). Read at runtime (not inlined at build).
//
// Note: Vite `VITE_*` keys (Alchemy / WalletConnect project id) remain client build-time
// vars via `import.meta.env` in `scaffold.config.ts` — production fail-fast lives there.
export const variables = defineEnvVars({
  PUBLIC_APP_URL: {
    public: true,
    static: false,
    description:
      "Public origin of the app, used for SSR metadata (og:image etc).",
    schema: (value) => value || undefined
  },
  FOUNDRY_BUILD_INFO_DIR: {
    public: false,
    static: false,
    description:
      "Optional absolute path to Foundry `out/build-info` for the block explorer bytecode view. " +
      "When unset, the server walks up from the route module to `packages/foundry/out/build-info`. " +
      "Import via `$app/env/private` (not `process.env`).",
    schema: (value) => value || undefined
  }
})
