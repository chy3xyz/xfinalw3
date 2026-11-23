/* Xfinalw3 landing — i18n (en + zh-CN) */
;(function () {
  var LANGS = ["en", "zh-CN"]
  var LANG_LABEL = { en: "EN", "zh-CN": "简中" }
  var STORE_KEY = "xfinalw3-landing-lang"
  var I18N = {
    en: {
      "flow.c1.h": "bun chain",
      "flow.c1.p":
        "Local Anvil/Foundry chain on 8545. Deterministic accounts, fast feedback, no faucet hunting.",
      "flow.c2.h": "bun deploy:local",
      "flow.c2.p":
        "Deploys Counter (and your scripts). Writes into deployedContracts shared by the Solid dApp.",
      "flow.c3.h": "bun start",
      "flow.c3.p":
        "SolidStart on :5173 with @wagmi/solid. Connect wallet, hit /debug, iterate UI against live local ABIs.",
      "flow.c4.h": "bun indexer",
      "flow.c4.p":
        "bponder Bun-native CLI indexes chains; GraphQL + /v1 for product queries when you outgrow client eth_getLogs.",
      "flow.cta": "Start coding →",
      "flow.desc":
        "The happy path is intentionally boring: Anvil, deploy, Solid dApp, optional indexer. Debug page lists every deployed address for the active chain.",
      "flow.eyebrow": "DEV LOOP",
      "flow.r1":
        "Package manager & runtime: Bun ≥ 1.4 only — do not introduce Node/pnpm as prerequisites.",
      "flow.r2":
        "Contract addresses/ABIs live in packages/solid/src/lib/contracts — regenerate via Foundry deploy, do not hand-edit forever.",
      "flow.r3":
        "Default target network in scaffold.config is Foundry (31337); override RPCs there, not in scattered env files.",
      "flow.tag": "local-first",
      "flow.title": "Four terminals, one habit",
      "ft.brand": "Xfinalw3",
      "ft.c1": "dApp :5173",
      "ft.c2": "Indexer :42069",
      "ft.copyright": "© 2026 Xfinalw3",
      "ft.disclaimer":
        "Xfinalw3 is a development framework. Smart contracts you deploy remain your responsibility — audit before mainnet.",
      "ft.h1": "Commands",
      "ft.h2": "Defaults",
      "ft.l1": "Dev loop",
      "ft.l2": "Indexer setup",
      "ft.note":
        "Bun-native Ethereum scaffold: Solid + @wagmi/solid, Foundry, bponder.",
      "hero.brand": "Xfinalw3",
      "hero.cta1": "See the loop",
      "hero.cta2": "Scaffold wheels",
      "hero.sub":
        "One monorepo: <b>Solid + @wagmi/solid</b>, Foundry, and Bun-native bponder. Scaffold hooks and UI wheels so you iterate contracts and product UI in the same loop.",
      "hero.title1": "Ship Ethereum dApps",
      "hero.title2": "on a Bun-native stack",
      "indexer.c1.h": "bun run bponder:install",
      "indexer.c1.p":
        "Pins Release binary + builds vendor CLI. Scripts run via Bun on the fork entry — reliable on 0.18.9.",
      "indexer.c2.h": "Same ponder:* surface",
      "indexer.c2.p":
        'Library imports stay from "ponder"; runtime is Bun-native. Schema + handlers live under packages/indexer.',
      "indexer.c3.h": "/v1 + GraphQL",
      "indexer.c3.p":
        "Query stack for products; Solid can proxy /ponder in vinxi while you develop against localhost:42069.",
      "indexer.c4.h": "Health that tells truth",
      "indexer.c4.p":
        "Built-in /health for liveness; app /app/ready for readiness. Reserved paths are documented — no silent always-ok stubs.",
      "indexer.cta": "Install CLI →",
      "indexer.desc":
        "bponder is the Bun fork of Ponder. Xfinalw3 vendors the CLI path, requires DATABASE_SCHEMA, and exposes honest /app/ready alongside built-in /health.",
      "indexer.eyebrow": "BPONDER",
      "indexer.r1":
        "DATABASE_SCHEMA is required for Bun-native start/dev/serve.",
      "indexer.r2":
        "Do not mount custom Hono routes on /health, /ready, /status, /metrics, or /v1/*.",
      "indexer.r3":
        "At least one indexing function must be registered — empty scaffolds fail validation on purpose.",
      "indexer.tag": "v0.18.9",
      "indexer.title": "Bun-native indexing when logs get serious",
      "join.cta1": "Review the loop",
      "join.cta2": "Scaffold docs",
      "join.ctaLine":
        "Open the repo root and run the four commands — the Solid Counter page is the smoke test.",
      "join.eyebrow": "GET STARTED",
      "join.r1.b": "Prereqs",
      "join.r1.s":
        "Bun ≥ 1.4, Foundry (forge/anvil), Git. No Node required for the happy path.",
      "join.r2.b": "Install",
      "join.r2.s":
        "bun install · bun run bponder:install · copy packages/*/ .env.example",
      "join.r3.b": "Run",
      "join.r3.s":
        "bun chain · bun deploy:local · bun start · optional bun indexer",
      "join.r4.b": "Extend",
      "join.r4.s":
        "Add Solidity + tests, wire scaffold hooks, grow indexer schema when product needs history.",
      "join.title": "Clone, install, ship the loop",
      "nav.brand": "Xfinalw3",
      "nav.enter": "Get started",
      "nav.flow": "Flow",
      "nav.indexer": "Indexer",
      "nav.menu": "Menu",
      "nav.rules": "Rules",
      "nav.scaffold": "Scaffold",
      "nav.stack": "Stack",
      "page.desc":
        "Xfinalw3: Solid + @wagmi/solid, Foundry, bponder indexer — one Bun monorepo to ship Ethereum dApps fast.",
      "page.title": "Xfinalw3 · Bun-native Ethereum dApp framework",
      "rp.done": "primary",
      "rp.eyebrow": "PACKAGE MAP",
      "rp.opt": "optional",
      "rp.p1.s":
        "Xfinalw3 dApp — SolidStart, @wagmi/solid, UI wheels, scaffold hooks",
      "rp.p2.s": "Solidity, tests, deploy scripts, Anvil",
      "rp.p3.s": "bponder project — schema, handlers, Hono /app/ready",
      "rp.p4.s": "Legacy Svelte UI — bun start:svelte when you need it",
      "rp.p5.s": "Background jobs / cron-style workers via Bun",
      "rp.title": "What lives where",
      "rules.d1": "Runtime + PM",
      "rules.d2": "Primary dApp",
      "rules.d3": "Contracts",
      "rules.d4": "Indexer",
      "rules.d5": "Scaffold R/W",
      "rules.d6": "Local default",
      "rules.eyebrow": "CONVENTIONS",
      "rules.title": "Guardrails that keep the monorepo sane",
      "scaffold.c1.h": "useScaffoldReadContract",
      "scaffold.c1.p":
        "Typed reads by contractName + functionName. Optional watch polling. Same idea as the Svelte store, Solid signals under the hood.",
      "scaffold.c2.h": "useScaffoldWriteContract",
      "scaffold.c2.p":
        "writeContractAsync with simulate, mining state, and toast feedback. Wrong network / missing deploy fails loudly.",
      "scaffold.c3.h": "UI kit + shell",
      "scaffold.c3.p":
        "Button, Card, Modal, Notify, ConnectGate, SiteHeader, BottomNav, ChainBanner — dark theme ready for product pages.",
      "scaffold.c4.h": "Wallet layer",
      "scaffold.c4.p":
        "@wagmi/solid config, injected + optional WalletConnect, ensureTargetChain, classifyError — one place for connect/read/write.",
      "scaffold.desc":
        "Extracted from a production Solid app, aligned with the Svelte scaffold mental model: name the contract, call the function — ABI and address resolve for you.",
      "scaffold.eyebrow": "SCAFFOLD WHEELS",
      "scaffold.m1": "Reads",
      "scaffold.m2": "Writes",
      "scaffold.m3": "ABIs",
      "scaffold.m4": "Config",
      "scaffold.m5": "Legacy UI",
      "scaffold.note":
        "Prefer scaffold hooks over ad-hoc viem clients for app contract calls — keeps multi-chain and deploy sync boringly correct.",
      "scaffold.panelTitle": "Contract UI rule",
      "scaffold.tag": "Solid patterns",
      "scaffold.title": "Keep the wheels that speed shipping",
      "stack.eyebrow": "WHY XFINALW3",
      "stack.lead":
        "Built for teams that want Bun everywhere, typed contract UI, and an indexer that does not fight Node.",
      "stack.n1.b": "① Bun only",
      "stack.n1.s":
        "Install, scripts, SSR/static build, and indexer CLI — one runtime. No pnpm/Node dual stack.",
      "stack.n2.b": "② Solid + wagmi",
      "stack.n2.s":
        "Primary dApp on SolidStart with @wagmi/solid. Fine-grained reactivity without React tax.",
      "stack.n3.b": "③ Foundry + index",
      "stack.n3.s":
        "Contracts in Foundry; events in bponder. Same repo, shared deploy artifacts.",
      "stack.quote":
        "「Write Solidity → deploy local → bind UI with scaffold hooks → index with bponder。」",
      "stack.title": "Framework advantages, not another wallet demo"
    },
    "zh-CN": {
      "flow.c1.h": "bun chain",
      "flow.c1.p":
        "本地 Anvil/Foundry 8545。确定性账户，快速反馈，不用找水龙头。",
      "flow.c2.h": "bun deploy:local",
      "flow.c2.p":
        "部署 Counter（以及你的脚本）。写入 Solid dApp 共用的 deployedContracts。",
      "flow.c3.h": "bun start",
      "flow.c3.p":
        "SolidStart :5173 + @wagmi/solid。连钱包、打开 /debug，对着本地 ABI 迭代 UI。",
      "flow.c4.h": "bun indexer",
      "flow.c4.p":
        "bponder Bun 原生 CLI 索引链上数据；GraphQL + /v1，当客户端 eth_getLogs 不够用时上量。",
      "flow.cta": "开始写代码 →",
      "flow.desc":
        "快乐路径故意无聊：Anvil、部署、Solid dApp、可选索引。Debug 页列出当前链上全部已部署地址。",
      "flow.eyebrow": "DEV LOOP",
      "flow.r1": "包管理与运行时：仅 Bun ≥ 1.4 — 不要把 Node/pnpm 当成前置。",
      "flow.r2":
        "合约地址/ABI 在 packages/solid/src/lib/contracts — 靠 Foundry 部署再生，不要长期手改。",
      "flow.r3":
        "scaffold.config 默认目标网 Foundry（31337）；改 RPC 写在那里，不要散落各处 env。",
      "flow.tag": "local-first",
      "flow.title": "四个终端，一个习惯",
      "ft.brand": "Xfinalw3",
      "ft.c1": "dApp :5173",
      "ft.c2": "Indexer :42069",
      "ft.copyright": "© 2026 Xfinalw3",
      "ft.disclaimer":
        "Xfinalw3 是开发框架。你部署的智能合约责任自负 —— 上主网前请审计。",
      "ft.h1": "命令",
      "ft.h2": "默认端口",
      "ft.l1": "开发闭环",
      "ft.l2": "索引器安装",
      "ft.note":
        "Bun 原生以太坊脚手架：Solid + @wagmi/solid、Foundry、bponder。",
      "hero.brand": "Xfinalw3",
      "hero.cta1": "看开发闭环",
      "hero.cta2": "脚手架轮子",
      "hero.sub":
        "单一 monorepo：<b>Solid + @wagmi/solid</b>、Foundry、Bun 原生 bponder。脚手架 hooks 与 UI 轮子让合约与产品界面同环迭代。",
      "hero.title1": "交付以太坊 dApp",
      "hero.title2": "用 Bun 原生全栈",
      "indexer.c1.h": "bun run bponder:install",
      "indexer.c1.p":
        "固定 Release 二进制并构建 vendor CLI。脚本用 Bun 跑 fork 入口 —— 在 0.18.9 上更稳。",
      "indexer.c2.h": "仍是 ponder:* 面",
      "indexer.c2.p":
        '库导入仍 from "ponder"；运行时是 Bun 原生。schema 与 handlers 在 packages/indexer。',
      "indexer.c3.h": "/v1 + GraphQL",
      "indexer.c3.p":
        "产品查询栈；Solid 可在 vinxi 代理 /ponder，开发时对接 localhost:42069。",
      "indexer.c4.h": "诚实的健康检查",
      "indexer.c4.p":
        "内置 /health 保活；应用 /app/ready 就绪。保留路径已文档化 —— 没有永远 ok 的空壳。",
      "indexer.cta": "安装 CLI →",
      "indexer.desc":
        "bponder 是 Ponder 的 Bun fork。Xfinalw3 走 vendor CLI，要求 DATABASE_SCHEMA，并提供诚实的 /app/ready 与内置 /health。",
      "indexer.eyebrow": "BPONDER",
      "indexer.r1": "Bun-native 的 start/dev/serve 必须提供 DATABASE_SCHEMA。",
      "indexer.r2":
        "不要在 /health、/ready、/status、/metrics 或 /v1/* 上挂自定义 Hono 路由。",
      "indexer.r3":
        "至少注册一个 indexing function —— 空脚手架会故意校验失败。",
      "indexer.tag": "v0.18.9",
      "indexer.title": "日志变重时，用 Bun 原生索引",
      "join.cta1": "回顾闭环",
      "join.cta2": "脚手架说明",
      "join.ctaLine":
        "在仓库根目录跑这四条命令 —— Solid Counter 页就是冒烟测试。",
      "join.eyebrow": "GET STARTED",
      "join.r1.b": "前置",
      "join.r1.s":
        "Bun ≥ 1.4、Foundry（forge/anvil）、Git。快乐路径不需要 Node。",
      "join.r2.b": "安装",
      "join.r2.s":
        "bun install · bun run bponder:install · 复制 packages/*/ .env.example",
      "join.r3.b": "运行",
      "join.r3.s":
        "bun chain · bun deploy:local · bun start · 可选 bun indexer",
      "join.r4.b": "扩展",
      "join.r4.s":
        "加 Solidity + 测试，接 scaffold hooks，产品需要历史时再扩 indexer schema。",
      "join.title": "克隆、安装、跑通闭环",
      "nav.brand": "Xfinalw3",
      "nav.enter": "开始使用",
      "nav.flow": "开发流",
      "nav.indexer": "索引器",
      "nav.menu": "菜单",
      "nav.rules": "约定",
      "nav.scaffold": "脚手架",
      "nav.stack": "技术栈",
      "page.desc":
        "Xfinalw3：Solid + @wagmi/solid、Foundry、bponder 索引 —— 一套 Bun monorepo 快速交付以太坊应用。",
      "page.title": "Xfinalw3 · Bun 原生以太坊 dApp 框架",
      "rp.done": "主路径",
      "rp.eyebrow": "PACKAGE MAP",
      "rp.opt": "可选",
      "rp.p1.s":
        "Xfinalw3 dApp — SolidStart、@wagmi/solid、UI 轮子、scaffold hooks",
      "rp.p2.s": "Solidity、测试、部署脚本、Anvil",
      "rp.p3.s": "bponder 工程 — schema、handlers、Hono /app/ready",
      "rp.p4.s": "遗留 Svelte UI — 需要时 bun start:svelte",
      "rp.p5.s": "后台任务 / Bun cron 式 worker",
      "rp.title": "东西分别住哪",
      "rules.d1": "运行时 + 包管理",
      "rules.d2": "主站 dApp",
      "rules.d3": "合约",
      "rules.d4": "索引器",
      "rules.d5": "脚手架读写",
      "rules.d6": "本地默认链",
      "rules.eyebrow": "CONVENTIONS",
      "rules.title": "让 monorepo 保持清醒的护栏",
      "scaffold.c1.h": "useScaffoldReadContract",
      "scaffold.c1.p":
        "按 contractName + functionName 类型化读取。可选轮询。与 Svelte store 同思路，底层是 Solid signal。",
      "scaffold.c2.h": "useScaffoldWriteContract",
      "scaffold.c2.p":
        "writeContractAsync，含模拟、挖矿态与 toast。错网 / 未部署会明确失败。",
      "scaffold.c3.h": "UI 套件 + 壳",
      "scaffold.c3.p":
        "Button、Card、Modal、Notify、ConnectGate、SiteHeader、BottomNav、ChainBanner — 暗色主题可直接铺产品页。",
      "scaffold.c4.h": "钱包层",
      "scaffold.c4.p":
        "@wagmi/solid 配置、注入钱包 + 可选 WalletConnect、ensureTargetChain、classifyError — 连接/读/写一处搞定。",
      "scaffold.desc":
        "从生产 Solid 应用抽出，对齐 Svelte scaffold 心智：写合约名与函数名 —— ABI 与地址自动解析。",
      "scaffold.eyebrow": "SCAFFOLD WHEELS",
      "scaffold.m1": "读",
      "scaffold.m2": "写",
      "scaffold.m3": "ABI",
      "scaffold.m4": "配置",
      "scaffold.m5": "旧 UI",
      "scaffold.note":
        "应用内合约调用优先 scaffold hooks，少用临时 viem client —— 多链与部署同步会更无聊地正确。",
      "scaffold.panelTitle": "合约 UI 约定",
      "scaffold.tag": "Solid 模式",
      "scaffold.title": "留下加速交付的轮子",
      "stack.eyebrow": "WHY XFINALW3",
      "stack.lead":
        "给想要全程 Bun、类型化合约 UI、以及不和 Node 打架的索引器的团队。",
      "stack.n1.b": "① 只用 Bun",
      "stack.n1.s":
        "安装、脚本、构建与索引 CLI —— 同一运行时。没有 pnpm/Node 双栈。",
      "stack.n2.b": "② Solid + wagmi",
      "stack.n2.s":
        "主站 SolidStart + @wagmi/solid。细粒度响应，不背 React 税。",
      "stack.n3.b": "③ Foundry + 索引",
      "stack.n3.s": "合约在 Foundry，事件进 bponder。同一仓库，共享部署产物。",
      "stack.quote":
        "「写 Solidity → 本地部署 → scaffold hooks 绑 UI → bponder 索引。」",
      "stack.title": "卖的是框架优势，不是又一个钱包 Demo"
    }
  }

  function detect() {
    try {
      var q = new URLSearchParams(location.search).get("lang")
      if (q && LANGS.indexOf(q) >= 0) return q
    } catch (e) {}
    try {
      var s = localStorage.getItem(STORE_KEY)
      if (s && LANGS.indexOf(s) >= 0) return s
    } catch (e) {}
    try {
      if ((navigator.language || "").toLowerCase().indexOf("zh") === 0)
        return "zh-CN"
    } catch (e) {}
    return "en"
  }

  function apply(lang) {
    var dict = I18N[lang] || I18N.en
    document.documentElement.lang = lang
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n")
      if (!key || dict[key] == null) return
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = dict[key]
      else el.textContent = dict[key]
    })
    if (dict["page.title"]) document.title = dict["page.title"]
    var meta = document.querySelector('meta[name="description"]')
    if (meta && dict["page.desc"])
      meta.setAttribute("content", dict["page.desc"])
    var sel = document.getElementById("langSwitch")
    if (sel) sel.value = lang
    try {
      localStorage.setItem(STORE_KEY, lang)
    } catch (e) {}
  }

  function boot() {
    var sel = document.getElementById("langSwitch")
    if (sel) {
      sel.innerHTML = LANGS.map(function (l) {
        return '<option value="' + l + '">' + (LANG_LABEL[l] || l) + "</option>"
      }).join("")
      sel.addEventListener("change", function () {
        apply(sel.value)
      })
    }
    apply(detect())
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot)
  else boot()
})()
