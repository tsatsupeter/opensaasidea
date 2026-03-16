import { Helmet } from 'react-helmet-async'
import { useSiteSettings } from '@/hooks/use-site-settings'
import { siteConfig } from '@/lib/site-config'

// Fallback defaults derived from static siteConfig (used when DB settings haven't loaded yet)
const FALLBACK_SITE_NAME = siteConfig.name
const FALLBACK_SITE_URL = `https://${siteConfig.domain}`
const FALLBACK_DESCRIPTION = siteConfig.metaDescription
const FALLBACK_IMAGE = `${FALLBACK_SITE_URL}/og-image.svg`

/**
 * Hook that returns the current dynamic site values, merging admin DB settings over static fallbacks.
 * This is the single source of truth for site name, URL, description, OG image, etc.
 */
export function useSiteDefaults() {
  const { getSetting } = useSiteSettings()

  const siteName = getSetting('site_name', FALLBACK_SITE_NAME)
  const siteUrl = getSetting('canonical_url', FALLBACK_SITE_URL)
  const defaultDescription = getSetting('meta_description', FALLBACK_DESCRIPTION)
  const defaultImage = getSetting('og_image', FALLBACK_IMAGE)
  const defaultKeywords = getSetting('meta_keywords', '')
  const supportEmail = getSetting('support_email', `hello@${siteConfig.domain}`)
  const logoUrl = getSetting('logo_url', '/logo.png')
  const ogTitle = getSetting('og_title', '')
  const ogDescription = getSetting('og_description', '')
  const twitterHandle = getSetting('twitter_handle', '')

  return { siteName, siteUrl, defaultDescription, defaultImage, defaultKeywords, supportEmail, logoUrl, ogTitle, ogDescription, twitterHandle }
}

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  noindex?: boolean
  keywords?: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  jsonLd?: Record<string, any> | Record<string, any>[]
}

export function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  noindex = false,
  keywords,
  publishedTime,
  modifiedTime,
  author,
  jsonLd,
}: SEOProps) {
  const { siteName, siteUrl, defaultDescription, defaultImage, ogTitle: adminOgTitle, ogDescription: adminOgDesc, twitterHandle } = useSiteDefaults()

  const resolvedDescription = description || defaultDescription
  const resolvedImage = image || defaultImage
  const fullTitle = title ? `${title} | ${siteName}` : (adminOgTitle || `${siteName} — AI-Powered SaaS Idea Generator`)
  const canonicalUrl = url ? `${siteUrl}${url}` : undefined
  const resolvedOgTitle = title ? fullTitle : (adminOgTitle || fullTitle)
  const resolvedOgDesc = description || adminOgDesc || resolvedDescription

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={resolvedDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDesc} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:site_name" content={siteName} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDesc} />
      <meta name="twitter:image" content={resolvedImage} />
      {twitterHandle && <meta name="twitter:site" content={twitterHandle.startsWith('@') ? twitterHandle : `@${twitterHandle}`} />}

      {/* Article-specific */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : jsonLd)}
        </script>
      )}
    </Helmet>
  )
}

// ─── Dynamic JSON-LD schema builders ─────────────────────────────────
// These are hooks/functions that accept dynamic site values

export function useOrganizationSchema() {
  const { siteName, siteUrl, supportEmail, logoUrl } = useSiteDefaults()
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: logoUrl.startsWith('http') ? logoUrl : `${siteUrl}${logoUrl}`,
    description: `AI-powered platform for generating profitable SaaS and business ideas with revenue breakdowns, execution plans, and market analysis.`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: supportEmail,
      contactType: 'customer support',
    },
  }
}

export function useWebsiteSchema() {
  const { siteName, siteUrl, defaultDescription } = useSiteDefaults()
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description: defaultDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/explore?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function useSoftwareAppSchema() {
  const { siteName, siteUrl, defaultDescription } = useSiteDefaults()
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteName,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: siteUrl,
    description: defaultDescription,
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        name: 'Free',
        description: 'Get started with 3 AI-generated ideas per day',
      },
      {
        '@type': 'Offer',
        price: '9.99',
        priceCurrency: 'USD',
        name: 'Pro Monthly',
        description: 'Unlimited ideas, PDF exports, advanced analytics',
      },
      {
        '@type': 'Offer',
        price: '19.99',
        priceCurrency: 'USD',
        name: 'Team Monthly',
        description: 'Everything in Pro plus team collaboration and shared workspaces',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
  }
}

export function useBuildIdeaSchema() {
  const { siteName, siteUrl, logoUrl } = useSiteDefaults()
  return (idea: {
    title: string
    slug: string
    description?: string
    category?: string
    created_at?: string
    updated_at?: string
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: idea.title,
    description: idea.description || `Explore ${idea.title} — a SaaS business idea with revenue breakdown, market analysis, and execution plan.`,
    url: `${siteUrl}/idea/${idea.slug}`,
    datePublished: idea.created_at,
    dateModified: idea.updated_at || idea.created_at,
    author: {
      '@type': 'Organization',
      name: siteName,
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl.startsWith('http') ? logoUrl : `${siteUrl}${logoUrl}`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/idea/${idea.slug}`,
    },
    ...(idea.category && {
      articleSection: idea.category,
    }),
  })
}

export function buildFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function useBuildBreadcrumbSchema() {
  const { siteUrl } = useSiteDefaults()
  return (items: { name: string; url: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  })
}
