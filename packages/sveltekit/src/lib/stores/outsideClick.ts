import type { Action } from 'svelte/action';

/**
 * Svelte action to handle clicks outside of an element
 * @param node - the element to attach the action to
 * @param callback - callback function to call when clicked outside
 */
export const outsideClick: Action<HTMLElement, (() => void) | undefined> = (node, callback) => {
  function handleOutsideClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) {
      return;
    }

    if (node && !node.contains(event.target)) {
      callback?.();
    }
  }

  document.addEventListener('click', handleOutsideClick);

  return {
    update(newCallback) {
      callback = newCallback;
    },
    destroy() {
      document.removeEventListener('click', handleOutsideClick);
    },
  };
};

