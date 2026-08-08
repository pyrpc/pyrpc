import type { Types } from "@pyrpc/types";
import { createReactClient } from "@pyrpc/react";

export const api = createReactClient<Types>({
  baseUrl: process.env.REACT_APP_API_URL ?? "http://localhost:5000",
});
