# @pyrpc/svelte

Svelte + TanStack Query adapter for [pyRPC](https://pyrpc.com).

Wrap your app with TanStack Svelte Query’s `QueryClientProvider` (library requirement). pyRPC does not add a second provider.

```ts
import { createSvelteClient } from "@pyrpc/svelte"
import type { Types } from "@pyrpc/types"
import { procedureKinds } from "@pyrpc/types"

export const api = createSvelteClient<Types, typeof procedureKinds>({
  baseUrl: "http://localhost:8000",
  kinds: procedureKinds,
})
```

```svelte
<script lang="ts">
  import { api } from "$lib/pyrpc"
  const query = api.greet.createQuery({ name: "Ada" })
</script>

{#if $query.isSuccess}
  <p>{$query.data}</p>
{/if}
```
