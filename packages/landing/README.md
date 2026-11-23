# Xfinalw3 官网 · landing

Xfinalw3 框架官网静态单页。原生 HTML/CSS/JS，无构建；文案默认英文内联，运行时由 `i18n.js` 切换 **EN / 简中**。

**定位**：展示框架优势（Bun 全栈、Solid + `@wagmi/solid`、Foundry、bponder、scaffold 轮子与约定），不是产品运营站。

## 文件

| 文件 | 角色 |
|------|------|
| `index.html` | 站点本体 + 内联默认文案 + `data-i18n` |
| `i18n.js` | EN / zh-CN 文案与语言切换（`?lang=` / localStorage `xfinalw3-landing-lang`） |
| `styles.css` / `script.js` | 样式与交互（swarm、滚动显现、移动端菜单） |

## 改文案

直接改 `index.html` 内联默认值，并同步 `i18n.js` 中 `en` / `zh-CN` 对应 key。

## 预览

```bash
cd packages/landing && python3 -m http.server 8931
# http://localhost:8931
```

部署若走 S3/CloudFront，白名单同步 `index.html`、`styles.css`、`script.js`、`i18n.js` 即可。
