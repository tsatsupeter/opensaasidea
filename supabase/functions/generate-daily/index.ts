import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VALID_PLATFORMS = ['web', 'mobile', 'desktop', 'browser_extension', 'api', 'multi_platform', 'physical', 'local', 'hybrid'];
const VALID_MONETIZATION = ['subscription', 'freemium', 'one_time', 'marketplace', 'advertising', 'affiliate', 'hybrid', 'retail', 'wholesale', 'service_fee'];

function normalizePlatform(raw: unknown): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const lower = raw.toLowerCase().replace(/[^a-z_ ]/g, '').trim();
  if (VALID_PLATFORMS.includes(lower)) return lower;
  if (/multi|cross|all/i.test(lower)) return 'multi_platform';
  if (/mobile|ios|android|app/i.test(lower)) return 'mobile';
  if (/desktop|mac|windows|electron/i.test(lower)) return 'desktop';
  if (/browser.?ext|chrome.?ext|addon|plugin/i.test(lower)) return 'browser_extension';
  if (/api|backend|server/i.test(lower)) return 'api';
  if (/web|saas|cloud|online/i.test(lower)) return 'web';
  if (/physical|hardware|device|product/i.test(lower)) return 'physical';
  if (/local|shop|store|restaurant|service/i.test(lower)) return 'local';
  if (/hybrid|both|mixed/i.test(lower)) return 'hybrid';
  return 'web';
}

function normalizeMonetization(raw: unknown): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const lower = raw.toLowerCase().replace(/[^a-z_ ]/g, '').trim();
  if (VALID_MONETIZATION.includes(lower)) return lower;
  if (/subscri|recurring|monthly|annual/i.test(lower)) return 'subscription';
  if (/freemium|free.?tier|free.?plan/i.test(lower)) return 'freemium';
  if (/one.?time|lifetime|single/i.test(lower)) return 'one_time';
  if (/market|platform|two.?sided/i.test(lower)) return 'marketplace';
  if (/ad|sponsor|display/i.test(lower)) return 'advertising';
  if (/affili|referr|commission/i.test(lower)) return 'affiliate';
  if (/hybrid|mixed|combo|multiple/i.test(lower)) return 'hybrid';
  if (/retail|shop|store|direct/i.test(lower)) return 'retail';
  if (/wholesale|bulk|b2b.?sale/i.test(lower)) return 'wholesale';
  if (/service.?fee|commission|per.?job|per.?hour/i.test(lower)) return 'service_fee';
  return 'subscription';
}

function ensureArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') return [val];
  return [];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}
