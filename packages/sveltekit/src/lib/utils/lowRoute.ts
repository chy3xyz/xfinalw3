/**
 * 低配版本路由工具函数
 * 确保低配版本的所有路由都指向 /low 路径
 */

/**
 * 将普通路由转换为低配版本路由
 * @param path 原始路径（如 '/' 或 '/community'）
 * @returns 低配版本路径（如 '/low' 或 '/low/community'）
 */
export function toLowRoute(path: string): string {
  // 如果已经是 /low 路径，直接返回
  if (path.startsWith('/low')) {
    return path;
  }
  
  // 如果是根路径，返回 /low
  if (path === '/' || path === '') {
    return '/low';
  }
  
  // 其他路径添加 /low 前缀
  return `/low${path}`;
}

/**
 * 检查当前是否是低配版本路由
 * @param path 当前路径
 * @returns 是否是低配版本路由
 */
export function isLowRoute(path: string): boolean {
  return path.startsWith('/low') || path === '/low';
}

/**
 * 获取低配版本的基础路由
 */
export const LOW_BASE_ROUTE = '/low';

/**
 * 低配版本路由映射
 */
export const LOW_ROUTES = {
  home: '/low',
  community: '/low/community',
  my: '/low/my',
  debug: '/debug-low'
} as const;

