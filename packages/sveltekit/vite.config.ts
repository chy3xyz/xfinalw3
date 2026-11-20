import adapter from '@sveltejs/adapter-bun';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			preprocess: vitePreprocess(),
			adapter: adapter({
				out: 'build',
			}),
			// Kit 3 removed the built-in `$lib` alias; keep it (and scaffold.config) via the
			// deprecated-but-supported `alias` option so imports + generated tsconfig paths still work.
			alias: {
				$lib: 'src/lib',
				'scaffold.config': 'scaffold.config.ts',
			},
		}),
	],
	server: {
		host: '0.0.0.0', // 允许通过本地 IP 访问
		port: 5173,
		strictPort: false, // 如果端口被占用，自动尝试下一个端口
		fs: {
			allow: ['..'],
		},
	},
});
