import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const txHash = params.txHash as `0x${string}`;
  return { txHash };
};

export const prerender = false;
