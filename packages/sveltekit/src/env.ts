import { defineEnvVars } from '@sveltejs/kit/env';

// Kit 3: env vars must be declared explicitly. Exposed via `$app/env/public`
// (replaces the deprecated `$env/dynamic/public`). Read at runtime (not inlined at build).
export const variables = defineEnvVars({
	PUBLIC_APP_URL: {
		public: true,
		static: false,
		description: 'Public origin of the app, used for SSR metadata (og:image etc).',
		schema: (value) => value || undefined
	}
});
