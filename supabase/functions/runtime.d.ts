// Minimal host declarations for local tsc; production uses the Deno runtime.
declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (request: Request) => Response | Promise<Response>): void
}
