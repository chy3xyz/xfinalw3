<script lang="ts">
  import { page } from '$app/stores';
  import { locale, t } from '$lib/i18n/index.js';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils/cn.js';
  
  interface NavItem {
    path: string;
    labelKey: string;
    icon: string;
  }
  
  const navItems: NavItem[] = [
    { path: '/', labelKey: 'nav.home', icon: 'home' },
    { path: '/debug', labelKey: 'nav.debug', icon: 'debug' },
    { path: '/blockexplorer', labelKey: 'nav.blockexplorer', icon: 'explorer' }
  ];
  
  function isActive(path: string, currentPath: string): boolean {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  }
</script>

<nav class="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50">
  <div class="max-w-lg mx-auto flex justify-around items-center h-[72px] px-2">
    {#each navItems as item}
      {@const active = isActive(item.path, $page.url.pathname)}
      <Button
        href={item.path}
        variant="ghost"
        class={cn(
          "flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-1 transition-colors rounded-lg",
          active
            ? "text-yellow-400 hover:text-yellow-400/90"
            : "text-white/70 hover:bg-muted/50 hover:text-white"
        )}
      >
        {#if item.icon === 'home'}
          <svg class={cn("fill-none stroke-current", active ? "w-14 h-14" : "w-12 h-12")} viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        {:else if item.icon === 'debug'}
          <svg class={cn("fill-none stroke-current", active ? "w-14 h-14" : "w-12 h-12")} viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        {:else if item.icon === 'explorer'}
          <svg class={cn("fill-none stroke-current", active ? "w-14 h-14" : "w-12 h-12")} viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        {/if}
        <span class="text-[9px] font-normal tracking-tight">{t(item.labelKey)}</span>
      </Button>
    {/each}
  </div>
</nav>

<!-- Spacer to prevent content from being hidden behind nav -->
<div class="h-[72px]"></div>
