import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = ({ error, event }) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error('[Server Error] ==========================================');
  console.error('[Server Error] URL:', event.url.pathname);
  console.error('[Server Error] Error:', errorMessage);
  if (errorStack) {
    console.error('[Server Error] Stack:', errorStack);
  }
  if (error instanceof Error && 'cause' in error) {
    console.error('[Server Error] Cause:', (error as any).cause);
  }
  console.error('[Server Error] ==========================================');

  return {
    message: errorMessage,
  };
};

