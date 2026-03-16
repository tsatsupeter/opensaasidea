import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Resolve secret: admin_secrets first, env var fallback
async function resolveSecret(key: string, supabase: any): Promise<string | null> {
  try {
    const { data } = await supabase.from('admin_secrets').select('value').eq('key', key).single();
    if (data?.value) return data.value;
  } catch {}
  const envVal = Deno.env.get(key);
  if (envVal) return envVal;
  return null;
}

async function resolveApiKeys(supabase: any): Promise<string[]> {
  const keys: string[] = [];
  const multi = await resolveSecret('RAPIDAPI_KEYS', supabase);
  if (multi) keys.push(...multi.split(',').map(k => k.trim()).filter(Boolean));
  const single = await resolveSecret('RAPIDAPI_KEY', supabase);
  if (single && !keys.includes(single)) keys.push(single);
  return keys;
}

async function fetchWithTimeout<T>(url: string, opts: RequestInit = {}, timeoutMs = 10000): Promise<T | null> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeoutMs);
    const r = await fetch(url, { ...opts, signal: c.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function collectMarketData(): Promise<string> {
  const BASE = 'https://saasytrends.com/api';
  try {
    const [top48h, b2b24h, b2c24h, niche24h] = await Promise.all([
      fetchWithTimeout(`${BASE}/companies?timeFrame=48&page=1`, {}, 8000),
      fetchWithTimeout(`${BASE}/companies?timeFrame=24&page=1&model=B2B`, {}, 8000),
      fetchWithTimeout(`${BASE}/companies?timeFrame=24&page=1&model=B2C`, {}, 8000),
      fetchWithTimeout(`${BASE}/companies?timeFrame=24&page=1&model=B2B%2FB2C&volumeMin=5&volumeMax=100`, {}, 8000),
    ]);
    const parse = (d: any) => {
      if (!d?.chartData) return [];
      return d.chartData.filter((c: any) => c.datasets?.[0]?.label && c.description).map((c: any) => ({
        name: c.datasets[0].label, desc: c.shortDescription || c.description?.slice(0, 150) || '',
        category: (c.category || []).join(', '), model: c.businessModel || 'unknown', growth: c.growthRate || 0,
      }));
    };
    const all = [...parse(top48h), ...parse(b2b24h), ...parse(b2c24h), ...parse(niche24h)];
    const seen = new Set<string>(); const unique: any[] = [];
    for (const co of all) { if (!seen.has(co.name)) { seen.add(co.name); unique.push(co); } }
    unique.sort((a: any, b: any) => b.growth - a.growth);
    if (!unique.length) return '';
    const lines = ['=== REAL-TIME SAAS MARKET DATA (SaasyTrends) ===', '', 'TOP TRENDING (by growth rate):'];
    for (const co of unique.slice(0, 20)) {
      lines.push(`- ${co.name} (${co.model.toUpperCase()}, growth: ${co.growth.toFixed(1)}x): ${co.desc}`);
      if (co.category) lines.push(`  Categories: ${co.category}`);
    }
    return lines.join('\n');
  } catch { return ''; }
}

async function collectRedditData(keys: string[]): Promise<string> {
  if (!keys.length) return '';
  const HOST = 'reddit34.p.rapidapi.com';

  // Massively expanded subreddit list
  const SUBS = [
    // Core SaaS & startup
    'SaaS', 'microsaas', 'startups', 'AppIdeas', 'SomebodyMakeThis', 'SideProject',
    'Entrepreneur', 'smallbusiness', 'business_ideas', 'indiehackers',
    'EntrepreneurRideAlong', 'sweatystartup', 'GrowMyBusiness', 'IMadeThis',
    // Tech & dev
    'webdev', 'reactjs', 'node', 'python', 'nocode', 'lowcode', 'automation',
    'selfhosted', 'ChatGPT', 'LocalLLaMA', 'MachineLearning', 'vibecoding', 'lovable',
    // Business & marketing
    'digitalnomad', 'passive_income', 'ecommerce', 'SEO', 'marketing', 'Affiliatemarketing',
    // Niche verticals
    'fintech', 'healthIT', 'edtech', 'legaltech', 'proptech', 'cybersecurity',
    'gamedev', 'RemoteWork', 'ProductManagement', 'datascience',
    // Pain point communities
    'Lightbulb', 'CrazyIdeas', 'productivity', 'LifeProTips',
  ];

  // Keyword searches for high-value idea posts
  const SEARCH_QUERIES = [
    'million dollar app idea',
    '$100K app idea',
    'SaaS idea nobody built',
    'wish there was an app',
    'someone should build',
    'micro SaaS profitable',
    'AI startup idea',
    'niche SaaS opportunity',
    'problem nobody solved',
    'tool I would pay for',
  ];

  try {
    // Fetch top posts from subreddits
    const subFetches = SUBS.map(sub => (async () => {
      for (const k of keys) {
        try {
          const r = await fetchWithTimeout<any>(`https://${HOST}/getTopPostsBySubreddit?subreddit=${sub}&time=week`, { headers: { 'x-rapidapi-host': HOST, 'x-rapidapi-key': k } }, 10000);
          if (!r) continue;
          return (r?.data?.posts || []).map((p: any) => ({ title: p.data?.title || '', selftext: (p.data?.selftext || '').slice(0, 400), subreddit: p.data?.subreddit || '', score: p.data?.score || 0, comments: p.data?.num_comments || 0 }));
        } catch { continue; }
      }
      return [];
    })());

    // Keyword searches
    const searchFetches = SEARCH_QUERIES.map(q => (async () => {
      for (const k of keys) {
        try {
          const r = await fetchWithTimeout<any>(`https://${HOST}/search?query=${encodeURIComponent(q)}&sort=relevance&time=month`, { headers: { 'x-rapidapi-host': HOST, 'x-rapidapi-key': k } }, 10000);
          if (!r) continue;
          const posts = r?.data?.posts || r?.data?.children || [];
          return posts.map((p: any) => { const d = p.data || p; return { title: d.title || '', selftext: (d.selftext || '').slice(0, 400), subreddit: d.subreddit || '', score: d.score || 0, comments: d.num_comments || 0 }; });
        } catch { continue; }
      }
      return [];
    })());

    const results = await Promise.all([...subFetches, ...searchFetches]);
    const posts = results.flat();
    const seen = new Set<string>(); const unique = posts.filter((p: any) => { const k = p.title.toLowerCase().trim(); if (seen.has(k)) return false; seen.add(k); return true; });
    unique.sort((a: any, b: any) => (b.score + b.comments * 2) - (a.score + a.comments * 2));
    if (!unique.length) return '';

    const lines = ['=== REDDIT COMMUNITY INSIGHTS ===', '', 'TOP DISCUSSIONS:'];
    for (const p of unique.slice(0, 20)) {
      lines.push(`- [r/${p.subreddit}] "${p.title}" (${p.score} pts, ${p.comments} comments)`);
      if (p.selftext && p.selftext.length > 30) lines.push(`  Context: ${p.selftext.slice(0, 250).replace(/\n/g, ' ')}`);
    }

    const painPosts = unique.filter((p: any) => /wish|need|looking for|frustrated|anyone built|hate|problem|struggle|alternative to|somebody make|someone make|can.t find|doesn.t exist|tired of|broken|annoying|manual|waste time/i.test(p.title + ' ' + p.selftext));
    if (painPosts.length) {
      lines.push('', 'UNMET NEEDS & PAIN POINTS:');
      for (const p of painPosts.slice(0, 12)) {
        lines.push(`- "${p.title}" [r/${p.subreddit}, ${p.score}pts]`);
        if (p.selftext && p.selftext.length > 30) lines.push(`  Detail: ${p.selftext.slice(0, 150).replace(/\n/g, ' ')}`);
      }
    }

    const ideaPosts = unique.filter((p: any) => /idea|concept|would you use|would you pay|validate|million dollar|\$\d+[KMkm]|app idea|saas idea|startup idea|side project/i.test(p.title + ' ' + p.selftext));
    if (ideaPosts.length) {
      lines.push('', 'APP IDEAS & VALIDATION REQUESTS:');
      for (const p of ideaPosts.slice(0, 10)) lines.push(`- "${p.title}" [r/${p.subreddit}, ${p.score}pts]`);
    }

    const successPosts = unique.filter((p: any) => /\$\d|revenue|mrr|arr|paying (user|customer)|hit \d|profit|income|first sale|ramen profitable/i.test(p.title + ' ' + p.selftext));
    if (successPosts.length) {
      lines.push('', 'SUCCESS STORIES & REVENUE SIGNALS:');
      for (const p of successPosts.slice(0, 8)) lines.push(`- "${p.title}" [r/${p.subreddit}, ${p.score}pts]`);
    }

    const monetPosts = unique.filter((p: any) => /monetiz|pricing|charge|subscription|freemium|lifetime deal|how much|churn|convert/i.test(p.title + ' ' + p.selftext));
    if (monetPosts.length) {
      lines.push('', 'MONETIZATION & PRICING DISCUSSIONS:');
      for (const p of monetPosts.slice(0, 6)) lines.push(`- "${p.title}" [r/${p.subreddit}, ${p.score}pts]`);
    }

    lines.push('', `Total: ${unique.length} unique posts from ${SUBS.length} subreddits + ${SEARCH_QUERIES.length} keyword searches`);
    return lines.join('\n');
  } catch { return ''; }
}

async function collectTrustMRRData(): Promise<string> {
  try {
    const u = Deno.env.get('SUPABASE_URL');
    if (!u) return '';
    const r = await fetchWithTimeout<any>(`${u}/functions/v1/trustmrr-insights`, {}, 15000);
    return r?.context || '';
  } catch { return ''; }
}

async function collectG2Data(keys: string[]): Promise<string> {
  if (!keys.length) return '';
  const HOST = 'g2-data-api.p.rapidapi.com';
  const cats = [
    'project-management', 'crm', 'marketing-automation', 'accounting',
    'help-desk', 'ai-writing-assistant', 'email-marketing', 'social-media-management',
    'video-conferencing', 'survey', 'appointment-scheduling', 'invoicing',
    'employee-engagement', 'data-visualization', 'e-signature',
  ];
  try {
    const results = await Promise.all(cats.map(async cat => {
      for (const k of keys) {
        try {
          const d = await fetchWithTimeout<any>(`https://${HOST}/g2-categories?category=${cat}`, { headers: { 'x-rapidapi-host': HOST, 'x-rapidapi-key': k } }, 12000);
          if (!d) continue;
          return { cat, count: d?.count || 0, products: (d?.results || []).slice(0, 8) };
        } catch { continue; }
      }
      return { cat, count: 0, products: [] };
    }));
    const valid = results.filter((r: any) => r.products.length);
    if (!valid.length) return '';
    const lines = ['=== G2 SOFTWARE MARKET INTELLIGENCE ===', ''];
    for (const r of valid) {
      lines.push(`CATEGORY: ${r.cat.toUpperCase().replace(/-/g, ' ')} (${r.count} products)`);
      for (const p of r.products.slice(0, 6)) lines.push(`  - ${p.name}`);
      lines.push('');
    }
    return lines.join('\n');
  } catch { return ''; }
}

async function collectTwitterData(keys: string[]): Promise<string> {
  if (!keys.length) return '';
  const HOST = 'twitter-search-only.p.rapidapi.com';
  const queries = [
    'SaaS startup launch', 'micro saas idea', 'built a SaaS',
    'need a tool for', 'someone should build', 'just shipped',
    'indie hacker', 'side project revenue',
    // Expanded queries
    'million dollar app idea', '$100K side project',
    'wish there was an app for', 'AI startup idea',
    'profitable micro SaaS', 'bootstrapped to',
    'passive income software', 'gap in the market',
    'no-code business idea', 'underserved niche',
  ];
  try {
    const results = await Promise.all(queries.map(async q => {
      for (const k of keys) {
        try {
          const j = await fetchWithTimeout<any>(`https://${HOST}/search.php?query=${encodeURIComponent(q)}&search_type=Top`, { headers: { 'x-rapidapi-host': HOST, 'x-rapidapi-key': k } }, 12000);
          if (!j) continue;
          return (j?.timeline || []).filter((tw: any) => tw.type === 'tweet' && tw.text && tw.lang === 'en').map((tw: any) => ({
            text: (tw.text || '').replace(/https?:\/\/\S+/g, '').trim().slice(0, 300),
            screen_name: tw.screen_name || '', favorites: tw.favorites || 0, retweets: tw.retweets || 0,
          }));
        } catch { continue; }
      }
      return [];
    }));
    const tweets = results.flat();
    const seen = new Set<string>(); const unique = tweets.filter((t: any) => { const k = t.text.slice(0, 80); if (seen.has(k)) return false; seen.add(k); return true; });
    unique.sort((a: any, b: any) => (b.favorites + b.retweets * 3) - (a.favorites + a.retweets * 3));
    if (!unique.length) return '';
    const lines = ['=== TWITTER/X REAL-TIME PULSE ===', '', 'TRENDING DISCUSSIONS:'];
    for (const t of unique.slice(0, 18)) {
      lines.push(`- @${t.screen_name} (${t.favorites} likes, ${t.retweets} RTs): "${t.text.slice(0, 260)}"`);
    }
    const painTweets = unique.filter((t: any) => /need a tool|wish there was|someone should build|looking for|frustrated with|why isn.t there|can.t find|tired of/i.test(t.text));
    if (painTweets.length) {
      lines.push('', 'UNMET NEEDS ON X:');
      for (const t of painTweets.slice(0, 10)) lines.push(`- @${t.screen_name}: "${t.text.slice(0, 220)}"`);
    }

    const bigIdeas = unique.filter((t: any) => /million dollar|\$\d+[MmKk]|\$10M|\$100K|\$1M|untapped|underserved|gap in the market|nobody.s building/i.test(t.text));
    if (bigIdeas.length) {
      lines.push('', 'HIGH-VALUE IDEA SIGNALS:');
      for (const t of bigIdeas.slice(0, 8)) lines.push(`- @${t.screen_name}: "${t.text.slice(0, 220)}"`);
    }

    const launchTweets = unique.filter((t: any) => /just launched|shipped|built a|\$\d.*mrr|revenue|paying (user|customer)|first sale|bootstrapped/i.test(t.text));
    if (launchTweets.length) {
      lines.push('', 'RECENT LAUNCHES & SUCCESS:');
      for (const t of launchTweets.slice(0, 8)) lines.push(`- @${t.screen_name}: "${t.text.slice(0, 220)}"`);
    }

    lines.push('', `Total tweets analyzed: ${unique.length} across ${queries.length} search queries`);
    return lines.join('\n');
  } catch { return ''; }
}

Deno.serve(async (_req: Request) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let CRON_SECRET = '';
    const cronSecretResolved = await resolveSecret('CRON_SECRET', supabase);
    if (cronSecretResolved) CRON_SECRET = cronSecretResolved;

    // Auth guard
    const authHeader = _req.headers.get('Authorization') || '';
    const cronHeader = _req.headers.get('x-cron-secret') || '';
    let authorized = false;

    if (CRON_SECRET && cronHeader === CRON_SECRET) authorized = true;

    if (!authorized && authHeader && SUPABASE_ANON_KEY) {
      const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'admin') authorized = true;
      }
    }

    if (!authorized && !CRON_SECRET && !authHeader) authorized = true;
    if (!authorized) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    // Resolve API keys from admin_secrets + env
    const apiKeys = await resolveApiKeys(supabase);
    const targetDate = new Date().toISOString().split('T')[0];

    console.log(`[collect-intelligence] Starting with ${apiKeys.length} API keys`);

    const [marketData, redditData, trustmrrData, g2Data, twitterData] = await Promise.all([
      collectMarketData(),
      collectRedditData(apiKeys),
      collectTrustMRRData(),
      collectG2Data(apiKeys),
      collectTwitterData(apiKeys),
    ]);

    const nowTs = new Date().toISOString();
    const updateFields: Record<string, any> = { collection_runs: 1, updated_at: nowTs };
    if (marketData) { updateFields.market_data = marketData; updateFields.market_data_updated_at = nowTs; }
    if (redditData) { updateFields.reddit_data = redditData; updateFields.reddit_data_updated_at = nowTs; }
    if (trustmrrData) { updateFields.trustmrr_data = trustmrrData; updateFields.trustmrr_data_updated_at = nowTs; }
    if (g2Data) { updateFields.g2_data = g2Data; updateFields.g2_data_updated_at = nowTs; }
    if (twitterData) { updateFields.twitter_data = twitterData; updateFields.twitter_data_updated_at = nowTs; }

    const { data: existing } = await supabase.from('market_intelligence').select('id, collection_runs').eq('target_date', targetDate).single();

    if (existing) {
      updateFields.collection_runs = (existing.collection_runs || 0) + 1;
      await supabase.from('market_intelligence').update(updateFields).eq('id', existing.id);
    } else {
      await supabase.from('market_intelligence').insert({ target_date: targetDate, ...updateFields });
    }

    console.log(`[collect-intelligence] Done. market=${marketData.length}ch reddit=${redditData.length}ch twitter=${twitterData.length}ch g2=${g2Data.length}ch`);

    return new Response(JSON.stringify({
      success: true, target_date: targetDate,
      collection_run: existing ? (existing.collection_runs || 0) + 1 : 1,
      sources: {
        market: { collected: !!marketData, length: marketData.length },
        reddit: { collected: !!redditData, length: redditData.length },
        trustmrr: { collected: !!trustmrrData, length: trustmrrData.length },
        g2: { collected: !!g2Data, length: g2Data.length },
        twitter: { collected: !!twitterData, length: twitterData.length },
      },
      api_keys_available: apiKeys.length,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[collect-intelligence] Error:', String(err));
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
