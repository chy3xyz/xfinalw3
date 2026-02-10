<script lang="ts">
  import { locale, setLocale, type Locale } from '$lib/i18n/index.js';
  
  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];
  
  let isOpen = false;
  
  function handleLanguageChange(newLocale: Locale) {
    setLocale(newLocale);
    isOpen = false;
  }
</script>

<div class="relative">
  <button
    class="flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border hover:bg-accent transition-colors"
    on:click={() => isOpen = !isOpen}
    type="button"
    title="切换语言 / Switch Language"
    aria-label="切换语言"
  >
    <span class="text-xl">{languages.find(l => l.code === $locale)?.flag || '🌐'}</span>
  </button>
  
  {#if isOpen}
    <div class="absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
      {#each languages as lang}
        <button
          class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors
                 {$locale === lang.code ? 'bg-primary/10 text-primary' : 'text-foreground'}"
          on:click={() => handleLanguageChange(lang.code)}
          type="button"
        >
          <span class="text-lg">{lang.flag}</span>
          <span class="text-sm font-medium">{lang.label}</span>
          {#if $locale === lang.code}
            <svg class="w-4 h-4 ml-auto text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<!-- Click outside to close -->
{#if isOpen}
  <div
    class="fixed inset-0 z-40"
    on:click={() => isOpen = false}
    role="button"
    tabindex="-1"
  ></div>
{/if}

