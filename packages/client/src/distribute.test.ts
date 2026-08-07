/**
 * Tests for postinstall.js — tsconfig paths injection.
 *
 * cli.js was removed in v0.10.0. distribute.test.ts now tests the
 * postinstall helpers that replaced it.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// postinstall.js uses CommonJS module.exports — import via require
const postinstall = require('../postinstall.js') as {
  findProjectRoot: () => string;
  injectPathAlias: (root: string) => 'injected' | 'already_set' | 'no_tsconfig' | 'error';
  stripJsonComments: (s: string) => string;
};

// ── stripJsonComments ─────────────────────────────────────────────────────────

describe('stripJsonComments', () => {
  it('strips single-line comments', () => {
    const input = '{ // comment\n"a": 1 }';
    const parsed = JSON.parse(postinstall.stripJsonComments(input));
    expect(parsed.a).toBe(1);
  });

  it('strips block comments', () => {
    const input = '{ /* block */ "b": 2 }';
    const parsed = JSON.parse(postinstall.stripJsonComments(input));
    expect(parsed.b).toBe(2);
  });

  it('handles both comment types in one string', () => {
    const input = '{ // line\n"a": 1, /* block */ "b": 2 }';
    const parsed = JSON.parse(postinstall.stripJsonComments(input));
    expect(parsed.a).toBe(1);
    expect(parsed.b).toBe(2);
  });

  it('preserves normal JSON untouched', () => {
    const input = '{"x": "hello", "y": 42}';
    const parsed = JSON.parse(postinstall.stripJsonComments(input));
    expect(parsed.x).toBe('hello');
    expect(parsed.y).toBe(42);
  });
});

// ── injectPathAlias ───────────────────────────────────────────────────────────

describe('injectPathAlias', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'pyrpc-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns no_tsconfig when no config file exists', () => {
    const result = postinstall.injectPathAlias(tmpDir);
    expect(result).toBe('no_tsconfig');
  });

  it('injects into tsconfig.json with existing paths', () => {
    writeFileSync(
      join(tmpDir, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { paths: { '@/*': ['./*'] } } }, null, 2)
    );
    const result = postinstall.injectPathAlias(tmpDir);
    expect(result).toBe('injected');
    const cfg = JSON.parse(readFileSync(join(tmpDir, 'tsconfig.json'), 'utf-8'));
    expect(cfg.compilerOptions.paths['@pyrpc/types']).toEqual(['./src/__pyrpc.d.ts']);
    // preserves existing entry
    expect(cfg.compilerOptions.paths['@/*']).toEqual(['./*']);
  });

  it('injects when compilerOptions.paths does not exist', () => {
    writeFileSync(
      join(tmpDir, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { strict: true } }, null, 2)
    );
    const result = postinstall.injectPathAlias(tmpDir);
    expect(result).toBe('injected');
    const cfg = JSON.parse(readFileSync(join(tmpDir, 'tsconfig.json'), 'utf-8'));
    expect(cfg.compilerOptions.paths['@pyrpc/types']).toEqual(['./src/__pyrpc.d.ts']);
  });

  it('injects when compilerOptions is absent entirely', () => {
    writeFileSync(
      join(tmpDir, 'tsconfig.json'),
      JSON.stringify({ include: ['src'] }, null, 2)
    );
    const result = postinstall.injectPathAlias(tmpDir);
    expect(result).toBe('injected');
    const cfg = JSON.parse(readFileSync(join(tmpDir, 'tsconfig.json'), 'utf-8'));
    expect(cfg.compilerOptions.paths['@pyrpc/types']).toEqual(['./src/__pyrpc.d.ts']);
    // preserves original key
    expect(cfg.include).toEqual(['src']);
  });

  it('returns already_set and does not overwrite existing @pyrpc/types entry', () => {
    writeFileSync(
      join(tmpDir, 'tsconfig.json'),
      JSON.stringify(
        { compilerOptions: { paths: { '@pyrpc/types': ['./custom.d.ts'] } } },
        null, 2
      )
    );
    const result = postinstall.injectPathAlias(tmpDir);
    expect(result).toBe('already_set');
    const cfg = JSON.parse(readFileSync(join(tmpDir, 'tsconfig.json'), 'utf-8'));
    // user's custom value is preserved
    expect(cfg.compilerOptions.paths['@pyrpc/types']).toEqual(['./custom.d.ts']);
  });

  it('falls back to jsconfig.json when no tsconfig.json', () => {
    writeFileSync(
      join(tmpDir, 'jsconfig.json'),
      JSON.stringify({ compilerOptions: {} }, null, 2)
    );
    const result = postinstall.injectPathAlias(tmpDir);
    expect(result).toBe('injected');
    const cfg = JSON.parse(readFileSync(join(tmpDir, 'jsconfig.json'), 'utf-8'));
    expect(cfg.compilerOptions.paths['@pyrpc/types']).toEqual(['./src/__pyrpc.d.ts']);
  });

  it('tsconfig.json takes precedence over jsconfig.json', () => {
    writeFileSync(join(tmpDir, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }, null, 2));
    writeFileSync(join(tmpDir, 'jsconfig.json'), JSON.stringify({ compilerOptions: {} }, null, 2));
    postinstall.injectPathAlias(tmpDir);
    const ts = JSON.parse(readFileSync(join(tmpDir, 'tsconfig.json'), 'utf-8'));
    const js = JSON.parse(readFileSync(join(tmpDir, 'jsconfig.json'), 'utf-8'));
    expect(ts.compilerOptions.paths?.['@pyrpc/types']).toEqual(['./src/__pyrpc.d.ts']);
    // jsconfig untouched
    expect(js.compilerOptions.paths).toBeUndefined();
  });

  it('handles tsconfig.json with JSONC comments', () => {
    const jsonc = '{\n  // strict mode\n  "compilerOptions": { /* opts */ "strict": true }\n}';
    writeFileSync(join(tmpDir, 'tsconfig.json'), jsonc);
    const result = postinstall.injectPathAlias(tmpDir);
    expect(result).toBe('injected');
    const cfg = JSON.parse(readFileSync(join(tmpDir, 'tsconfig.json'), 'utf-8'));
    expect(cfg.compilerOptions.paths['@pyrpc/types']).toEqual(['./src/__pyrpc.d.ts']);
    expect(cfg.compilerOptions.strict).toBe(true);
  });
});

// ── exports surface ───────────────────────────────────────────────────────────

describe('postinstall.js exports', () => {
  it('exports findProjectRoot', () => {
    expect(typeof postinstall.findProjectRoot).toBe('function');
  });

  it('exports injectPathAlias', () => {
    expect(typeof postinstall.injectPathAlias).toBe('function');
  });

  it('exports stripJsonComments', () => {
    expect(typeof postinstall.stripJsonComments).toBe('function');
  });

  it('findProjectRoot returns a string', () => {
    const root = postinstall.findProjectRoot();
    expect(typeof root).toBe('string');
    expect(root.length).toBeGreaterThan(0);
  });
});
