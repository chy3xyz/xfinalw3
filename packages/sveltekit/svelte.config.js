import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// 使用静态适配器生成静态网站
		adapter: adapter({
			// 输出目录，默认为 'build'
			pages: 'build',
			assets: 'build',
			fallback: 'index.html', // SPA fallback，用于客户端路由（动态路由会使用这个）
			precompress: false, // 如果需要 gzip/brotli 压缩，设为 true
			strict: false // 设为 false，允许动态路由不预渲染
		}),
		// 配置预渲染设置
		prerender: {
			handleHttpError: 'warn', // 处理 HTTP 错误的方式
			handleMissingId: 'warn', // 处理缺失 ID 的方式
			// 不指定 entries，让每个路由自己决定是否预渲染
			// 动态路由（如 /blockexplorer/address/[address]）会在 +layout.ts 中标记为不预渲染
		}
	}
};

export default config;
