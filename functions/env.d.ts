interface Env {}

type PagesFunction<E = Env> = (context: {
  request: Request
  next: () => Promise<Response>
  env: E
  params: Record<string, string | string[]>
}) => Promise<Response> | Response
