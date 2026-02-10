# SvelteKit 静态网站部署指南

本指南说明如何将 SvelteKit 应用打包成静态网站并部署到 Nginx。

## 前置要求

- Node.js >= 20.18.3
- Bun (推荐) 或 npm/yarn
- Nginx (用于部署)

## 构建步骤

### 1. 安装依赖

```bash
cd packages/sveltekit
bun install
```

### 2. 构建静态网站

```bash
# 从项目根目录
bun sveltekit:build

# 或从 sveltekit 目录
cd packages/sveltekit
bun run build
```

构建过程会：
1. 构建 Tailwind CSS（完整版和低配版）
2. 构建 App CSS（完整版和低配版）
3. 使用 Vite 打包应用
4. 使用 adapter-static 生成静态文件

### 3. 构建输出

构建完成后，静态文件会输出到 `packages/sveltekit/build/` 目录：

```
build/
├── index.html          # 入口文件
├── _app/              # 应用代码和资源
├── tailwind.full.css  # 完整版 Tailwind CSS
├── tailwind.base.css  # 低配版 Tailwind CSS
├── app.css            # 完整版 App CSS
├── app.base.css       # 低配版 App CSS
└── ...                # 其他静态资源
```

## Nginx 配置

### 基本配置

创建或编辑 Nginx 配置文件（通常在 `/etc/nginx/sites-available/your-site`）：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/luke_dapp/packages/sveltekit/build;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持 - 所有路由都回退到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### HTTPS 配置（推荐）

使用 Let's Encrypt 获取 SSL 证书：

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

或手动配置：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    root /path/to/luke_dapp/packages/sveltekit/build;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... 其他配置同上
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 部署步骤

### 1. 构建应用

```bash
cd /path/to/luke_dapp
bun sveltekit:build
```

### 2. 复制构建文件到服务器

```bash
# 如果服务器是远程的
rsync -avz packages/sveltekit/build/ user@server:/var/www/your-site/

# 或使用 scp
scp -r packages/sveltekit/build/* user@server:/var/www/your-site/
```

### 3. 配置 Nginx

```bash
# 创建配置文件
sudo nano /etc/nginx/sites-available/your-site

# 创建符号链接
sudo ln -s /etc/nginx/sites-available/your-site /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## 动态路由说明

应用中的动态路由（如 `/blockexplorer/address/[address]`）使用客户端路由：

- **预渲染的路由**：会在构建时生成静态 HTML
- **动态路由**：使用 SPA fallback (`index.html`)，在客户端处理

这意味着：
- 直接访问 `/blockexplorer/address/0x123...` 会加载 `index.html`，然后由客户端路由处理
- 搜索引擎可能无法索引动态路由的内容（如果需要 SEO，考虑使用 SSR）

## 故障排查

### 1. 404 错误

确保 Nginx 配置中有 `try_files $uri $uri/ /index.html;`，这样所有路由都会回退到 `index.html`。

### 2. CSS/JS 文件 404

检查构建输出目录中的文件路径是否正确。确保 Nginx 的 `root` 指向正确的目录。

### 3. 路由不工作

- 检查 `fallback: 'index.html'` 配置
- 确保动态路由的 `+layout.ts` 中设置了 `export const prerender = false;`

### 4. 样式文件未加载

确保 `static/` 目录中的 CSS 文件被正确复制到 `build/` 目录。检查构建脚本是否正确执行。

## 性能优化

### 1. 启用压缩

在 Nginx 配置中启用 gzip 或 brotli 压缩。

### 2. CDN 部署

可以将 `build/` 目录部署到 CDN（如 Cloudflare、AWS CloudFront）以获得更好的性能。

### 3. 预压缩文件

在 `svelte.config.js` 中设置 `precompress: true`，然后在 Nginx 中配置：

```nginx
location / {
    try_files $uri $uri/ /index.html;
    
    # 使用预压缩的文件
    location ~ \.(js|css|html|svg|json)$ {
        gzip_static on;
        brotli_static on;
    }
}
```

## 快速部署脚本

创建 `deploy.sh`：

```bash
#!/bin/bash
set -e

echo "🔨 构建应用..."
bun sveltekit:build

echo "📦 复制文件到服务器..."
rsync -avz --delete packages/sveltekit/build/ user@server:/var/www/your-site/

echo "✅ 部署完成！"
```

使用方法：

```bash
chmod +x deploy.sh
./deploy.sh
```

## 注意事项

1. **环境变量**：静态网站无法使用服务器端环境变量。如果需要在客户端使用配置，请使用 `$env/static/public` 或在构建时注入。

2. **API 调用**：如果应用需要调用 API，确保 API 服务器支持 CORS。

3. **文件系统访问**：静态网站无法访问服务器文件系统。动态路由中使用的文件系统操作（如 `fs.readFileSync`）需要改为客户端 API 调用。

4. **构建信息**：`blockexplorer/address/[address]` 路由需要访问 Foundry 构建信息，这在静态网站中无法直接访问。考虑：
   - 在构建时预生成常见地址的数据
   - 使用 API 端点提供数据
   - 完全在客户端处理（如果数据量不大）

