// @pyrpc/types
//
// This placeholder is active until `pyrpc dev` runs for the first time and
// generates your real types into <client>/__pyrpc.ts.
//
// Your tsconfig.json should contain (injected automatically by pyrpc dev
// via jsonc-edit):
//   "paths": { "@pyrpc/types": ["./__pyrpc.ts"] }
//
// Bundlers that ignore tsconfig paths for imports inside node_modules
// (Vite, SvelteKit, Next.js Turbopack) must alias "@pyrpc/types" to
// ./__pyrpc.ts explicitly — pyrpc dev configures this for known frameworks.
//
// If a bundler still resolves this placeholder, accessing a procedure
// throws instead of silently exposing both query and mutation hooks.

export type Types = Record<string, never>;

/** @internal Runtime kind map — populated by pyrpc dev codegen. */
export type ProcedureKinds = Record<string, never>;

/** @internal Runtime kind map — populated by pyrpc dev codegen. */
export const procedureKinds: ProcedureKinds = new Proxy(
  {} as ProcedureKinds,
  {
    get() {
      throw new Error(
        "pyRPC: '@pyrpc/types' is still the placeholder — the generated " +
          "__pyrpc.ts is not being resolved. Run `pyrpc dev` and make sure " +
          '"@pyrpc/types" resolves to your generated "./__pyrpc.ts" (tsconfig ' +
          'paths or a bundler alias) so procedureKinds loads from codegen output.',
      );
    },
  },
);