function wordSet(s: string): Set<string> {
  return new Set(normalize(s).split(' ').filter(w => w.length > 2));
}
function similarity(a: string, b: string): number {
  const setA = wordSet(a); const setB = wordSet(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
function isTooSimilar(newTitle: string, newDesc: string, existing: Array<{ title: string; description: string | null }>): { duplicate: boolean; match?: string } {
  const normTitle = normalize(newTitle);
  for (const e of existing) {
    if (normalize(e.title) === normTitle) return { duplicate: true, match: e.title };
    if (similarity(newTitle, e.title) > 0.6) return { duplicate: true, match: e.title };
    if (newDesc && e.description && similarity(newDesc, e.description) > 0.5) return { duplicate: true, match: e.title };
  }
  return { duplicate: false };
}
function buildBlacklist(existing: Array<{ title: string; category: string | null }>): string {
  if (!existing.length) return '';
  const titles = existing.map(e => e.title);
  const catCounts: Record<string, number> = {};
  for (const e of existing) { if (e.category) catCounts[e.category] = (catCounts[e.category] || 0) + 1; }
  const saturated = Object.entries(catCounts).filter(([, n]) => n > 5).sort((a, b) => b[1] - a[1]).map(([cat, n]) => `${cat} (${n} ideas)`);
  let block = '\n\n=== ALREADY GENERATED IDEAS (DO NOT DUPLICATE) ===\n';
  block += titles.map(t => `- ${t}`).join('\n');
  if (saturated.length) { block += '\n\nOVERSATURATED CATEGORIES:\n'; block += saturated.map(s => `- ${s}`).join('\n'); }
  return block;
}
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

const SAASY_BASE = 'https://saasytrends.com/api';
async function fetchJSON<T>(url: string): Promise<T | null> {
  try { const c = new AbortController(); const id = setTimeout(() => c.abort(), 8000); const r = await fetch(url, { signal: c.signal }); clearTimeout(id); if (!r.ok) return null; return await r.json(); } catch { return null; }
}
function parseCompanies(data: any): any[] {
  if (!data?.chartData) return [];
  return data.chartData.filter((c: any) => c.datasets?.[0]?.label && c.description).map((c: any) => ({ name: c.datasets[0].label, shortDescription: c.shortDescription || c.description?.slice(0, 120) || '', category: c.category || [], businessModel: c.businessModel || 'unknown', growthRate: c.growthRate || 0 }));
}
async function getMarketContext(): Promise<string> {
  try {
    const [a, b, c, d] = await Promise.all([fetchJSON(`${SAASY_BASE}/companies?timeFrame=48&page=1`), fetchJSON(`${SAASY_BASE}/companies?timeFrame=24&page=1&model=B2B`), fetchJSON(`${SAASY_BASE}/companies?timeFrame=24&page=1&model=B2C`), fetchJSON(`${SAASY_BASE}/companies?timeFrame=24&page=1&model=B2B%2FB2C&volumeMin=5&volumeMax=100`)]);
    const all = [...parseCompanies(a), ...parseCompanies(b), ...parseCompanies(c), ...parseCompanies(d)];
    const seen = new Set<string>(); const unique: any[] = [];
    for (const co of all) { if (!seen.has(co.name)) { seen.add(co.name); unique.push(co); } }
    unique.sort((x: any, y: any) => y.growthRate - x.growthRate);
    if (!unique.length) return '';
    const lines = ['=== REAL-TIME SAAS MARKET DATA ===', ''];
    for (const co of unique.slice(0, 15)) lines.push(`- ${co.name} (${co.businessModel}, growth: ${co.growthRate.toFixed(1)}x): ${co.shortDescription}`);
    return lines.join('\n');
  } catch { return ''; }
}
async function getTrustMRRContext(): Promise<string> {
  try {
    const u = Deno.env.get('SUPABASE_URL'); if (!u) return '';
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 15000);
    const r = await fetch(`${u}/functions/v1/trustmrr-insights`, { signal: c.signal }); clearTimeout(t);
    if (!r.ok) return ''; const d = await r.json(); return d.context || '';
  } catch { return ''; }
}
async function getRedditContext(keys: string[]): Promise<string> {
  if (!keys.length) return '';
  const RAPIDAPI_HOST = 'reddit34.p.rapidapi.com';
  // Expanded subreddit list
  const TOP_SUBS = [
    'SaaS', 'microsaas', 'startups', 'AppIdeas', 'SomebodyMakeThis', 'SideProject',
    'Entrepreneur', 'indiehackers', 'smallbusiness', 'business_ideas',
    'EntrepreneurRideAlong', 'sweatystartup', 'IMadeThis',
    'webdev', 'nocode', 'lowcode', 'automation', 'ChatGPT', 'LocalLLaMA',
    'vibecoding', 'lovable', 'digitalnomad', 'passive_income',
    'fintech', 'edtech', 'ProductManagement', 'Lightbulb',
    'productivity', 'selfhosted', 'ecommerce', 'SEO',
  ];
  // Keyword searches
  const SEARCH_QUERIES = [
    'million dollar app idea',
    '$100K side project',
    'SaaS idea nobody built',
    'micro SaaS profitable',
    'someone should build',
    'wish there was an app',
    'AI startup idea',
    'tool I would pay for',
  ];
  try {
    const subFetches = TOP_SUBS.map(sub =>
      (async () => {
        for (const apiKey of keys) {
          try {
            const c = new AbortController(); const t = setTimeout(() => c.abort(), 10000);
            const r = await fetch(`https://${RAPIDAPI_HOST}/getTopPostsBySubreddit?subreddit=${sub}&time=week`, { headers: { 'x-rapidapi-host': RAPIDAPI_HOST, 'x-rapidapi-key': apiKey }, signal: c.signal });
            clearTimeout(t);
            if (r.status === 429 || r.status === 403) continue;
            if (!r.ok) return [];
            const j = await r.json();
            return (j?.data?.posts || []).map((p: any) => ({ title: p.data?.title || '', selftext: (p.data?.selftext || '').slice(0, 300), subreddit: p.data?.subreddit || '', score: p.data?.score || 0, comments: p.data?.num_comments || 0 }));
          } catch { continue; }
        }
        return [];
      })()
    );
    const searchFetches = SEARCH_QUERIES.map(q =>
      (async () => {
        for (const apiKey of keys) {
          try {
            const c = new AbortController(); const t = setTimeout(() => c.abort(), 10000);
            const r = await fetch(`https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(q)}&sort=relevance&time=month`, { headers: { 'x-rapidapi-host': RAPIDAPI_HOST, 'x-rapidapi-key': apiKey }, signal: c.signal });
            clearTimeout(t);
            if (r.status === 429 || r.status === 403) continue;
            if (!r.ok) return [];
            const j = await r.json();
            const posts = j?.data?.posts || j?.data?.children || [];
            return posts.map((p: any) => { const d = p.data || p; return { title: d.title || '', selftext: (d.selftext || '').slice(0, 300), subreddit: d.subreddit || '', score: d.score || 0, comments: d.num_comments || 0 }; });
          } catch { continue; }
        }
        return [];
      })()
    );
    const results = await Promise.all([...subFetches, ...searchFetches]);
    const posts = results.flat();
    if (!posts.length) return '';
    const seen = new Set<string>(); const unique = posts.filter((p: any) => { const k = p.title.toLowerCase().trim(); if (seen.has(k)) return false; seen.add(k); return true; });
    unique.sort((a: any, b: any) => (b.score + b.comments * 2) - (a.score + a.comments * 2));
    const lines = ['=== REDDIT INSIGHTS ===', ''];
    lines.push('TOP DISCUSSIONS:');
    for (const p of unique.slice(0, 18)) {
      lines.push(`- [r/${p.subreddit}] "${p.title}" (${p.score} pts, ${p.comments} comments)`);
      if (p.selftext && p.selftext.length > 30) lines.push(`  Context: ${p.selftext.slice(0, 200).replace(/\n/g, ' ')}`);
    }
    const painPosts = unique.filter((p: any) => /wish|need|looking for|frustrated|anyone built|hate|problem|struggle|alternative to|somebody make|someone make|can.t find|tired of|broken|annoying/i.test(p.title + ' ' + p.selftext));
    if (painPosts.length) {
      lines.push('', 'UNMET NEEDS & PAIN POINTS:');
      for (const p of painPosts.slice(0, 10)) lines.push(`- "${p.title}" [r/${p.subreddit}, ${p.score}pts]`);
    }
    const ideaPosts = unique.filter((p: any) => /idea|million dollar|\$\d+[KMkm]|app idea|saas idea|startup idea|would you pay|validate/i.test(p.title + ' ' + p.selftext));
    if (ideaPosts.length) {
      lines.push('', 'IDEA DISCUSSIONS & VALIDATION:');
      for (const p of ideaPosts.slice(0, 8)) lines.push(`- "${p.title}" [r/${p.subreddit}, ${p.score}pts]`);
    }
    const successPosts = unique.filter((p: any) => /\$\d|revenue|mrr|paying (user|customer)|profit|income|first sale/i.test(p.title + ' ' + p.selftext));
    if (successPosts.length) {
      lines.push('', 'SUCCESS STORIES:');
      for (const p of successPosts.slice(0, 6)) lines.push(`- "${p.title}" [r/${p.subreddit}, ${p.score}pts]`);
    }
    lines.push('', `Total: ${unique.length} posts from ${TOP_SUBS.length} subs + ${SEARCH_QUERIES.length} keyword searches`);
    return lines.join('\n');
  } catch { return ''; }
}
async function getTwitterContext(keys: string[]): Promise<string> {
  if (!keys.length) return '';
  try {
    const HOST = 'twitter-search-only.p.rapidapi.com';
    // Expanded search queries
    const queries = [
      'SaaS startup launch', 'micro saas idea', 'need a tool for',
      'someone should build', 'built a SaaS', 'just shipped',
      'million dollar app idea', '$100K side project',
      'wish there was an app', 'AI startup idea',
      'profitable micro SaaS', 'gap in the market',
      'passive income software', 'indie hacker revenue',
      'no-code business idea', 'bootstrapped to',
    ];
    const results = await Promise.all(queries.map(async q => {
      for (const apiKey of keys) {
        try {
          const c = new AbortController(); const t = setTimeout(() => c.abort(), 12000);
          const r = await fetch(`https://${HOST}/search.php?query=${encodeURIComponent(q)}&search_type=Top`, { headers: { 'x-rapidapi-host': HOST, 'x-rapidapi-key': apiKey }, signal: c.signal });
          clearTimeout(t);
          if (r.status === 429 || r.status === 403) continue;
          if (!r.ok) return [];
          const j = await r.json();
          return (j?.timeline || []).filter((tw: any) => tw.type === 'tweet' && tw.text && tw.lang === 'en').map((tw: any) => ({ text: (tw.text || '').replace(/https?:\/\/\S+/g, '').trim().slice(0, 300), screen_name: tw.screen_name || '', favorites: tw.favorites || 0, retweets: tw.retweets || 0 }));
        } catch { continue; }
      }
      return [];
    }));
    const tweets = results.flat();
    if (!tweets.length) return '';
    const seen = new Set<string>(); const unique = tweets.filter((t: any) => { const k = t.text.slice(0, 80); if (seen.has(k)) return false; seen.add(k); return true; });
    unique.sort((a: any, b: any) => (b.favorites + b.retweets * 3) - (a.favorites + a.retweets * 3));
    const lines = ['=== TWITTER/X PULSE ===', ''];
    lines.push('TRENDING:');
    for (const tw of unique.slice(0, 15)) lines.push(`- @${tw.screen_name} (${tw.favorites} likes, ${tw.retweets} RTs): "${tw.text.slice(0, 250)}"`);
    const painTweets = unique.filter((t: any) => /need a tool|wish there was|someone should build|looking for|frustrated with|why isn.t there|can.t find/i.test(t.text));
    if (painTweets.length) {
      lines.push('', 'UNMET NEEDS ON X:');
      for (const t of painTweets.slice(0, 8)) lines.push(`- @${t.screen_name}: "${t.text.slice(0, 220)}"`);
    }
    const bigIdeas = unique.filter((t: any) => /million dollar|\$\d+[MmKk]|untapped|underserved|gap in the market|nobody.s building/i.test(t.text));
    if (bigIdeas.length) {
      lines.push('', 'HIGH-VALUE IDEA SIGNALS:');
      for (const t of bigIdeas.slice(0, 6)) lines.push(`- @${t.screen_name}: "${t.text.slice(0, 220)}"`);
    }
    lines.push('', `Total: ${unique.length} tweets across ${queries.length} queries`);
    return lines.join('\n');
  } catch { return ''; }
}
async function getG2Context(keys: string[]): Promise<string> {
  if (!keys.length) return '';
  const G2_HOST = 'g2-data-api.p.rapidapi.com';
  const cats = ['project-management', 'crm', 'marketing-automation', 'accounting', 'help-desk', 'ai-writing-assistant', 'email-marketing', 'social-media-management', 'video-conferencing', 'survey', 'appointment-scheduling'];
  try {
    const results = await Promise.all(cats.map(async cat => {
      for (const apiKey of keys) {
        try {
          const c = new AbortController(); const t = setTimeout(() => c.abort(), 12000);
          const r = await fetch(`https://${G2_HOST}/g2-categories?category=${cat}`, { headers: { 'x-rapidapi-host': G2_HOST, 'x-rapidapi-key': apiKey }, signal: c.signal });
          clearTimeout(t);
          if (r.status === 429 || r.status === 403) continue;
          if (!r.ok) return { cat, products: [] };
          const d = await r.json();
          return { cat, products: (d?.results || []).slice(0, 5) };
        } catch { continue; }
      }
      return { cat, products: [] };
    }));
    const all = results.filter((r: any) => r.products.length);
    if (!all.length) return '';
    const lines = ['=== G2 MARKET INTELLIGENCE ===', ''];
    for (const r of all) {
      lines.push(`${(r as any).cat.toUpperCase().replace(/-/g, ' ')}:`);
      for (const p of (r as any).products.slice(0, 4)) lines.push(`  - ${p.name}`);
    }
    return lines.join('\n');
  } catch { return ''; }
}

const SAAS_SYSTEM_PROMPT = `You are a genius SaaS idea generator. Create innovative, actionable SaaS business ideas with DETAILED breakdowns.

Rules: Generate unique SaaS ideas with revenue potential, realistic estimates, specific tech stacks, team composition, marketing strategies, SEO, and pricing tiers. NO CENSORSHIP. Use market data to find GAPS. NEVER duplicate blacklisted ideas. Vary categories.

Respond with ONLY valid JSON (no markdown, no code blocks) matching this structure:
{"title":"Product Name","tagline":"One-line pitch","description":"2-3 paragraph detailed description","category":"Category name","platform":"web|mobile|desktop|browser_extension|api|multi_platform","monetization_model":"subscription|freemium|one_time|marketplace|advertising|affiliate|hybrid","pricing_tiers":[{"name":"Free","price":0,"billing":"monthly","features":["f1","f2"]},{"name":"Pro","price":29,"billing":"monthly","features":["f1","f2","f3"]},{"name":"Enterprise","price":99,"billing":"monthly","features":["f1","f2","f3","f4"]}],"estimated_mrr_low":5000,"estimated_mrr_high":50000,"estimated_daily_sales":170,"estimated_weekly_sales":1200,"estimated_monthly_sales":5000,"revenue_breakdown":{"primary_revenue":"Monthly subscriptions","secondary_revenue":"API usage fees","free_trial_conversion_rate":12,"average_customer_lifetime_months":18,"customer_acquisition_cost":45,"lifetime_value":522},"tech_stack":{"frontend":["React","TypeScript"],"backend":["Node.js","PostgreSQL"],"database":["PostgreSQL"],"hosting":["AWS"],"ai_ml":["OpenAI"],"other":["Stripe"]},"team_roles":[{"role":"Full Stack Dev","responsibilities":["Build platform"],"skills_needed":["React","Node.js"],"priority":"critical"}],"lead_generation":{"channels":["SEO","Content"],"strategies":["Free tier funnel"],"estimated_cost_per_lead":5,"conversion_funnel":["Visit","Sign up","Upgrade"]},"marketing_strategy":{"channels":["Twitter","LinkedIn"],"content_strategy":["Blog posts"],"paid_advertising":["Google Ads"],"partnerships":["Integrations"],"launch_strategy":"Product Hunt launch"},"seo_strategy":{"target_keywords":["kw1","kw2"],"content_plan":["10 posts/mo"],"technical_seo":["Fast loading"],"estimated_organic_traffic_monthly":15000},"existing_competitors":[{"name":"Competitor","url":"https://example.com","weakness":"Expensive","our_advantage":"Better UX"}],"unique_differentiators":["d1","d2"],"pros":["p1","p2"],"cons":["c1","c2"]}`;

const PROJECT_SYSTEM_PROMPT = `You are an elite project idea generator covering ALL industries. Generate UNIQUE business/project ideas (NOT software/SaaS) that generate real revenue.

Project types: Local Business, Hardware, Manufacturing, Agriculture, E-commerce, Education, Food & Beverage, Energy, Personal Services, Real Estate, Creative & Media, Transportation.

Rules: Every idea must be unique with clear revenue path and specific numbers. Vary project types widely. Do NOT generate SaaS/software ideas. Include marketing strategies and pricing.

IMPORTANT: All array fields (pros, cons, unique_differentiators, etc.) MUST be arrays of strings, never a single string.

Respond with ONLY valid JSON (no markdown, no code blocks) matching this structure:
{"title":"Business Name","tagline":"One-line pitch","description":"2-3 paragraph detailed description","category":"Category name","platform":"physical|local|hybrid|web|mobile|multi_platform","monetization_model":"retail|wholesale|service_fee|subscription|freemium|one_time|marketplace|hybrid","pricing_tiers":[{"name":"Basic","price":0,"billing":"monthly","features":["f1","f2"]},{"name":"Pro","price":29,"billing":"monthly","features":["f1","f2","f3"]},{"name":"Premium","price":99,"billing":"monthly","features":["f1","f2","f3","f4"]}],"estimated_mrr_low":5000,"estimated_mrr_high":50000,"estimated_daily_sales":170,"estimated_weekly_sales":1200,"estimated_monthly_sales":5000,"revenue_breakdown":{"primary_revenue":"Main source","secondary_revenue":"Secondary source","free_trial_conversion_rate":12,"average_customer_lifetime_months":18,"customer_acquisition_cost":45,"lifetime_value":522},"tech_stack":{"frontend":["Tools needed"],"backend":["Infrastructure"],"database":["Inventory systems"],"hosting":["Facility needs"],"ai_ml":["Automation"],"other":["Supplies"]},"team_roles":[{"role":"Role","responsibilities":["Resp 1"],"skills_needed":["Skill 1"],"priority":"critical"}],"lead_generation":{"channels":["Ch1"],"strategies":["St1"],"estimated_cost_per_lead":5,"conversion_funnel":["Step1","Step2"]},"marketing_strategy":{"channels":["Ch1"],"content_strategy":["Plan"],"paid_advertising":["Ads"],"partnerships":["Partners"],"launch_strategy":"Launch plan"},"seo_strategy":{"target_keywords":["kw1"],"content_plan":["Plan"],"technical_seo":["Tech"],"estimated_organic_traffic_monthly":15000},"existing_competitors":[{"name":"Comp","url":"https://example.com","weakness":"Weak","our_advantage":"Advantage"}],"unique_differentiators":["d1"],"pros":["p1","p2"],"cons":["c1","c2"]}`;

async function generateBatch(opts: {
  systemPrompt: string; ideaType: 'saas' | 'project'; ideaTypeLabel: string; count: number;
  openrouterKey: string; supabaseClient: any;
  existingIdeas: Array<{ title: string; description: string | null; category: string | null }>;
  blacklist: string; marketSection: string; trustmrrSection: string; twitterSection: string;
  redditSection: string; g2Section: string;
}): Promise<{ generated: string[]; rejected: string[]; errors: string[] }> {
  const { systemPrompt, ideaType, ideaTypeLabel, count, openrouterKey, supabaseClient, existingIdeas, blacklist, marketSection, trustmrrSection, twitterSection, redditSection, g2Section } = opts;
  const generated: string[] = []; const rejected: string[] = []; const errors: string[] = [];
  if (count <= 0) return { generated, rejected, errors };
  const overGenerate = count + 1;

  const ideaPromises = Array.from({ length: overGenerate }, (_, i) =>
    fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openrouterKey}`, "Content-Type": "application/json", "X-Title": ideaType === 'saas' ? "OpenSaaSIdea" : "OpenProjectIdea" },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a completely unique ${ideaTypeLabel} idea #${i + 1} for today. Focus on REAL pain points from Reddit and Twitter data, validated revenue signals, and underserved niches. The idea should be something people would actually pay for based on community discussions.${marketSection}${redditSection}${trustmrrSection}${g2Section}${twitterSection}${blacklist}\n\nRespond with ONLY valid JSON, no markdown, no code blocks.` },
        ],
        temperature: 0.9 + (i * 0.02),
        max_tokens: 4000,
      }),
    })
      .then(async r => {
        const text = await r.text();
        let data;
        try { data = JSON.parse(text); } catch { errors.push(`#${i+1} non-JSON(${r.status}): ${text.substring(0, 200)}`); return null; }
        const content = data.choices?.[0]?.message?.content;
        if (!content) { errors.push(`#${i+1} no-content: ${JSON.stringify(data).substring(0, 200)}`); return null; }
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        try { return JSON.parse(cleaned); } catch { errors.push(`#${i+1} parse-fail: ${cleaned.substring(0, 200)}`); return null; }
      })
      .catch(err => { errors.push(`#${i+1} fetch-err: ${String(err).substring(0, 200)}`); return null; })
  );

  const rawIdeas = await Promise.all(ideaPromises);
  const validIdeas = rawIdeas.filter(Boolean);

  for (const idea of validIdeas) {
    if (generated.length >= count) break;
    const allExisting = [...existingIdeas, ...generated.map(t => ({ title: t, description: null }))];
    const check = isTooSimilar(idea.title || '', idea.description || '', allExisting);
    if (check.duplicate) { rejected.push(idea.title); continue; }
    const row = {
      title: idea.title, tagline: idea.tagline, description: idea.description,
      is_public: true, generated_for: null, idea_type: ideaType, category: idea.category,
      platform: normalizePlatform(idea.platform), monetization_model: normalizeMonetization(idea.monetization_model),
      pricing_tiers: Array.isArray(idea.pricing_tiers) ? idea.pricing_tiers : [],
      estimated_mrr_low: idea.estimated_mrr_low, estimated_mrr_high: idea.estimated_mrr_high,
      estimated_daily_sales: idea.estimated_daily_sales, estimated_weekly_sales: idea.estimated_weekly_sales, estimated_monthly_sales: idea.estimated_monthly_sales,
      revenue_breakdown: idea.revenue_breakdown || {}, tech_stack: idea.tech_stack || {},
      team_roles: Array.isArray(idea.team_roles) ? idea.team_roles : [],
      lead_generation: idea.lead_generation || {}, marketing_strategy: idea.marketing_strategy || {}, seo_strategy: idea.seo_strategy || {},
      existing_competitors: Array.isArray(idea.existing_competitors) ? idea.existing_competitors : [],
      unique_differentiators: ensureArray(idea.unique_differentiators),
      pros: ensureArray(idea.pros),
      cons: ensureArray(idea.cons),
      ai_model_used: "deepseek/deepseek-chat",
    };
    const { error } = await supabaseClient.from("saas_ideas").insert(row);
    if (error) { errors.push(`insert-err(${idea.title}): ${JSON.stringify(error).substring(0, 200)}`); } else { generated.push(idea.title); }
  }
  return { generated, rejected, errors };
}

