import type { Types } from "@pyrpc/types";
import { createPyrpcVue } from "@pyrpc/vue";

export const pyrpc = createPyrpcVue<Types>({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
});
