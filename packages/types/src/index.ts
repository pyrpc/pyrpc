// @pyrpc/types
//
// This stub is active until `pyrpc dev` runs for the first time and generates
// your real types into <client>/__pyrpc.d.ts.
//
// Your tsconfig.json should contain (injected automatically by pyrpc dev
// via jsonc-edit):
//   "paths": { "@pyrpc/types": ["./__pyrpc.d.ts"] }
//
// Once that alias is in place and pyrpc dev has run, this stub is bypassed
// entirely — TypeScript resolves the import to your generated file instead.
//
// Run `pyrpc dev` to get started.

export type Types = Record<string, never>;

/** @internal Runtime kind map — populated by pyrpc dev codegen. */
export type ProcedureKinds = Record<string, never>;

/** @internal Runtime kind map — populated by pyrpc dev codegen. */
export const procedureKinds = {} as const satisfies ProcedureKinds;
