<script lang="ts">
  export let bytecode: string;
  export let assembly: string;

  $: formattedAssembly = Array.from(assembly.matchAll(/\w+( 0x[a-fA-F0-9]+)?/g))
    .map((it) => it[0])
    .join('\n');
</script>

<div class="flex flex-col gap-3 p-4">
  <div class="font-bold">Bytecode</div>
  <div class="bg-muted border border-border rounded-lg overflow-y-auto max-h-[500px]">
    <pre class="px-5 py-4 m-0">
      <code class="whitespace-pre-wrap overflow-auto break-words text-sm">{bytecode}</code>
    </pre>
  </div>
  <div class="font-bold">Opcodes</div>
  <div class="bg-muted border border-border rounded-lg overflow-y-auto max-h-[500px]">
    <pre class="px-5 py-4 m-0">
      <code class="text-sm">{formattedAssembly}</code>
    </pre>
  </div>
</div>

