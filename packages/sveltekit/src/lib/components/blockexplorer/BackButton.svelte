<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  
  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      goto('/blockexplorer');
    }
  }
</script>

<Button type="button" size="lg" class="text-white hover:text-white" onclick={handleBack}>
  Back
</Button>

