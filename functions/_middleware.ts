const SUPABASE_ORIGIN = 'https://qpfmnheghocfcckferum.supabase.co'

const PROXY_PREFIXES = [
  '/rest/',
  '/auth/',
  '/functions/',
  '/storage/',
  '/realtime/',
]

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const path = url.pathname

  // Clean public API: /v1/api/* → /functions/v1/public-api/*
  if (path.startsWith('/v1/api/') || path === '/v1/api') {
    const subpath = path.replace(/^\/v1\/api\/?/, '')
    const target = `${SUPABASE_ORIGIN}/functions/v1/public-api/${subpath}${url.search}`
    // Detect API mode from hostname: opensaasidea.com → lite, openprojectidea.com → broad
    const host = url.hostname
    const mode = host.includes('opensaasidea') ? 'lite' : 'broad'
    return proxyRequest(context.request, target, { 'x-api-mode': mode })
  }

  // Proxy all Supabase service paths
  for (const prefix of PROXY_PREFIXES) {
    if (path.startsWith(prefix)) {
      const target = `${SUPABASE_ORIGIN}${path}${url.search}`
      return proxyRequest(context.request, target)
    }
  }

  // Everything else → static SPA
  return context.next()
}

async function proxyRequest(request: Request, targetUrl: string, extraHeaders?: Record<string, string>): Promise<Response> {
  const headers = new Headers(request.headers)
  // Point Host header at Supabase so TLS/routing works
  headers.set('Host', new URL(SUPABASE_ORIGIN).host)
  // Remove Cloudflare-specific headers that confuse upstream
  headers.delete('cf-connecting-ip')
  headers.delete('cf-ray')
  headers.delete('cf-visitor')
  // Apply any extra headers (e.g. x-api-mode)
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) headers.set(k, v)
  }

  // Handle WebSocket upgrades (Supabase Realtime)
  if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
    const wsUrl = targetUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')
    // @ts-ignore — Cloudflare Workers support WebSocket fetch
    const res = await fetch(wsUrl, {
      method: request.method,
      headers,
      body: request.body,
    })
    return res
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'follow',
  }

  // Forward body for non-GET/HEAD
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body
    // @ts-ignore — duplex needed for streaming body in Workers
    init.duplex = 'half'
  }

  const response = await fetch(targetUrl, init)

  // Build response with CORS headers
  const respHeaders = new Headers(response.headers)
  respHeaders.set('Access-Control-Allow-Origin', '*')
  respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  respHeaders.set('Access-Control-Allow-Headers', 'Authorization, apikey, x-api-key, Content-Type, x-client-info, x-supabase-api-version')
  respHeaders.set('Access-Control-Expose-Headers', 'Content-Range, X-Total-Count')

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: respHeaders })
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: respHeaders,
  })
}
