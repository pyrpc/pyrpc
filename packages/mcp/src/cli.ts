#!/usr/bin/env node
/**
 * pyRPC remote documentation MCP setup.
 *
 * Thin branded convenience command around the add-mcp configuration engine:
 * this CLI owns identity and UX only. All client-specific behavior (config
 * paths, formats, merge semantics, agent detection, transport mapping) is
 * delegated to add-mcp's programmatic API.
 */

import { pathToFileURL } from "node:url";
import { Command } from "commander";
import * as p from "@clack/prompts";
import {
  detectGlobalAgents,
  detectProjectAgents,
  getAgentTypes,
  upsertServer,
} from "add-mcp";

import { REMOTE_MCP_URL, SERVER_NAME } from "./constants.js";

type Scope = "local" | "global";

function canonicalAgent(raw: string): string | null {
  // Exact canonical names only; add-mcp owns aliases internally.
  const name = raw.trim().toLowerCase();
  const types = getAgentTypes() as string[];
  return types.includes(name) ? name : null;
}

function parseAgents(values: string[]): { agents: string[]; invalid: string[] } {
  const agents: string[] = [];
  const invalid: string[] = [];
  for (const value of values) {
    const canonical = canonicalAgent(value);
    if (canonical === null || agents.includes(canonical)) {
      if (!canonical) invalid.push(value);
      continue;
    }
    agents.push(canonical);
  }
  return { agents, invalid };
}

async function resolveTargets(): Promise<string[] | null> {
  const project = detectProjectAgents(process.cwd());
  const global = await detectGlobalAgents();
  const detected = new Set<string>([...project, ...global]);
  const types = getAgentTypes();

  const selected = await p.multiselect({
    message: `Agents to configure for ${SERVER_NAME}`,
    options: types.map((agent) => ({
      value: agent,
      label: agent,
      hint: detected.has(agent) ? "detected" : undefined,
    })),
    initialValues: [...detected],
    required: true,
  });
  if (p.isCancel(selected)) return null;
  return selected;
}

async function resolveScope(flagScope: "local" | "global" | undefined): Promise<Scope> {
  if (flagScope === "global") return "global";
  if (flagScope === "local") return "local";
  const scope = await p.select({
    message: "Install scope",
    initialValue: "local",
    options: [
      { value: "local", label: "Project", hint: "current repository (recommended)" },
      { value: "global", label: "Global", hint: "your user account" },
    ],
  });
  if (p.isCancel(scope)) process.exit(0);
  return scope as Scope;
}

export async function runMcp(argv: string[]): Promise<number> {
  let exitCode = 0;
  const program = new Command();
  program
    .name("pyrpc")
    .description("pyRPC command-line utilities")
    .showHelpAfterError("(run 'pyrpc mcp --help' for MCP setup)");

  program
    .command("mcp")
    .description(
      `Configure your AI coding agent to use the pyRPC documentation MCP at ${REMOTE_MCP_URL}`,
    )
    .option("-g, --global", "install into user-level config instead of project")
    .option(
      "-a, --agent <name...>",
      "agent(s) to configure, skipping selection (see --list)",
    )
    .option("-l, --list", "list supported agents and exit")
    .action(async (options) => {
      if (options.list) {
        for (const agent of getAgentTypes()) {
          console.log(`  ${agent}`);
        }
        return;
      }

      p.intro("pyRPC documentation MCP");
      p.log.message(
        [
          `This connects your AI coding agent to the hosted, read-only`,
          `pyRPC docs server: ${REMOTE_MCP_URL}`,
          "",
          "Looking for the local project MCP instead?",
          '  uv add "pyrpc-core[mcp]" && pyrpc mcp',
        ].join("\n"),
      );

      let targets: string[] | null;
      let scope: Scope;
      if (options.agent !== undefined) {
        const parsed = parseAgents(options.agent as string[]);
        if (parsed.invalid.length > 0) {
          p.log.error(
            `Unknown agent(s): ${parsed.invalid.join(", ")}. Run 'npx pyrpc mcp --list'.`,
          );
          exitCode = 1;
          return;
        }
        if (parsed.agents.length === 0) {
          p.log.warn("No agents specified.");
          return;
        }
        targets = parsed.agents;
        scope = await resolveScope(options.global ? "global" : "local");
      } else {
        targets = await resolveTargets();
        if (targets === null) {
          p.outro("Cancelled.");
          return;
        }
        scope = await resolveScope(options.global ? "global" : "local");
      }

      const s = p.spinner();
      let failures = 0;
      for (const agent of targets) {
        s.start(`Configuring ${agent}`);
        const result = upsertServer(
          agent,
          SERVER_NAME,
          { type: "http", url: REMOTE_MCP_URL },
          { local: scope === "local", cwd: process.cwd() },
        );
        if (result.success) {
          s.stop(`${agent}: configured (${result.path})`);
        } else {
          s.stop(`${agent}: failed`);
          p.log.error(result.error ?? "unknown error");
          if ((result.error ?? "").includes("project-level")) {
            p.log.message(`  Hint: retry ${agent} with --global.`);
          }
          failures += 1;
        }
      }

      p.outro(
        failures === 0
          ? `Done. Reload your agent to pick up ${SERVER_NAME}.`
          : `${failures} agent(s) failed; others were configured.`,
      );
      exitCode = failures === 0 ? 0 : 1;
    });

  await program.parseAsync(argv, { from: "user" });
  return exitCode;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  runMcp(process.argv.slice(2)).then((code) => process.exit(code));
}
