<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import WalletConnectButton from './WalletConnectButton.svelte';
  import FaucetButton from './FaucetButton.svelte';
  import LanguageToggle from './LanguageToggle.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { cn } from '$lib/utils/cn.js';

  // AppKit web components are automatically registered when AppKit is initialized
  // Import appkit only in browser to ensure it's initialized
  if (browser) {
    import('$lib/appkit');
  }

  $: currentPath = $page.url.pathname;
  let mobileMenuOpen = false;

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
</script>

<header class="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
  <div class="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
    <!-- Logo and Navigation -->
    <div class="flex items-center gap-4">
      <a href="/" class="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
        <span class="text-[var(--luke-primary)]">xfinalw3</span>
      </a>
      
      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center gap-1">
        <Button
          href="/debug"
          size="sm"
          variant={currentPath === '/debug' || currentPath.startsWith('/debug/') ? 'secondary' : 'ghost'}
          class={currentPath === '/debug' || currentPath.startsWith('/debug/') ? '!text-[var(--luke-primary)] font-semibold' : 'text-white hover:text-white'}
        >
          Debug
        </Button>
        <Button
          href="/blockexplorer"
          size="sm"
          variant={currentPath === '/blockexplorer' || currentPath.startsWith('/blockexplorer/') ? 'secondary' : 'ghost'}
          class={currentPath === '/blockexplorer' || currentPath.startsWith('/blockexplorer/') ? '!text-[var(--luke-primary)] font-semibold' : 'text-white hover:text-white'}
        >
          Explorer
        </Button>
      </nav>
    </div>
    
    <!-- Right Side Actions -->
    <div class="flex items-center gap-2">
      <!-- Mobile menu button -->
      <div class="relative md:hidden">
        <DropdownMenu.Root open={mobileMenuOpen} onOpenChange={(open) => mobileMenuOpen = open}>
          {#snippet children()}
            <DropdownMenu.Trigger asChild>
              {#snippet child({ props })}
                <Button
                  {...props}
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Toggle menu"
                  class="text-white hover:text-white"
                >
                  {#if mobileMenuOpen}
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  {/if}
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" class="w-48">
              <DropdownMenu.Item onSelect={closeMobileMenu}>
                <a href="/debug" class="w-full text-white">
                  Debug Contracts
                </a>
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={closeMobileMenu}>
                <a href="/blockexplorer" class="w-full text-white">
                  Block Explorer
                </a>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          {/snippet}
        </DropdownMenu.Root>
      </div>
      
      <!-- Language Toggle -->
      {#if browser}
        <LanguageToggle />
      {/if}
      
      <!-- Wallet connection button -->
      {#if browser}
        <WalletConnectButton />
        <!-- <FaucetButton /> -->
      {:else}
        <!-- SSR Skeleton placeholder -->
        <Skeleton class="h-8 w-32" />
      {/if}
    </div>
  </div>
</header>
