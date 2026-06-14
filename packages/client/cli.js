#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');

var TYPES_OUTPUT;
try {
  var typesDir = path.dirname(require.resolve('@pyrpc/types/package.json'));
  TYPES_OUTPUT = path.join(typesDir, 'src', 'index.ts');
} catch (e) {
  TYPES_OUTPUT = path.join(__dirname, 'node_modules', '@pyrpc', 'types', 'src', 'index.ts');
}

function findConfig() {
  var dir = process.cwd();
  while (true) {
    var cfgPath = path.join(dir, 'pyrpc-client.json');
    if (fs.existsSync(cfgPath)) {
      return cfgPath;
    }
    var parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

var TYPE_MAP = {
  int: 'number',
  float: 'number',
  str: 'string',
  bool: 'boolean',
  None: 'null',
  NoneType: 'null',
  Any: 'any',
};

function toSafeName(name) {
  var s = typeof name.normalize === 'function' ? name.normalize('NFKD').replace(/[^\x00-\x7F]/g, '') : name;
  s = s.replace(/[^a-zA-Z0-9]/g, ' ');
  s = s.replace(/\b\w/g, function(c) { return c.toUpperCase(); }).replace(/\s+/g, '');
  return s || 'GeneratedType';
}

function toTs(t) {
  if (!t || t === 'None') return 'void';
  var m = t.match(/^<class\s+'([^'>]+)'>$/);
  if (m) {
    var n = m[1];
    if (n.indexOf('.') !== -1) n = n.split('.').pop();
    if (TYPE_MAP[n]) return TYPE_MAP[n];
    return toSafeName(n);
  }
  var s = t.replace(/^typing\./, '');
  var o = s.match(/^Optional\[(.+)\]$/);
  if (o) return toTs(o[1]) + ' | null';
  var l = s.match(/^(?:List|list)\[(.+)\]$/);
  if (l) return toTs(l[1]) + '[]';
  var d = s.match(/^(?:Dict|dict)\[([^,]+),\s*(.+)\]$/);
  if (d) return 'Record<' + toTs(d[1]) + ', ' + toTs(d[2]) + '>';
  var u = s.match(/^Union\[(.+)\]$/);
  if (u) return u[1].split(',').map(function(p) { return toTs(p.trim()); }).join(' | ');
  var tup = s.match(/^(?:Tuple|tuple)\[([^\]]+)\]$/);
  if (tup) return '[' + tup[1].split(',').map(function(p) { return toTs(p.trim()); }).join(', ') + ']';
  return 'any';
}

function ensureInlineModels(schemas) {
  var allSchemas = [];
  var names = Object.keys(schemas);
  for (var i = 0; i < names.length; i++) {
    var schema = schemas[names[i]];
    if (schema.return_schema) allSchemas.push(schema.return_schema);
    var params = schema.parameters || [];
    for (var j = 0; j < params.length; j++) {
      var p = params[j];
      if (p.schema_) allSchemas.push(p.schema_);
      if (p.schema) allSchemas.push(p.schema);
    }
  }

  if (allSchemas.length === 0) return allSchemas;

  var sharedDefs = {};
  var processed = allSchemas.map(function(s) {
    return walkAndPromote(JSON.parse(JSON.stringify(s)), sharedDefs, false);
  });

  var defKeys = Object.keys(sharedDefs);
  if (defKeys.length > 0) {
    for (var i = 0; i < processed.length; i++) {
      if (!processed[i].$defs) processed[i].$defs = {};
      for (var k = 0; k < defKeys.length; k++) {
        if (!processed[i].$defs[defKeys[k]]) {
          processed[i].$defs[defKeys[k]] = sharedDefs[defKeys[k]];
        }
      }
    }
  }

  return processed;
}

function walkAndPromote(node, sharedDefs, inDefs) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) {
    return node.map(function(v) { return walkAndPromote(v, sharedDefs, inDefs); });
  }

  if (!inDefs && node.type === 'object' && node.properties && typeof node.title === 'string') {
    var title = node.title;
    if (!sharedDefs[title]) {
      var promoted = {};
      for (var k in node) {
        if (k === '$defs' || k === 'definitions') {
          promoted[k] = {};
          for (var dk in node[k]) {
            promoted[k][dk] = walkAndPromote(node[k][dk], sharedDefs, true);
          }
        } else {
          promoted[k] = walkAndPromote(node[k], sharedDefs, false);
        }
      }
      sharedDefs[title] = promoted;
    }
    return { '$ref': '#/$defs/' + title };
  }

  var result = {};
  for (var k in node) {
    result[k] = walkAndPromote(node[k], sharedDefs, inDefs || k === '$defs' || k === 'definitions');
  }
  return result;
}

function walk(node, collected) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach(function(v) { walk(v, collected); }); return; }
  if (node.$defs || node.definitions) {
    var container = node.$defs || node.definitions;
    for (var key in container) {
      if (!collected[key]) collected[key] = container[key];
      walk(container[key], collected);
    }
  }
  for (var k in node) {
    if (k === '$defs' || k === 'definitions') continue;
    walk(node[k], collected);
  }
}

