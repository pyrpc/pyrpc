import type { Types } from "@pyrpc/types";
import { createReactClient, httpLink } from "@pyrpc/react";

export const api = createReactClient<Types>({
  links: [
    httpLink({ url: process.env.REACT_APP_API_URL ?? "http://localhost:5000" }),
  ],
});