import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
			'scaffold.config': fileURLToPath(new URL('./scaffold.config.ts', import.meta.url)),
		},
	},
	server: {
		host: '0.0.0.0', // 允许通过本地 IP 访问
		port: 5173,
		strictPort: false, // 如果端口被占用，自动尝试下一个端口
		fs: {
			allow: ['..'],
		},
	},
});
