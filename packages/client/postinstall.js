#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var readline = require('readline');
var http = require('http');
var https = require('https');

var TYPES_DIR;
try {
  TYPES_DIR = path.dirname(require.resolve('@pyrpc/types/package.json'));
} catch (e) {
  TYPES_DIR = path.join(__dirname, 'node_modules', '@pyrpc', 'types');
}

var TYPES_FILE = path.join(TYPES_DIR, 'src', 'index.ts');

function findProjectRoot() {
  var dir = process.cwd();
  while (true) {
    var pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath) && !pkgPath.replace(/\\/g, '/').includes('/node_modules/')) {
      return dir;
    }
    var parent = path.dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

function getConfigPath() {
  return path.join(findProjectRoot(), 'pyrpc-client.json');
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

function extractModelName(typeStr) {
  var m = String(typeStr).match(/^<class\s+'([^'>]+)'>$/);
  if (!m) return null;
  var name = m[1];
  if (name.indexOf('.') !== -1) name = name.split('.').pop();
  if (TYPE_MAP[name]) return null;
  return name;
}

function ensureInlinedModel(typeStr, schema, sources) {
  var modelName = extractModelName(typeStr);
  if (modelName && schema && schema.type === 'object' && schema.properties && !schema.$ref) {
    var wrapped = { '$ref': '#/$defs/' + modelName, '$defs': {} };
    wrapped['$defs'][modelName] = schema;
    sources.push(wrapped);
  } else if (schema) {
    sources.push(schema);
  }
}

function collectDefs(schemas) {
  var sources = [];
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
  var defs = {};
  var names = Object.keys(schemas);
  for (var i = 0; i < names.length; i++) {
    var schema = schemas[names[i]];
    var returnType = schema.return_type || '';
    if (schema.return_schema) ensureInlinedModel(returnType, schema.return_schema, sources);
    var params = schema.parameters || [];
    for (var j = 0; j < params.length; j++) {
      var p = params[j];
      var pType = p.type || '';
      if (p.schema_) ensureInlinedModel(pType, p.schema_, sources);
      if (p.schema) ensureInlinedModel(pType, p.schema, sources);
    }
  }
  for (var s = 0; s < sources.length; s++) {
    walk(sources[s], defs);
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
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var schema = schemas[name];
    lines.push('export interface ' + name + 'Params {');
    var params = schema.parameters || [];
    for (var j = 0; j < params.length; j++) {
      var p = params[j];
      lines.push('  ' + p.name + ': ' + toTs(p.type) + ';');
    }
    lines.push('}');
    lines.push('');
    lines.push('export interface ' + name + 'Result {');
    lines.push('  data: ' + toTs(schema.return_type) + ';');
    lines.push('}');
    lines.push('');
  }
  lines.push('export interface Types {');
  for (var k = 0; k < names.length; k++) {
    lines.push('  ' + names[k] + ': { params: ' + names[k] + 'Params; result: ' + names[k] + 'Result };');
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

function main() {
  if (fs.existsSync(getConfigPath())) {
    return Promise.resolve();
  }

  var isInteractive = process.stdin.isTTY;
  var isCI = process.env.CI;

  if (!isInteractive || isCI) {
    // Non-interactive: default to workspace with localhost
    var config = { distribution: 'workspace', server_url: 'http://localhost:8000' };
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2) + '\n');
    return Promise.resolve();
  }

  console.log('');
  console.log('  \u2728 Welcome to pyRPC!');
  console.log('  Let\u2019s set up your client configuration.');
  console.log('');

  var rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(function(resolve) {
    rl.question('How are types distributed?\n  1) workspace (default) - server writes types directly to your project\n  2) server - client fetches types via HTTP\nEnter choice [1]: ', function(answer) {
      rl.close();
      resolve(answer.trim() === '2' ? 'server' : 'workspace');
    });
  }).then(function(distribution) {
    // Always prompt for URL with same default
    var rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(function(resolve) {
      rl2.question('Server URL [http://localhost:8000]: ', function(answer) {
        rl2.close();
        resolve(answer.trim() || 'http://localhost:8000');
      });
    }).then(function(serverUrl) {
      var config = { distribution: distribution, server_url: serverUrl };
      fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2) + '\n');
      console.log('  \u2713 pyrpc-client.json created (' + distribution + ' mode)');

      if (distribution === 'server') {
        return fetchSchema(serverUrl).then(function(schemas) {
          var code = generate(schemas);
          fs.mkdirSync(path.dirname(TYPES_FILE), { recursive: true });
          fs.writeFileSync(TYPES_FILE, code, 'utf-8');
          console.log('  \u2713 @pyrpc/types: generated for ' + Object.keys(schemas).length + ' procedures');
        }).catch(function(err) {
          console.log('  \u2717 @pyrpc/types: could not connect (' + err.message + ')');
          console.log('  Run later: npx pyrpc sync');
        });
      } else {
        console.log('  Your server\u2019s pyrpc dev command will write types directly.');
      }
    });
  });
}

if (require.main === module) {
  main().catch(function(e) {});
}

module.exports = { main, toTs, generate, fetchSchema, findProjectRoot, getConfigPath, TYPES_FILE };
