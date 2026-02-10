<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import type { Address } from 'viem';
  import { targetNetwork } from '$lib/stores/targetNetwork.js';
  import { getBlockExplorerAddressLink } from '$lib/utils/networks.js';
  import { hardhat } from 'viem/chains';

  export let address: Address;
  export let modalId: string;

  let qrCodeSvg: string = '';
  const isOpen = writable(false);
  let modalElement: HTMLDivElement;

  onMount(async () => {
    if (browser) {
      try {
        // @ts-ignore - qrcode types may not be resolved correctly in Svelte
        const qrcode = await import('qrcode');
        qrCodeSvg = await qrcode.toString(address, {
          type: 'svg',
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        qrCodeSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" font-size="12" fill="#666">QR Code</text></svg>`;
      }

      // Listen for checkbox changes
      const checkbox = document.getElementById(modalId) as HTMLInputElement;
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          isOpen.set(checkbox.checked);
        });
      }
    }
  });

  function closeModal() {
    const checkbox = document.getElementById(modalId) as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = false;
      isOpen.set(false);
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === modalElement) {
      closeModal();
    }
  }

  function handleBackdropKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' || e.key === 'Enter') {
      if (e.target === modalElement) {
        closeModal();
      }
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeModal();
    }
  }

  function copyAddress() {
    navigator.clipboard.writeText(address);
  }

  function shortenAddress(addr: string): string {
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  }

  $: blockExplorerAddressLink = $targetNetwork.id === hardhat.id
    ? `/blockexplorer/address/${address}`
    : getBlockExplorerAddressLink($targetNetwork, address);
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Hidden checkbox for modal state -->
<input type="checkbox" id={modalId} class="hidden" />

<!-- Modal backdrop and content -->
{#if $isOpen}
  <div
    bind:this={modalElement}
    class="qr-modal-backdrop"
    role="button"
    tabindex="0"
    on:click={handleBackdropClick}
    on:keydown={handleBackdropKeydown}
    aria-label="Close modal"
  >
    <div
      class="qr-modal-box"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="qr-modal-header">
        <h3>Wallet QR Code</h3>
        <button
          type="button"
          class="qr-modal-close"
          on:click={closeModal}
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="qr-modal-body">
        <!-- QR Code -->
        <div class="qr-code-wrapper">
          {#if qrCodeSvg}
            <div class="qr-code-container">
              {@html qrCodeSvg}
            </div>
          {:else}
            <div class="qr-code-loading">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75"></path>
              </svg>
            </div>
          {/if}
        </div>

        <!-- Address -->
        <div class="qr-address-section">
          <p class="qr-address-label">Scan to get wallet address</p>
          
          <div class="qr-address-box">
            <code class="qr-address-text">
              {shortenAddress(address)}
            </code>
            <button
              type="button"
              class="qr-copy-btn"
              on:click={copyAddress}
              title="Copy address"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- View on explorer link -->
        {#if blockExplorerAddressLink}
          <a
            href={blockExplorerAddressLink}
            target="_blank"
            rel="noopener noreferrer"
            class="qr-explorer-link"
          >
            View on Block Explorer
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .qr-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }

  .qr-modal-box {
    position: relative;
    width: 100%;
    max-width: 380px;
    margin: 0 16px;
    background-color: var(--color-card, #fff);
    color: var(--color-card-foreground, #000);
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid var(--color-border, #e5e7eb);
    overflow: hidden;
  }

  .qr-modal-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  .qr-modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-foreground, #000);
  }

  .qr-modal-close {
    padding: 6px;
    border: none;
    background: transparent;
    border-radius: 6px;
    color: var(--color-muted-foreground, #6b7280);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .qr-modal-close:hover {
    background-color: var(--color-accent, #f3f4f6);
    color: var(--color-foreground, #000);
  }

  .qr-modal-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 24px;
  }

  .qr-code-wrapper {
    background-color: #fff;
    padding: 12px;
    border-radius: 8px;
    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
  }

  .qr-code-container :global(svg) {
    display: block;
    width: 200px;
    height: 200px;
  }

  .qr-code-loading {
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-muted, #f3f4f6);
    border-radius: 4px;
    animation: pulse 2s infinite;
  }

  .qr-code-loading svg {
    animation: spin 1s linear infinite;
    color: var(--color-muted-foreground, #6b7280);
  }

  .qr-address-section {
    width: 100%;
    text-align: center;
  }

  .qr-address-label {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: var(--color-muted-foreground, #6b7280);
  }

  .qr-address-box {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: var(--color-muted, #f3f4f6);
    border-radius: 8px;
  }

  .qr-address-text {
    font-size: 13px;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    color: var(--color-foreground, #000);
    word-break: break-all;
  }

  .qr-copy-btn {
    flex-shrink: 0;
    padding: 6px;
    border: none;
    background: transparent;
    border-radius: 6px;
    color: var(--color-muted-foreground, #6b7280);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .qr-copy-btn:hover {
    background-color: var(--color-accent, #e5e7eb);
    color: var(--color-foreground, #000);
  }

  .qr-explorer-link {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--color-primary, #000);
    text-decoration: none;
    transition: all 0.15s;
  }

  .qr-explorer-link:hover {
    text-decoration: underline;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>

