import type { Types } from "@pyrpc/types";
import { createNextClient, httpLink } from "@pyrpc/next";

export const api = createNextClient<Types>({
  links: [
    httpLink({ url: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000" }),
  ],
});