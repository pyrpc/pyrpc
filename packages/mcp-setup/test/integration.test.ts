/**
 * Real integration test against the actual add-mcp API (not mocked).
 *
 * Proves the contract our wrapper depends on: a remote HTTP definition
 * upserted into a project config merges with existing content, preserves
 * unrelated servers, and is idempotent on repeat runs.
 */

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { upsertServer, type McpServerConfig } from "add-mcp";

const REMOTE_MCP_URL = "https://mcp.pyrpc.com/mcp";
const dirs: string[] = [];

afterEach(() => {
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function tempProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "pyrpc-mcp-setup-"));
  dirs.push(dir);
  return dir;
}

function makeConfig(): McpServerConfig {
  return { type: "http", url: REMOTE_MCP_URL };
}

describe("add-mcp integration (claude-code project config)", () => {
  it("writes the pyrpc-docs entry and preserves unrelated servers", () => {
    const cwd = tempProject();

    const unrelatedFirst = upsertServer(
      "claude-code",
      "unrelated-server",
      { type: "http", url: "https://example.com/mcp" },
      { local: true, cwd },
    );
    expect(unrelatedFirst.success).toBe(true);

    const ours = upsertServer("claude-code", "pyrpc-docs", makeConfig(), {
      local: true,
      cwd,
    });
    expect(ours.success).toBe(true);
    expect(ours.path).toContain(".mcp.json");

    const raw = JSON.parse(readFileSync(ours.path, "utf-8"));
    expect(raw.mcpServers["pyrpc-docs"].url).toBe(REMOTE_MCP_URL);
    expect(raw.mcpServers["pyrpc-docs"].type).toBe("http");
    expect(raw.mcpServers["unrelated-server"].url).toBe("https://example.com/mcp");
  });

  it("is idempotent across repeated runs", () => {
    const cwd = tempProject();

    const first = upsertServer("claude-code", "pyrpc-docs", makeConfig(), {
      local: true,
      cwd,
    });
    expect(first.success).toBe(true);
    const afterFirst = readFileSync(first.path, "utf-8");

    const second = upsertServer("claude-code", "pyrpc-docs", makeConfig(), {
      local: true,
      cwd,
    });
    expect(second.success).toBe(true);
    expect(readFileSync(second.path, "utf-8")).toBe(afterFirst);
  });

  it("rejects project scope for global-only agents with a clear error", () => {
    const cwd = tempProject();
    // windsurf has no project-level config path upstream
    const result = upsertServer("windsurf", "pyrpc-docs", makeConfig(), {
      local: true,
      cwd,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("project-level");
  });
});
