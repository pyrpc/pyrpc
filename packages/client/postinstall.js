#!/usr/bin/env node
'use strict';

/**
 * @pyrpc/client postinstall
 *
 * Injects "@pyrpc/types": ["./src/__pyrpc.d.ts"] into the project's
 * tsconfig.json (or jsconfig.json) so that `import type { Types } from
 * "@pyrpc/types"` resolves to the file that `pyrpc dev` / `pyrpc watch`
 * keeps up-to-date.
 *
 * This runs once at install time and never again modifies tsconfig.json.
 * The developer owns the entry after this point — they can change the path
 * or remove it at will.
 */

var fs   = require('fs');
var path = require('path');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Walk up from cwd to find the consumer's package root (not inside node_modules). */
function findProjectRoot() {
  var dir = process.cwd();
  while (true) {
    var pkgPath = path.join(dir, 'package.json');
    // Make sure we're not inside node_modules itself
    if (fs.existsSync(pkgPath) && dir.replace(/\\/g, '/').indexOf('/node_modules/') === -1) {
      return dir;
    }
    var parent = path.dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

/**
 * Strip single-line (//) and multi-line (/* *\/) comments from a string so
 * JSON.parse can handle tsconfig.json which allows comments (JSONC).
 */
function stripJsonComments(str) {
  // Remove block comments first, then line comments.
  // Simple approach — sufficient for tsconfig.json in practice.
  var result = str
    .replace(/\/\*[\s\S]*?\*\//g, function(m) {
      // Preserve newlines so line numbers stay intact
      return m.replace(/[^\n]/g, ' ');
    })
    .replace(/\/\/[^\n]*/g, '');
  return result;
}

/**
 * Read, parse, mutate, and write tsconfig.json adding the @pyrpc/types path.
 * Returns one of: 'injected' | 'already_set' | 'no_tsconfig' | 'error'.
 */
function injectPathAlias(projectRoot) {
  var candidates = ['tsconfig.json', 'jsconfig.json'];
  var tsconfigPath = null;

  for (var i = 0; i < candidates.length; i++) {
    var candidate = path.join(projectRoot, candidates[i]);
    if (fs.existsSync(candidate)) {
      tsconfigPath = candidate;
      break;
    }
  }

  if (!tsconfigPath) {
    return 'no_tsconfig';
  }

  var raw;
  try {
    raw = fs.readFileSync(tsconfigPath, 'utf-8');
  } catch (e) {
    return 'error';
  }

  var config;
  try {
    config = JSON.parse(stripJsonComments(raw));
  } catch (e) {
    return 'error';
  }

  // Guard: already configured — don't overwrite user's choice
  if (
    config.compilerOptions &&
    config.compilerOptions.paths &&
    config.compilerOptions.paths['@pyrpc/types']
  ) {
    return 'already_set';
  }

  // Merge: preserve existing structure, only add our entry
  if (!config.compilerOptions) config.compilerOptions = {};
  if (!config.compilerOptions.paths) config.compilerOptions.paths = {};
  config.compilerOptions.paths['@pyrpc/types'] = ['./src/__pyrpc.d.ts'];

  try {
    fs.writeFileSync(tsconfigPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch (e) {
    return 'error';
  }

  return 'injected';
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  // Skip in CI unless explicitly opted in — avoids unexpected tsconfig mutations
  // in automated pipelines that don't have a tsconfig at the right level.
  if (process.env.CI && !process.env.PYRPC_POSTINSTALL_FORCE) {
    return;
  }

  var projectRoot = findProjectRoot();
  var result = injectPathAlias(projectRoot);

  if (result === 'injected') {
    console.log('  \u2713 @pyrpc/types \u2192 src/__pyrpc.d.ts (tsconfig.json)');
    console.log('  Run \u2018pyrpc dev main:app\u2019 to start generating types.');
  } else if (result === 'already_set') {
    // Silently skip — developer already configured it
  } else if (result === 'no_tsconfig') {
    console.log('  \u25cb @pyrpc/types: no tsconfig.json found.');
    console.log('  Add this manually to your tsconfig.json compilerOptions.paths:');
    console.log('    "@pyrpc/types": ["./src/__pyrpc.d.ts"]');
  } else if (result === 'error') {
    console.log('  \u25cb @pyrpc/types: could not update tsconfig.json.');
    console.log('  Add this manually to your tsconfig.json compilerOptions.paths:');
    console.log('    "@pyrpc/types": ["./src/__pyrpc.d.ts"]');
  }
}

main();

// Export helpers for unit tests
module.exports = { findProjectRoot, injectPathAlias, stripJsonComments };
