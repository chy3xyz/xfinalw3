<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  
  export let currentPage: number;
  export let totalItems: number;
  export let setCurrentPage: (page: number) => void;
  export let itemsPerPage: number = 20;

  $: totalPages = Math.ceil(totalItems / itemsPerPage);

  function goToPage(page: number) {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  }
</script>

<div class="flex justify-center items-center gap-4 py-4 text-white">
  <Button
    type="button"
    size="lg"
    class="min-w-[100px]"
    disabled={currentPage === 0}
    onclick={() => goToPage(currentPage - 1)}
  >
    Previous
  </Button>
  <span class="px-4 py-2 text-sm text-white/90 font-medium whitespace-nowrap">
    Page {currentPage + 1} of {totalPages || 1}
  </span>
  <Button
    type="button"
    size="lg"
    class="min-w-[100px]"
    disabled={currentPage >= totalPages - 1}
    onclick={() => goToPage(currentPage + 1)}
  >
    Next
  </Button>
</div>

