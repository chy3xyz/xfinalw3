<script lang="ts">
  // Shared blockexplorer styling: dark theme + light text for contrast on black background
</script>

<style>
  :global(.blockexplorer-page) {
    color: var(--color-foreground);
  }
</style>

<div class="blockexplorer-page" data-theme="dark">
  <slot />
</div>
