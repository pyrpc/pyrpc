# @pyrpc/next

```ts
import { createNextClient } from "@pyrpc/next"
import type { Types } from "@pyrpc/types"

export const api = createNextClient<Types>({ baseUrl: process.env.PYRPC_URL! })
```

```tsx
<api.Provider>{children}</api.Provider>

// server
await api.prefetch.greet("Ada")
<api.HydrationBoundary state={api.dehydrate()}><Child /></api.HydrationBoundary>

// client
api.greet.useQuery("Ada")
```