Deno.serve(async (req: Request) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing env vars" }), { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve secrets from admin_secrets
    const OPENROUTER_API_KEY = await resolveSecret('OPENROUTER_API_KEY', supabase);
    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }), { status: 500 });
    }

    let CRON_SECRET = '';
    const cronSecretResolved = await resolveSecret('CRON_SECRET', supabase);
    if (cronSecretResolved) CRON_SECRET = cronSecretResolved;

    const apiKeys = await resolveApiKeys(supabase);

    // Auth guard
    const authHeader = req.headers.get("Authorization") || "";
    const cronHeader = req.headers.get("x-cron-secret") || "";
    let authorized = false;
    if (CRON_SECRET && cronHeader === CRON_SECRET) authorized = true;
    if (!authorized && authHeader && SUPABASE_ANON_KEY) {
      const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role === "admin") authorized = true;
      }
    }
    if (!authorized && !CRON_SECRET && !authHeader) authorized = true;
    if (!authorized) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    console.log(`[generate-daily] Starting with ${apiKeys.length} API keys`);

    const [existingRes, marketContext, redditContext, trustmrrContext, g2Context, twitterContext] = await Promise.all([
      supabase.from("saas_ideas").select("title, description, category").order("created_at", { ascending: false }).limit(200),
      getMarketContext(),
      getRedditContext(apiKeys),
      getTrustMRRContext(),
      getG2Context(apiKeys),
      getTwitterContext(apiKeys),
    ]);

    const existingIdeas = (existingRes.data || []) as Array<{ title: string; description: string | null; category: string | null }>;
    const blacklist = buildBlacklist(existingIdeas);
    const marketSection = marketContext ? `\n\n${marketContext}\n\n` : '';
    const redditSection = redditContext ? `\n\n${redditContext}\n\n` : '';
    const trustmrrSection = trustmrrContext ? `\n\n${trustmrrContext}\n\n` : '';
    const g2Section = g2Context ? `\n\n${g2Context}\n\n` : '';
    const twitterSection = twitterContext ? `\n\n${twitterContext}\n\n` : '';

    const today = new Date().toISOString().split("T")[0];
    const [saasCountRes, projectCountRes] = await Promise.all([
      supabase.from("saas_ideas").select("*", { count: "exact", head: true }).eq("is_public", true).is("generated_for", null).eq("idea_type", "saas").gte("created_at", today),
      supabase.from("saas_ideas").select("*", { count: "exact", head: true }).eq("is_public", true).is("generated_for", null).eq("idea_type", "project").gte("created_at", today),
    ]);

    const saasToday = saasCountRes.count || 0;
    const projectToday = projectCountRes.count || 0;
    const saasToGenerate = Math.max(0, 1 - saasToday);
    const projectToGenerate = Math.max(0, 1 - projectToday);

    const sharedOpts = { openrouterKey: OPENROUTER_API_KEY, supabaseClient: supabase, existingIdeas, blacklist, marketSection, redditSection, trustmrrSection, g2Section, twitterSection };

    const [saasResult, projectResult] = await Promise.all([
      generateBatch({ ...sharedOpts, systemPrompt: SAAS_SYSTEM_PROMPT, ideaType: 'saas', ideaTypeLabel: 'SaaS business', count: saasToGenerate }),
      generateBatch({ ...sharedOpts, systemPrompt: PROJECT_SYSTEM_PROMPT, ideaType: 'project', ideaTypeLabel: 'broad project/business', count: projectToGenerate }),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        saas_generated: saasResult.generated.length, saas_titles: saasResult.generated, saas_already_today: saasToday, saas_errors: saasResult.errors,
        project_generated: projectResult.generated.length, project_titles: projectResult.generated, project_already_today: projectToday, project_errors: projectResult.errors,
        total_generated: saasResult.generated.length + projectResult.generated.length,
        duplicates_rejected: [...saasResult.rejected, ...projectResult.rejected],
        market_data_available: !!marketContext, reddit_data_available: !!redditContext, trustmrr_data_available: !!trustmrrContext, g2_data_available: !!g2Context, twitter_data_available: !!twitterContext,
        api_keys_available: apiKeys.length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error('[generate-daily] Error:', String(err));
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

