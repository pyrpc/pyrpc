import { NextResponse } from 'next/server';

// Inline type mapping from parsePythonTypes
const TYPE_MAP: Record<string, string> = {
  int: 'number',
  float: 'number',
  str: 'string',
  bool: 'boolean',
  bytes: 'string',
  Any: 'any',
  None: 'null',
  any: 'any',
};

function mockDefaultValue(pyType: string, knownModels: Set<string>, fieldName?: string): any {
  const t = pyType.trim()
  if (TYPE_MAP[t] === 'number') return 0
  if (TYPE_MAP[t] === 'string') return fieldName ? `Sample ${fieldName}` : 'mock_value'
  if (TYPE_MAP[t] === 'boolean') return false
  if (t === 'null' || t === 'None') return null
  if (t === 'any') return null
  if (knownModels.has(t)) return {}
  const listMatch = t.match(/list\[(.+)\]/)
  if (listMatch) return []
  const dictMatch = t.match(/dict\[(.+),\s*(.+)\]/)
  if (dictMatch) return {}
  return null
}

function parseServerCodeForMock(code: string) {
  const clean = code.replace(/#.*$/gm, '')

  // Parse @model classes
  const models: Record<string, Record<string, string>> = {}
  const modelClassRegex = /@model\s*\n(class\s+(\w+)[\s\S]*?(?=\n@\w|$))/g
  let m: RegExpExecArray | null
  while ((m = modelClassRegex.exec(clean)) !== null) {
    const classBody = m[1]
    const className = m[2]
    const fieldRegex = /^\s+(\w+)\s*:\s*(\w+(?:\[.*?\])?)/gm
    const fields: Record<string, string> = {}
    let f: RegExpExecArray | null
    while ((f = fieldRegex.exec(classBody)) !== null) {
      fields[f[1]] = f[2]
    }
    if (Object.keys(fields).length > 0) {
      models[className] = fields
    }
  }

  // Parse @rpc functions — store return type + param types
  interface FuncInfo { return_type: string; param_types: Record<string, string> }
  const rpcs: Record<string, FuncInfo> = {}
  const rpcFuncRegex = /@rpc\s*\n(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*([^:\n{]*))?/g
  let r: RegExpExecArray | null
  while ((r = rpcFuncRegex.exec(clean)) !== null) {
    const funcName = r[1]
    const paramsStr = r[2]
    const returnAnno = r[3] ? r[3].trim() : 'any'

    const paramTypes: Record<string, string> = {}
    if (paramsStr.trim()) {
      const paramParts = paramsStr.split(',').reduce((acc: string[], part) => {
        const last = acc[acc.length - 1]
        if (last && (last.split('<').length !== last.split('>').length || last.split('[').length !== last.split(']').length)) {
          acc[acc.length - 1] += ',' + part
        } else {
          acc.push(part)
        }
        return acc
      }, [])
      for (const raw of paramParts) {
        const trimmed = raw.trim()
        if (!trimmed || trimmed === 'self' || trimmed === 'cls') continue
        const colonIdx = trimmed.indexOf(':')
        if (colonIdx === -1) continue
        const name = trimmed.slice(0, colonIdx).trim()
        let type = trimmed.slice(colonIdx + 1).trim()
        const eqIdx = type.indexOf('=')
        if (eqIdx !== -1) type = type.slice(0, eqIdx).trim()
        paramTypes[name] = type
      }
    }
    rpcs[funcName] = { return_type: returnAnno, param_types: paramTypes }
  }

  // Parse return value literals from function bodies
  // e.g. `return User(id=id, name="Core User")` → { name: "Core User" }
  const returnLiterals: Record<string, Record<string, any>> = {}
  const funcBodyRegex = /@rpc\s*\n(?:async\s+)?def\s+(\w+)\s*\([^)]*\)\s*(?:->\s*[^:\n{]*)?:\s*\n((?:\s+.*(?:\n|$))*?)(?=\n@\w|\n*$)/g
  let fb: RegExpExecArray | null
  while ((fb = funcBodyRegex.exec(clean)) !== null) {
    const funcName = fb[1]
    const body = fb[2]
    const returnRegex = /return\s+\w+\(([^)]*)\)/
    const retMatch = body.match(returnRegex)
    if (retMatch) {
      const kwargsStr = retMatch[1]
      const kwargs: Record<string, any> = {}
      // Parse key=value pairs, handling strings, numbers, booleans
      const kwRegex = /(\w+)\s*=\s*(?:'([^']*)'|"([^"]*)"|(\d+\.?\d*)|(True|False|None))/g
      let kw: RegExpExecArray | null
      while ((kw = kwRegex.exec(kwargsStr)) !== null) {
        const key = kw[1]
        const val = kw[2] ?? kw[3] ?? (kw[4] ? (kw[4].includes('.') ? parseFloat(kw[4]) : parseInt(kw[4])) : kw[5] === 'True' ? true : kw[5] === 'False' ? false : null)
        kwargs[key] = val
      }
      if (Object.keys(kwargs).length > 0) {
        returnLiterals[funcName] = kwargs
      }
    }
  }

  return { models, rpcs, returnLiterals }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { method, params } = body

    if (!method) {
      return NextResponse.json({ error: { code: -32600, message: 'Invalid Request: missing method' } }, { status: 400 })
    }

    const serverCodeBase64 = req.headers.get('x-server-code')
    if (!serverCodeBase64) {
      return NextResponse.json({ error: { code: -32000, message: 'Missing X-Server-Code header' } }, { status: 400 })
    }

    const userCode = Buffer.from(serverCodeBase64, 'base64').toString('utf-8')
    const { models, rpcs, returnLiterals } = parseServerCodeForMock(userCode)

    const funcInfo = rpcs[method]
    if (!funcInfo) {
      return NextResponse.json({
        result: { mock: true, note: `Function '${method}' not found in server code. Available: ${Object.keys(rpcs).join(', ')}` }
      })
    }

    // Unwrap params: the createClient proxy double-wraps when passing an array
    // e.g. client.foo([1]) → args = [[1]] → params = [[1]]
    // We unwrap by checking if params is [[...]] (single array element)
    let callArgs: any[]
    if (Array.isArray(params) && params.length === 1 && Array.isArray(params[0])) {
      callArgs = params[0]
    } else {
      callArgs = Array.isArray(params) ? params : [params]
    }

    // Build param names map
    const paramNames = Object.keys(funcInfo.param_types)
    let result: any

    if (paramNames.length > 0) {
      // Try named params first
      if (typeof callArgs[0] === 'object' && !Array.isArray(callArgs[0]) && callArgs.length === 1) {
        // Named params: { id: 1 }
        result = callArgs[0]
      } else {
        // Positional params: map by position
        result = {} as Record<string, any>
        for (let i = 0; i < Math.min(callArgs.length, paramNames.length); i++) {
          ;(result as Record<string, any>)[paramNames[i]] = callArgs[i]
        }
      }
    } else {
      result = callArgs[0]
    }

    // Build mock return value based on return type
    const knownModels = new Set(Object.keys(models))
    let returnValue: any

    const rt = funcInfo.return_type.trim()
    if (knownModels.has(rt)) {
      // Build mock model instance
      const modelFields = models[rt]
      returnValue = {} as Record<string, any>
      for (const [fieldName, fieldType] of Object.entries(modelFields)) {
        ;(returnValue as Record<string, any>)[fieldName] = mockDefaultValue(fieldType, knownModels, fieldName)
      }
      // Override with any matching param values
      if (typeof result === 'object' && result !== null) {
        for (const key of Object.keys(result)) {
          if (key in modelFields) {
            returnValue[key] = result[key]
          }
        }
      }
      // Override with return value literals from the function body
      if (returnLiterals[method]) {
        for (const [key, val] of Object.entries(returnLiterals[method])) {
          if (key in modelFields) {
            returnValue[key] = val
          }
        }
      }
    } else if (rt === 'str' || rt === 'string') {
      returnValue = 'mock_result'
    } else if (rt === 'int' || rt === 'float' || rt === 'number') {
      returnValue = 42
    } else if (rt === 'bool' || rt === 'boolean') {
      returnValue = true
    } else if (rt === 'any' || rt === 'Any') {
      // For untyped functions, try to infer a useful mock result
      // from the param values
      if (Array.isArray(callArgs) && callArgs.length > 0) {
        // If all params are numbers, sum them
        const nums = callArgs.filter((a: any) => typeof a === 'number')
        if (nums.length === callArgs.length && nums.length > 0) {
          returnValue = nums.reduce((a: number, b: number) => a + b, 0)
        } else {
          returnValue = callArgs[0]
        }
      } else if (typeof result === 'object' && result !== null && Object.keys(result).length > 0) {
        returnValue = result
      } else {
        returnValue = null
      }
    } else {
      const listMatch = rt.match(/list\[(.+)\]/)
      if (listMatch) {
        returnValue = [mockDefaultValue(listMatch[1], knownModels)]
      } else {
        returnValue = null
      }
    }

    return NextResponse.json({ result: returnValue })
  } catch (err: any) {
    return NextResponse.json({ error: { code: -32603, message: 'Internal error', data: err.message } }, { status: 500 })
  }
}