function collectDefs(schemas) {
  var processed = ensureInlineModels(schemas);
  var defs = {};
  for (var i = 0; i < processed.length; i++) {
    walk(processed[i], defs);
  }
  return defs;
}

function jsonSchemaToTs(schema) {
  if (schema.$ref) {
    var refName = schema.$ref.split('/').pop();
    return toSafeName(refName);
  }
  if (schema.anyOf) {
    return schema.anyOf.map(function(s) { return jsonSchemaToTs(s); }).join(' | ');
  }
  if (schema.type === 'array' && schema.items) {
    return jsonSchemaToTs(schema.items) + '[]';
  }
  switch (schema.type) {
    case 'string': return 'string';
    case 'integer':
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    default: return 'any';
  }
}

function defToInterface(defName, defSchema) {
  if (defSchema.type !== 'object' || !defSchema.properties) return '';
  var lines = [];
  lines.push('export interface ' + toSafeName(defName) + ' {');
  for (var propName in defSchema.properties) {
    var prop = defSchema.properties[propName];
    var tsType = jsonSchemaToTs(prop);
    var optional = !defSchema.required || defSchema.required.indexOf(propName) === -1;
    lines.push('  ' + propName + (optional ? '?' : '') + ': ' + tsType + ';');
  }
  lines.push('}');
  return lines.join('\n');
}

function generate(schemas) {
  var lines = [];
  lines.push('// Auto-generated by @pyrpc/types');
  lines.push('// Schema fetched from: ' + (process.env.PYRPC_URL || 'http://localhost:8000'));
  lines.push('');
  var defs = collectDefs(schemas);
  var defNames = Object.keys(defs);
  for (var d = 0; d < defNames.length; d++) {
    var iface = defToInterface(defNames[d], defs[defNames[d]]);
    if (iface) { lines.push(iface); lines.push(''); }
  }
  var names = Object.keys(schemas);
  lines.push('export interface Types {');
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var schema = schemas[name];
    var params = schema.parameters || [];
    var typedParams = params.map(function(p) { return p.name + ': ' + toTs(p.type); });
    lines.push('  ' + name + '(' + typedParams.join(', ') + '): Promise<' + toTs(schema.return_type) + '>;');
  }
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function fetchSchema(url) {
  var endpoint = url.replace(/\/+$/, '');
  if (endpoint.indexOf('/rpc') !== endpoint.length - 4) {
    endpoint += '/rpc';
  }
  var mod = endpoint.indexOf('https') === 0 ? https : http;
  return new Promise(function(resolve, reject) {
    mod.get(endpoint, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function printHelp() {
  console.log('');
  console.log('  pyRPC client CLI');
  console.log('');
  console.log('  Usage:');
  console.log('    npx pyrpc              Sync types from server (default)');
  console.log('    npx pyrpc sync         Same as above');
  console.log('    npx pyrpc --help       Show this help');
  console.log('');
  console.log('  The sync command reads pyrpc-client.json from your project');
  console.log('  root and fetches the latest RPC schema from the server.');
  console.log('');
  console.log('  In workspace mode, the server writes types directly to your');
  console.log('  project \u2014 no sync needed.');
  console.log('');
}

function main() {
  var args = process.argv.slice(2);

  if (args[0] === '--help' || args[0] === '-h') {
    printHelp();
    return Promise.resolve();
  }

  if (args[0] && args[0] !== 'sync') {
    console.log('Unknown command: ' + args[0]);
    console.log('Usage: npx pyrpc sync');
    return Promise.resolve();
  }

  var cfgPath = findConfig();
  if (!cfgPath) {
    console.log('');
    console.log('  No pyrpc-client.json found.');
    console.log('  Run npm install @pyrpc/client to set up,');
    console.log('  or create pyrpc-client.json manually.');
    console.log('');
    return Promise.resolve();
  }

  var config;
  try {
    config = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
  } catch (e) {
    console.log('  \u2717 Error reading ' + cfgPath);
    return Promise.resolve();
  }

  if (config.distribution === 'workspace') {
    console.log('');
    console.log('  Nothing to sync \u2014 server writes types directly to your project.');
    console.log('  Run pyrpc dev on your backend to regenerate types on change.');
    console.log('');
    return Promise.resolve();
  }

  if (config.distribution === 'server') {
    var url = config.server_url;
    if (!url) {
      console.log('  \u2717 pyrpc-client.json is missing server_url');
      return Promise.resolve();
    }

    return fetchSchema(url).then(function(schemas) {
      var code = generate(schemas);
      fs.mkdirSync(path.dirname(TYPES_OUTPUT), { recursive: true });
      fs.writeFileSync(TYPES_OUTPUT, code, 'utf-8');
      console.log('  \u2713 Types synced: ' + Object.keys(schemas).length + ' procedures');
      console.log('  Import: import { createClient, type Types } from "@pyrpc/client"');
    }).catch(function(err) {
      console.log('  \u2717 Could not fetch schema from ' + url + ' (' + err.message + ')');
    });
  }

  console.log('  \u2717 Unknown distribution: ' + config.distribution);
  return Promise.resolve();
}

if (require.main === module) {
  main().catch(function(e) {});
}

module.exports = { main, toTs, generate, fetchSchema, findConfig, printHelp };
