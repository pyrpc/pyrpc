import type { Types } from "@pyrpc/types";
import { createPyrpcVue, httpLink } from "@pyrpc/vue";

export const pyrpc = createPyrpcVue<Types>({
  links: [
    httpLink({ url: import.meta.env.VITE_API_URL ?? "http://localhost:5000" }),
  ],
});