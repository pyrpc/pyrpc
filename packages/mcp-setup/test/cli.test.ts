import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => {
  return {
    multiselect: vi.fn(),
    select: vi.fn(),
    isCancel: vi.fn(() => false),
    spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
    intro: vi.fn(),
    outro: vi.fn(),
    log: { message: vi.fn(), error: vi.fn(), warn: vi.fn() },
    upsertServer: vi.fn(),
  };
});

vi.mock("@clack/prompts", () => ({
  default: {},
  ...mocks,
}));

// Mock only the mutating API; keep detection/listing functions real.
vi.mock("add-mcp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("add-mcp")>();
  return {
    ...actual,
    upsertServer: mocks.upsertServer,
  };
});

import { runMcp } from "../src/cli.js";


mocks.upsertServer.mockReturnValue({
  success: true,
  path: "/tmp/fake/.mcp.json",
});

describe("pyrpc mcp (wrapper behavior)", () => {
  beforeEach(() => {
    mocks.upsertServer.mockClear();
    mocks.multiselect.mockClear();
    mocks.select.mockClear();
    mocks.log.error.mockClear();
  });

  it("configures selected agents with the constant URL, name, and scope", async () => {
    mocks.multiselect.mockResolvedValue(["claude-code", "cursor"]);
    mocks.select.mockResolvedValue("local");

    const code = await runMcp(["mcp"]);

    expect(code).toBe(0);
    expect(mocks.upsertServer).toHaveBeenCalledTimes(2);
    expect(mocks.upsertServer).toHaveBeenCalledWith(
      "claude-code",
      "pyrpc-docs",
      { type: "http", url: "https://mcp.pyrpc.com/mcp" },
      { local: true, cwd: process.cwd() },
    );
    expect(mocks.upsertServer).toHaveBeenCalledWith(
      "cursor",
      "pyrpc-docs",
      { type: "http", url: "https://mcp.pyrpc.com/mcp" },
      { local: true, cwd: process.cwd() },
    );
  });

  it("passes global scope for a canonical agent name", async () => {
    mocks.upsertServer.mockClear();
    mocks.select.mockResolvedValue("global");

    const code = await runMcp(["mcp", "--agent", "gemini-cli", "-g"]);

    expect(code).toBe(0);
    expect(mocks.multiselect).not.toHaveBeenCalled();
    expect(mocks.upsertServer).toHaveBeenCalledWith(
      "gemini-cli",
      "pyrpc-docs",
      { type: "http", url: "https://mcp.pyrpc.com/mcp" },
      { local: false, cwd: process.cwd() },
    );
  });

  it("rejects unknown agent names with a nonzero exit code", async () => {
    const code = await runMcp(["mcp", "--agent", "not-an-agent"]);
    expect(code).toBe(1);
    expect(mocks.upsertServer).not.toHaveBeenCalled();
    expect(mocks.log.error).toHaveBeenCalledWith(
      expect.stringContaining("Unknown agent(s): not-an-agent"),
    );
  });

  it("lists agents without configuring anything", async () => {
    mocks.upsertServer.mockClear();
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((line) => {
      logs.push(String(line));
    });

    const code = await runMcp(["mcp", "--list"]);
    spy.mockRestore();

    expect(code).toBe(0);
    expect(mocks.upsertServer).not.toHaveBeenCalled();
    expect(logs.join("\n")).toContain("claude-code");
    expect(logs.join("\n")).toContain("cursor");
  });

  it("surfaces add-mcp failures with a nonzero exit code", async () => {
    mocks.upsertServer.mockClear();
    mocks.upsertServer.mockReturnValueOnce({
      success: false,
      path: "",
      error: "claude-desktop does not support project-level config",
    });
    mocks.multiselect.mockResolvedValue(["claude-desktop"]);

    const code = await runMcp(["mcp"]);

    expect(code).toBe(1);
    expect(mocks.log.error).toHaveBeenCalledWith(
      expect.stringContaining("does not support project-level config"),
    );
  });
});
