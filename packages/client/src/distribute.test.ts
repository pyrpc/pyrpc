import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { execFile } from 'child_process';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// ── toTs ──────────────────────────────────────────────────────────────────────

describe('toTs (type conversion)', () => {
  async function loadCli() {
    const mod = await import('../cli.js');
    return mod.toTs as (t: string) => string;
  }

  let toTs: (t: string) => string;

  beforeAll(async () => {
    toTs = await loadCli();
  });

  it('converts <class format> primitives', () => {
    expect(toTs("<class 'int'>")).toBe('number');
    expect(toTs("<class 'float'>")).toBe('number');
    expect(toTs("<class 'str'>")).toBe('string');
    expect(toTs("<class 'bool'>")).toBe('boolean');
    expect(toTs("<class 'NoneType'>")).toBe('null');
    expect(toTs("<class 'Any'>")).toBe('any');
  });

  it('preserves PascalCase class names as-is', () => {
    expect(toTs("<class 'MyModel'>")).toBe('MyModel');
    expect(toTs("<class 'UserProfile'>")).toBe('UserProfile');
  });

  it('converts unknown class names to PascalCase for model reference', () => {
    expect(toTs("<class 'unknown_thing'>")).toBe('UnknownThing');
  });

  it('handles None and empty', () => {
    expect(toTs('None')).toBe('void');
    expect(toTs('')).toBe('void');
    expect(toTs(undefined as any)).toBe('void');
  });

  it('converts Optional with class format', () => {
    expect(toTs("typing.Optional[<class 'str'>]")).toBe('string | null');
    expect(toTs("typing.Optional[<class 'int'>]")).toBe('number | null');
  });

  it('converts List with class format', () => {
    expect(toTs("typing.List[<class 'int'>]")).toBe('number[]');
    expect(toTs("typing.List[<class 'str'>]")).toBe('string[]');
  });

  it('converts Dict with class format', () => {
    expect(toTs("typing.Dict[<class 'str'>, <class 'int'>]")).toBe('Record<string, number>');
  });

  it('converts Union with class format', () => {
    expect(toTs("typing.Union[<class 'str'>, <class 'int'>]")).toBe('string | number');
  });

  it('converts Tuple with class format', () => {
    expect(toTs("typing.Tuple[<class 'str'>, <class 'int'>]")).toBe('[string, number]');
  });

  it('returns any for unknown types', () => {
    expect(toTs('weird_type')).toBe('any');
  });
});

// ── generate ──────────────────────────────────────────────────────────────────

describe('generate (TypeScript codegen)', () => {
  async function loadCli() {
    const mod = await import('../cli.js');
    return mod.generate as (schemas: any) => string;
  }

  let generate: (schemas: any) => string;

  beforeAll(async () => {
    generate = await loadCli();
  });

  it('generates interfaces for a single procedure', () => {
    const schemas = {
      add: {
        parameters: [
          { name: 'a', type: "<class 'int'>" },
          { name: 'b', type: "<class 'int'>" },
        ],
        return_type: "<class 'int'>",
      },
    };
    const output = generate(schemas);
    expect(output).toContain('export interface addParams');
    expect(output).toContain('export interface addResult');
    expect(output).toContain('a: number');
    expect(output).toContain('b: number');
    expect(output).toContain('data: number');
    expect(output).toContain('add: { params: addParams; result: addResult }');
  });

  it('generates interfaces for multiple procedures', () => {
    const schemas = {
      add: { parameters: [], return_type: "<class 'int'>" },
      greet: {
        parameters: [{ name: 'name', type: "<class 'str'>" }],
        return_type: "<class 'str'>",
      },
    };
    const output = generate(schemas);
    expect(output).toContain('export interface addParams');
    expect(output).toContain('export interface greetParams');
    expect(output).toContain('name: string');
    expect(output).toContain('add: { params: addParams; result: addResult }');
    expect(output).toContain('greet: { params: greetParams; result: greetResult }');
  });

  it('handles empty schemas', () => {
    const output = generate({});
    expect(output).toContain('export interface Types');
    expect(output).not.toContain('undefinedParams');
  });
});

// ── cli.js main() behavior ────────────────────────────────────────────────────

