#!/usr/bin/env node
'use strict';

var mod  = require('./postinstall');
var fs   = require('fs');
var path = require('path');
var os   = require('os');
var tmp  = os.tmpdir();

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  PASS ' + name);
    passed++;
  } catch (e) {
    console.error('  FAIL ' + name + ': ' + e.message);
    failed++;
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

test('inject into tsconfig with existing paths', function () {
  var d = fs.mkdtempSync(path.join(tmp, 'pt-'));
  fs.writeFileSync(
    path.join(d, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: { paths: { '@/*': ['./*'] } } }, null, 2)
  );
  var r = mod.injectPathAlias(d);
  if (r !== 'injected') throw new Error('expected injected, got ' + r);
  var c = JSON.parse(fs.readFileSync(path.join(d, 'tsconfig.json'), 'utf-8'));
  if (!c.compilerOptions.paths['@pyrpc/types'])
    throw new Error('@pyrpc/types entry missing');
  if (c.compilerOptions.paths['@pyrpc/types'][0] !== './src/__pyrpc.d.ts')
    throw new Error('wrong path: ' + c.compilerOptions.paths['@pyrpc/types'][0]);
  if (!c.compilerOptions.paths['@/*'])
    throw new Error('existing @/* entry was removed');
});

test('skip when @pyrpc/types already set', function () {
  var d = fs.mkdtempSync(path.join(tmp, 'pt-'));
  fs.writeFileSync(
    path.join(d, 'tsconfig.json'),
    JSON.stringify(
      { compilerOptions: { paths: { '@pyrpc/types': ['./custom.d.ts'] } } },
      null,
      2
    )
  );
  var r = mod.injectPathAlias(d);
  if (r !== 'already_set') throw new Error('expected already_set, got ' + r);
  var c = JSON.parse(fs.readFileSync(path.join(d, 'tsconfig.json'), 'utf-8'));
  if (c.compilerOptions.paths['@pyrpc/types'][0] !== './custom.d.ts')
    throw new Error('entry was overwritten — should not be');
});

test('return no_tsconfig when no config file present', function () {
  var d = fs.mkdtempSync(path.join(tmp, 'pt-'));
  var r = mod.injectPathAlias(d);
  if (r !== 'no_tsconfig') throw new Error('expected no_tsconfig, got ' + r);
});

test('create compilerOptions.paths from scratch when absent', function () {
  var d = fs.mkdtempSync(path.join(tmp, 'pt-'));
  fs.writeFileSync(
    path.join(d, 'tsconfig.json'),
    JSON.stringify({ include: ['src'] }, null, 2)
  );
  var r = mod.injectPathAlias(d);
  if (r !== 'injected') throw new Error('expected injected, got ' + r);
  var c = JSON.parse(fs.readFileSync(path.join(d, 'tsconfig.json'), 'utf-8'));
  if (!c.compilerOptions || !c.compilerOptions.paths || !c.compilerOptions.paths['@pyrpc/types'])
    throw new Error('@pyrpc/types entry missing when no compilerOptions existed');
  // original key preserved
  if (!c.include) throw new Error('include key removed');
});

test('stripJsonComments handles JSONC (// and /* */)', function () {
  var jsonc = '{ // line comment\n"a": 1, /* block */ "b": 2 }';
  var parsed = JSON.parse(mod.stripJsonComments(jsonc));
  if (parsed.a !== 1 || parsed.b !== 2) throw new Error('parse produced wrong values');
});

test('inject into jsconfig.json when no tsconfig.json', function () {
  var d = fs.mkdtempSync(path.join(tmp, 'pt-'));
  fs.writeFileSync(
    path.join(d, 'jsconfig.json'),
    JSON.stringify({ compilerOptions: {} }, null, 2)
  );
  var r = mod.injectPathAlias(d);
  if (r !== 'injected') throw new Error('expected injected, got ' + r);
  var c = JSON.parse(fs.readFileSync(path.join(d, 'jsconfig.json'), 'utf-8'));
  if (!c.compilerOptions.paths['@pyrpc/types'])
    throw new Error('@pyrpc/types entry missing in jsconfig.json');
});

test('tsconfig.json takes precedence over jsconfig.json', function () {
  var d = fs.mkdtempSync(path.join(tmp, 'pt-'));
  fs.writeFileSync(path.join(d, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }, null, 2));
  fs.writeFileSync(path.join(d, 'jsconfig.json'), JSON.stringify({ compilerOptions: {} }, null, 2));
  mod.injectPathAlias(d);
  var ts = JSON.parse(fs.readFileSync(path.join(d, 'tsconfig.json'), 'utf-8'));
  var js = JSON.parse(fs.readFileSync(path.join(d, 'jsconfig.json'), 'utf-8'));
  if (!ts.compilerOptions.paths || !ts.compilerOptions.paths['@pyrpc/types'])
    throw new Error('tsconfig.json not updated');
  if (js.compilerOptions.paths)
    throw new Error('jsconfig.json should not have been touched');
});

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('');
console.log('postinstall: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
