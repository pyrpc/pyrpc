# @pyrpc/next

```ts
import { createNextClient, httpLink } from "@pyrpc/next"
import type { Types } from "@pyrpc/types"

export const api = createNextClient<Types>({
  links: [httpLink({ url: process.env.PYRPC_URL ?? "http://localhost:8000" })],
})
```

```tsx
<api.Provider>{children}</api.Provider>

// server
await api.prefetch.greet("Ada")
<api.HydrationBoundary state={api.dehydrate()}><Child /></api.HydrationBoundary>

// client
api.greet.useQuery("Ada")
```