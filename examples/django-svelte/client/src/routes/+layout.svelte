<script lang="ts">
  import { api } from "$lib/pyrpc";
  import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
  
  const queryClient = new QueryClient();
</script>

<QueryClientProvider client={queryClient}>
  <slot />
</QueryClientProvider>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
</style>
