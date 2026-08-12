import type { Types } from "@pyrpc/types";
import { createNextClient } from "@pyrpc/next";

export const api = createNextClient<Types>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
});
