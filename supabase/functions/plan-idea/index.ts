import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://opensaasidea.com',
  'https://www.opensaasidea.com',
  'https://openprojectidea.com',
  'https://www.openprojectidea.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, apikey, x-client-info',
  };
}

async function resolveSecret(key: string, supabase: any): Promise<string | null> {
  try {
    const { data } = await supabase.from('admin_secrets').select('value').eq('key', key).single();
    if (data?.value) return data.value;
  } catch {}
  const envVal = Deno.env.get(key);
  if (envVal) return envVal;
  return null;
}

function generateShareToken(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } });

  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await authClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });

    const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const OPENROUTER_API_KEY = await resolveSecret('OPENROUTER_API_KEY', svc);
    if (!OPENROUTER_API_KEY) return new Response(JSON.stringify({ error: 'AI key not configured' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const { action, idea_id, plan_id, answers } = body;

    const { data: affiliatesData } = await svc.from('affiliates').select('name, display_name, url, tag, logo_url, category').eq('is_active', true).order('sort_order');
    const affiliates = affiliatesData || [];

    // Actions: init, answer, generate, get
    if (action === 'init') {
      // ... handled by deployed version
    }
    if (action === 'answer') {
      // ... handled by deployed version
    }
    if (action === 'generate') {
      // ... handled by deployed version
    }
    if (action === 'get') {
      // ... handled by deployed version
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[plan-idea] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
