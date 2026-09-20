import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Execute the actual Edge entrypoint with injected services, without Deno,
// network access, or a live Supabase project.
export function loadEdgeFunction(name: string, createClient: (...args: unknown[]) => unknown) {
  let handler: (request: Request) => Promise<Response>
  const cache = new Map<string, { exports: Record<string, unknown> }>()
  const load = (path: string): Record<string, unknown> => {
    if (cache.has(path)) return cache.get(path)!.exports
    const module = { exports: {} }
    cache.set(path, module)
    const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    runInNewContext(code, {
      exports: module.exports, module,
      require: (id: string) => id.startsWith('jsr:') ? { createClient } : load(resolve(dirname(path), id)),
      Deno: { serve: (fn: typeof handler) => { handler = fn }, env: { get: (key: string) => key === 'SUPABASE_URL' ? 'https://test.invalid' : key } },
      Request, Response, Headers, URL, URLSearchParams, AbortSignal, atob,
      console: { error: () => {}, log: () => {} },
      fetch: () => { throw new Error('Network prohibited in tests') }
    })
    return module.exports
  }
  load(resolve('supabase/functions', name, 'index.ts'))
  return (req: Request) => handler(req)
}