describe('cli.js main()', () => {
  let main: (...args: any[]) => Promise<void>;

  beforeAll(async () => {
    const mod = await import('../cli.js');
    main = mod.main;
  });

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('--help', () => {
    it('prints help text', async () => {
      vi.spyOn(process.argv, 'slice').mockReturnValue(['--help']);
      await main();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('pyRPC client CLI')
      );
    });
  });

  describe('unknown command', () => {
    it('prints unknown command message', async () => {
      vi.spyOn(process.argv, 'slice').mockReturnValue(['unknown-cmd']);
      await main();
      expect(console.log).toHaveBeenCalledWith('Unknown command: unknown-cmd');
    });
  });

  describe('no config found', () => {
    it('prints no-config message', async () => {
      vi.spyOn(process.argv, 'slice').mockReturnValue([]);
      vi.spyOn(require('fs'), 'existsSync').mockReturnValue(false);
      await main();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('No pyrpc-client.json found')
      );
    });
  });

  describe('workspace mode', () => {
    it('prints nothing-to-sync message', async () => {
      vi.spyOn(process.argv, 'slice').mockReturnValue([]);
      vi.spyOn(require('fs'), 'existsSync').mockImplementation(
        (p: string) => p.toString().endsWith('pyrpc-client.json')
      );
      vi.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        JSON.stringify({ distribution: 'workspace' })
      );
      await main();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Nothing to sync')
      );
    });
  });

  describe('server mode', () => {
    beforeEach(() => {
      vi.spyOn(process.argv, 'slice').mockReturnValue([]);
      vi.spyOn(require('fs'), 'existsSync').mockImplementation(
        (p: string) => p.toString().endsWith('pyrpc-client.json')
      );
      vi.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        JSON.stringify({
          distribution: 'server',
          server_url: 'http://localhost:8000',
        })
      );
      vi.spyOn(require('fs'), 'mkdirSync').mockImplementation(() => {});
      vi.spyOn(require('fs'), 'writeFileSync').mockImplementation(() => {});
    });

    it('fetches schema and writes types on success', async () => {
      const { Readable } = require('stream');
      const mockRes = new Readable({
        read() {
          this.push(
            JSON.stringify({
              add: {
                parameters: [{ name: 'a', type: "<class 'int'>" }],
                return_type: "<class 'int'>",
              },
            })
          );
          this.push(null);
        },
      });
      mockRes.statusCode = 200;

      vi.spyOn(require('http'), 'get').mockImplementation(
        (_url: any, cb: any) => {
          cb(mockRes);
          return { on: vi.fn() };
        }
      );

      await main();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Types synced')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('1 procedures')
      );
    });

    it('handles fetch error gracefully', async () => {
      const mockReq = {
        on: vi.fn((_evt: string, cb: any) =>
          cb(new Error('Connection refused'))
        ),
      };
      vi.spyOn(require('http'), 'get').mockImplementation(() => mockReq);

      await main();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Could not fetch schema')
      );
    });

    it('handles missing server_url', async () => {
      vi.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        JSON.stringify({ distribution: 'server' })
      );
      await main();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('missing server_url')
      );
    });
  });

  describe('unknown distribution', () => {
    it('prints unknown distribution message', async () => {
      vi.spyOn(process.argv, 'slice').mockReturnValue([]);
      vi.spyOn(require('fs'), 'existsSync').mockImplementation(
        (p: string) => p.toString().endsWith('pyrpc-client.json')
      );
      vi.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        JSON.stringify({ distribution: 'unknown' })
      );
      await main();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Unknown distribution')
      );
    });
  });
});

// ── postinstall.js (subprocess tests) ─────────────────────────────────────────

describe('postinstall.js skip conditions (subprocess)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'pyrpc-postinstall-'));
    writeFileSync(join(tmpDir, 'package.json'), JSON.stringify({ name: 'test' }));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function runPostinstall(env: Record<string, string> = {}): Promise<{ stdout: string; code: number | null }> {
    return new Promise((resolve) => {
      const child = execFile(
        'node',
          [require.resolve('../postinstall.js')],
        {
          cwd: tmpDir,
          env: { ...process.env, ...env },
          timeout: 5000,
        },
        (_err, stdout) => {
          resolve({ stdout, code: _err ? (_err as any).code : 0 });
        }
      );
      if (child.stdin) child.stdin.end();
    });
  }

  it('skips when pyrpc-client.json already exists', async () => {
    writeFileSync(
      join(tmpDir, 'pyrpc-client.json'),
      JSON.stringify({ distribution: 'workspace' })
    );
    const { stdout } = await runPostinstall();
    expect(stdout).toBe('');
  });

  it('creates default config in CI environment', async () => {
    const { stdout } = await runPostinstall({ CI: 'true' });
    expect(stdout).toBe('');
    const cfgPath = join(tmpDir, 'pyrpc-client.json');
    expect(existsSync(cfgPath)).toBe(true);
    const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'));
    expect(cfg.distribution).toBe('workspace');
    expect(cfg.server_url).toBe('http://localhost:8000');
  });

  it('creates default config in non-TTY', async () => {
    const { stdout } = await runPostinstall();
    expect(stdout).toBe('');
    const cfgPath = join(tmpDir, 'pyrpc-client.json');
    expect(existsSync(cfgPath)).toBe(true);
    const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'));
    expect(cfg.distribution).toBe('workspace');
    expect(cfg.server_url).toBe('http://localhost:8000');
  });
});

describe('postinstall.js main() via direct import', () => {
  let postinstall: any;

  beforeAll(async () => {
    vi.unmock('readline');
    vi.unmock('fs');
    postinstall = await import('../postinstall.js');
  });

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports expected functions', () => {
    expect(typeof postinstall.toTs).toBe('function');
    expect(typeof postinstall.generate).toBe('function');
    expect(typeof postinstall.fetchSchema).toBe('function');
    expect(typeof postinstall.main).toBe('function');
    expect(typeof postinstall.findProjectRoot).toBe('function');
    expect(typeof postinstall.getConfigPath).toBe('function');
  });

  it('toTs and generate produce same output as cli.js', async () => {
    const cli = await import('../cli.js');
    const schemas = {
      add: {
        parameters: [{ name: 'x', type: "<class 'int'>" }],
        return_type: "<class 'str'>",
      },
    };
    expect(postinstall.generate(schemas)).toBe(cli.generate(schemas));
    expect(postinstall.toTs("<class 'int'>")).toBe(cli.toTs("<class 'int'>"));
  });
});
