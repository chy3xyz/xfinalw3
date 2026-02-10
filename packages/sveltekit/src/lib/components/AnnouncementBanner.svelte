<script lang="ts">
  import { onMount } from 'svelte';
  
  let container: HTMLDivElement;
  let isVisible = true;
  
  // 示例通告内容
  const announcements = [
    '欢迎使用 xfinalw3 Web3 开发框架！',
    'Welcome to xfinalw3 Web3 Development Framework!',
    '🚀 快速开始：bun chain → bun deploy:local → bun start',
  ];
  
  let currentIndex = 0;
  
  onMount(() => {
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % announcements.length;
    }, 3000);
    
    return () => clearInterval(interval);
  });
  
  function closeBanner() {
    isVisible = false;
  }
</script>

{#if isVisible}
  <div bind:this={container} class="announcement-banner bg-[var(--luke-primary)]/10 border-b border-[var(--luke-primary)]/20">
    <div class="relative overflow-hidden h-10 flex items-center">
      <div class="animate-marquee flex whitespace-nowrap">
        {#each announcements as announcement, i}
          <span class="px-8 text-sm text-[var(--luke-primary)] font-medium">
            {announcement}
          </span>
        {/each}
        <!-- 重复一次以实现无缝循环 -->
        {#each announcements as announcement, i}
          <span class="px-8 text-sm text-[var(--luke-primary)] font-medium">
            {announcement}
          </span>
        {/each}
      </div>
      <button
        on:click={closeBanner}
        class="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--luke-primary)]/70 hover:text-[var(--luke-primary)] transition-colors"
        aria-label="关闭通告"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
{/if}

<style>
  .announcement-banner {
    position: relative;
    z-index: 40;
  }
</style>
