const TYPE_MAP: Record<string, string> = {
  int: 'number',
  float: 'number',
  str: 'string',
  bool: 'boolean',
  bytes: 'string',
  Any: 'any',
  None: 'null',
  any: 'any',
}

function mapType(pyType: string, knownModels: Set<string>): string {
  let t = pyType.trim()

  if (TYPE_MAP[t]) return TYPE_MAP[t]
  if (knownModels.has(t)) return t

  const optional = t.match(/Optional\[(.+)\]/)
  if (optional) return `${mapType(optional[1], knownModels)} | null`

  const listMatch = t.match(/list\[(.+)\]/)
  if (listMatch) return `${mapType(listMatch[1], knownModels)}[]`

  const dictMatch = t.match(/dict\[(.+),\s*(.+)\]/)
  if (dictMatch) return `Record<${mapType(dictMatch[1], knownModels)}, ${mapType(dictMatch[2], knownModels)}>`

  const union = t.match(/Union\[(.+)\]/)
  if (union) {
    const parts = union[1].split(',').map((s: string) => s.trim())
    const nonNull = parts.filter((p: string) => p !== 'None' && p !== 'NoneType')
    if (nonNull.length === 0) return 'null'
    if (nonNull.length === 1) {
      const mapped = mapType(nonNull[0], knownModels)
      return parts.includes('None') ? `${mapped} | null` : mapped
    }
    return `${nonNull.map((p: string) => mapType(p, knownModels)).join(' | ')}`
  }

  return 'any'
}

interface ParsedParam {
  name: string
  type: string
}

export function parseServerCode(code: string): {
  procedures: Record<string, { name: string; parameters: ParsedParam[]; return_type: string }>
  models: Record<string, Record<string, string>>
} {
  const procedures: Record<string, { name: string; parameters: ParsedParam[]; return_type: string }> = {}
  const models: Record<string, Record<string, string>> = {}

  // Remove comments
  const clean = code.replace(/#.*$/gm, '')

    // Parse @model classes
  const modelClassRegex = /@model\s*\n(class\s+(\w+)[\s\S]*?(?=\n@\w|$))/g
  let m: RegExpExecArray | null
  while ((m = modelClassRegex.exec(clean)) !== null) {
    const classBody = m[1]
    const className = m[2]

    // Extract fields: name: type  or  name: type = default
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

  // Parse @rpc functions
  const rpcFuncRegex = /@rpc\s*\n(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*([^:\n{]*))?/g
  let r: RegExpExecArray | null
  while ((r = rpcFuncRegex.exec(clean)) !== null) {
    const funcName = r[1]
    const paramsStr = r[2]
    const returnAnno = r[3] ? r[3].trim() : 'any'

    const params: ParsedParam[] = []
    if (paramsStr.trim()) {
      // Split by comma, but not inside angle or square brackets (generics, unions)
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
        // Split on first ':' only
        const colonIdx = trimmed.indexOf(':')
        let name: string, type: string
        if (colonIdx === -1) {
          name = trimmed
          type = 'any'
        } else {
          name = trimmed.slice(0, colonIdx).trim()
          type = trimmed.slice(colonIdx + 1).trim()
        }
        // Strip default value (everything after =)
        const eqIdx = type.indexOf('=')
        if (eqIdx !== -1) type = type.slice(0, eqIdx).trim()
        params.push({ name, type })
      }
    }

    procedures[funcName] = {
      name: funcName,
      parameters: params,
      return_type: returnAnno,
    }
  }

  return { procedures, models }
}

export function introspectionToTypes(schema: {
  procedures: Record<string, { name: string; parameters: ParsedParam[]; return_type: string }>
  models: Record<string, Record<string, string>>
}): string {
  const knownModels = new Set(Object.keys(schema.models))

  let result = ''

  for (const [name, fields] of Object.entries(schema.models)) {
    result += `export interface ${name} {\n`
    for (const [fieldName, fieldType] of Object.entries(fields)) {
      result += `  ${fieldName}: ${mapType(fieldType, knownModels)};\n`
    }
    result += '}\n\n'
  }

  result += 'export interface Types {\n'
  for (const [_name, proc] of Object.entries(schema.procedures)) {
    const tsReturn = mapType(proc.return_type, knownModels)
    const paramsStr = proc.parameters
      .filter((p) => p.name !== 'self' && p.name !== 'cls')
      .map((p) => `${p.name}: ${mapType(p.type, knownModels)}`)
      .join(', ')
    result += `  ${proc.name}(${paramsStr}): Promise<${tsReturn}>;\n`
  }
  result += '}\n'

  return result
}

export interface ValidationError {
  line: number
  column: number
  message: string
}

export function validateServerCode(code: string): ValidationError[] {
  const errors: ValidationError[] = []
  const lines = code.split('\n')

  // Check for unknown decorators
  const decoratorRegex = /^\s*@(\w+)\s*$/gm
  let d: RegExpExecArray | null
  while ((d = decoratorRegex.exec(code)) !== null) {
    const decoratorName = d[1]
    if (decoratorName !== 'rpc' && decoratorName !== 'model') {
      const lineNum = code.substring(0, d.index).split('\n').length
      errors.push({
        line: lineNum,
        column: d[0].indexOf('@') + 1,
        message: `Unknown decorator '@${decoratorName}'. Use '@rpc' for procedures or '@model' for data models.`,
      })
    }
  }

  // Check @rpc functions have a return type annotation
  const rpcFuncRegex = /@rpc\s*\n(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(->\s*([^:\n{]*))?/g
  let r: RegExpExecArray | null
  while ((r = rpcFuncRegex.exec(code)) !== null) {
    if (!r[3]) {
      const lineNum = code.substring(0, r.index).split('\n').length + 1
      errors.push({
        line: lineNum,
        column: 1,
        message: `Procedure '${r[1]}' is missing a return type annotation. Add '-> ReturnType' after the signature.`,
      })
    }
  }

  // Check @model classes have at least one field
  const modelClassRegex = /@model\s*\n(class\s+(\w+)[\s\S]*?(?=\n@\w|$))/g
  let m: RegExpExecArray | null
  while ((m = modelClassRegex.exec(code)) !== null) {
    const classBody = m[1]
    const className = m[2]
    const fieldRegex = /^\s+(\w+)\s*:\s*\w+/gm
    const fields = classBody.match(fieldRegex) || []
    if (fields.length === 0) {
      const lineNum = code.substring(0, m.index).split('\n').length + 1
      errors.push({
        line: lineNum,
        column: 1,
        message: `Model '${className}' has no fields. Add at least one typed field.`,
      })
    }
  }

  return errors
}

export function fetchIntrospection(serverCode: string): string {
  const schema = parseServerCode(serverCode)
  return introspectionToTypes(schema)
}
