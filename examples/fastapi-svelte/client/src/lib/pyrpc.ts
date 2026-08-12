import type { Types } from "@pyrpc/types";
import { createSvelteClient } from "@pyrpc/svelte";

export const api = createSvelteClient<Types>({
  baseUrl: "http://localhost:8000",
});
