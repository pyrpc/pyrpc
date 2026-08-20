# @pyrpc/react

```tsx
import { createReactClient, httpLink } from "@pyrpc/react"
import type { Types } from "@pyrpc/types"

export const api = createReactClient<Types>({
  links: [httpLink({ url: "http://localhost:8000" })],
})

<api.Provider>{children}</api.Provider>
api.greet.useQuery({ name: "Ada" })
```