import { writable } from 'svelte/store';

/**
 * Creates a store for copy to clipboard functionality
 */
export function createCopyToClipboardStore() {
  const isCopiedToClipboard = writable(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      isCopiedToClipboard.set(true);
      setTimeout(() => {
        isCopiedToClipboard.set(false);
      }, 800);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return {
    copyToClipboard,
    isCopiedToClipboard: { subscribe: isCopiedToClipboard.subscribe },
  };
}

