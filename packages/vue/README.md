# @pyrpc/vue

Vue 3 + TanStack Query adapter for [pyRPC](https://pyrpc.com).

Register TanStack’s `VueQueryPlugin` on your app (same as any Vue Query app). pyRPC does not add a second context provider.

```ts
import { VueQueryPlugin } from "@tanstack/vue-query"
import { createVueClient } from "@pyrpc/vue"
import type { Types } from "@pyrpc/types"
import { procedureKinds } from "@pyrpc/types"

export const api = createVueClient<Types, typeof procedureKinds>({
  baseUrl: "http://localhost:8000",
  kinds: procedureKinds,
})
```
