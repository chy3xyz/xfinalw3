// 客户端加载 - 用于静态网站部署
// 注意：由于静态网站无法使用服务器端加载，这里改为客户端加载
import type { PageLoad } from './$types';
import type { Address } from 'viem';
import { browser } from '$app/environment';

// 客户端加载函数
export const load: PageLoad = async ({ params, fetch }) => {
  const address = params.address as Address;
  
  // 在客户端环境中，我们可以通过 API 路由获取数据
  // 或者直接在客户端处理
  // 由于这是静态网站，我们返回基本数据，让组件在客户端处理
  
  return {
    address,
    contractData: null // 在客户端组件中获取
  };
};

// 标记此路由不预渲染（动态路由）
export const prerender = false;

