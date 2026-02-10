/**
 * Tailwind CSS 加载器
 * 已回归到现代模式，不再使用双 Tailwind 模式
 */

export function isLowKernel(): boolean {
  // 已取消低配内核检测，统一使用现代模式
  return false;
}

export function injectTailwindCss() {
  // 已取消动态加载 Tailwind CSS
  // Tailwind CSS 现在通过 app.css 正常导入
  // 此函数保留以避免破坏现有代码，但不执行任何操作
}
