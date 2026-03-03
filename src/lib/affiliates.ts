// Affiliate link mapping for tech stack tools
// Replace the URLs with your actual affiliate links when you have them
const AFFILIATE_LINKS: Record<string, { url: string; tag: string }> = {
  // Hosting
  'vercel': { url: 'https://vercel.com', tag: 'Deploy on Vercel' },
  'netlify': { url: 'https://netlify.com', tag: 'Deploy on Netlify' },
  'aws': { url: 'https://aws.amazon.com', tag: 'Start on AWS' },
  'google cloud': { url: 'https://cloud.google.com', tag: 'Start on GCP' },
  'digitalocean': { url: 'https://digitalocean.com', tag: 'Start on DigitalOcean' },
  'railway': { url: 'https://railway.app', tag: 'Deploy on Railway' },
  'render': { url: 'https://render.com', tag: 'Deploy on Render' },
  'fly.io': { url: 'https://fly.io', tag: 'Deploy on Fly.io' },
  'cloudflare': { url: 'https://cloudflare.com', tag: 'Start on Cloudflare' },
  'heroku': { url: 'https://heroku.com', tag: 'Deploy on Heroku' },

  // Databases
  'supabase': { url: 'https://supabase.com', tag: 'Start with Supabase' },
  'firebase': { url: 'https://firebase.google.com', tag: 'Start with Firebase' },
  'planetscale': { url: 'https://planetscale.com', tag: 'Start with PlanetScale' },
  'mongodb': { url: 'https://mongodb.com', tag: 'Start with MongoDB' },
  'neon': { url: 'https://neon.tech', tag: 'Start with Neon' },

  // Payments
  'stripe': { url: 'https://stripe.com', tag: 'Set up Stripe' },
  'dodopayments': { url: 'https://dodopayments.com', tag: 'Set up Dodo Payments' },

  // Frameworks
  'next.js': { url: 'https://nextjs.org', tag: 'Learn Next.js' },
  'react': { url: 'https://react.dev', tag: 'Learn React' },
  'vue': { url: 'https://vuejs.org', tag: 'Learn Vue' },
  'svelte': { url: 'https://svelte.dev', tag: 'Learn Svelte' },
  'flutter': { url: 'https://flutter.dev', tag: 'Learn Flutter' },
  'react native': { url: 'https://reactnative.dev', tag: 'Learn React Native' },

  // AI/ML
  'openai': { url: 'https://openai.com', tag: 'Get OpenAI API' },
  'hugging face': { url: 'https://huggingface.co', tag: 'Explore HuggingFace' },
  'replicate': { url: 'https://replicate.com', tag: 'Try Replicate' },

  // Auth
  'auth0': { url: 'https://auth0.com', tag: 'Set up Auth0' },
  'clerk': { url: 'https://clerk.com', tag: 'Set up Clerk' },

  // Analytics
  'posthog': { url: 'https://posthog.com', tag: 'Set up PostHog' },
  'mixpanel': { url: 'https://mixpanel.com', tag: 'Set up Mixpanel' },

  // Email
  'resend': { url: 'https://resend.com', tag: 'Set up Resend' },
  'sendgrid': { url: 'https://sendgrid.com', tag: 'Set up SendGrid' },

  // Domains
  'namecheap': { url: 'https://namecheap.com', tag: 'Get a Domain' },
  'godaddy': { url: 'https://godaddy.com', tag: 'Get a Domain' },
}

export function getAffiliateLink(tool: string): { url: string; tag: string } | null {
  const lower = tool.toLowerCase().trim()
  // Exact match
  if (AFFILIATE_LINKS[lower]) return AFFILIATE_LINKS[lower]
  // Partial match
  for (const [key, value] of Object.entries(AFFILIATE_LINKS)) {
    if (lower.includes(key) || key.includes(lower)) return value
  }
  return null
}

export function hasAffiliateLink(tool: string): boolean {
  return getAffiliateLink(tool) !== null
}
