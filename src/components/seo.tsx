import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'OpenProjectIdea'
const SITE_URL = 'https://openprojectidea.com'
const DEFAULT_DESCRIPTION = 'AI-powered SaaS idea generator with revenue breakdowns, execution plans, market analysis, and team planning. Discover profitable business ideas instantly.'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.svg`

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
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
  keywords,
  publishedTime,
  modifiedTime,
  author,
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — AI-Powered SaaS Idea Generator`
  const canonicalUrl = url ? `${SITE_URL}${url}` : undefined

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

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

// Pre-built JSON-LD schemas
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OpenProjectIdea',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: 'AI-powered platform for generating profitable SaaS and business ideas with revenue breakdowns, execution plans, and market analysis.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'hello@tsatsupeter.com',
    contactType: 'customer support',
  },
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'OpenProjectIdea',
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/explore?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'OpenProjectIdea',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description: 'AI-powered SaaS idea generator with revenue breakdowns, execution plans, market analysis, and team planning.',
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

export function buildIdeaSchema(idea: {
  title: string
  slug: string
  description?: string
  category?: string
  created_at?: string
  updated_at?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: idea.title,
    description: idea.description || `Explore ${idea.title} — a SaaS business idea with revenue breakdown, market analysis, and execution plan.`,
    url: `${SITE_URL}/idea/${idea.slug}`,
    datePublished: idea.created_at,
    dateModified: idea.updated_at || idea.created_at,
    author: {
      '@type': 'Organization',
      name: 'OpenProjectIdea',
    },
    publisher: {
      '@type': 'Organization',
      name: 'OpenProjectIdea',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/idea/${idea.slug}`,
    },
    ...(idea.category && {
      articleSection: idea.category,
    }),
  }
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

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  }
}
