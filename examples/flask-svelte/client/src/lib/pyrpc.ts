import type { Types } from "@pyrpc/types";
import { createSvelteClient, httpLink } from "@pyrpc/svelte";

export const api = createSvelteClient<Types>({
  links: [httpLink({ url: "http://localhost:5000" })],
});