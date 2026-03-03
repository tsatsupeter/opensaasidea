// Site configuration driven by VITE_SITE_MODE environment variable
// 'saas' = opensaasidea.com (SaaS ideas only)
// 'full' = openprojectidea.com (all project types)

export type SiteMode = 'saas' | 'full'

export interface SiteConfig {
  mode: SiteMode
  name: string
  shortName: string
  brandWord: string
  domain: string
  tagline: string
  metaDescription: string
  themeStorageKey: string
  logoAlt: string
  heroTitle: string
  heroSubtitle: string
  emptyStateText: string
  generateLabel: string
  ideaLabel: string
  ideaLabelPlural: string
}

const SAAS_CONFIG: SiteConfig = {
  mode: 'saas',
  name: 'OpenSaaSIdea',
  shortName: 'OpenSaaSIdea',
  brandWord: 'SaaS',
  domain: 'opensaasidea.com',
  tagline: 'AI-powered SaaS idea generator',
  metaDescription: 'AI-powered SaaS idea generator with revenue breakdowns, tech stacks, and team planning.',
  themeStorageKey: 'opensaasidea-theme',
  logoAlt: 'OpenSaaSIdea',
  heroTitle: 'AI SaaS Idea Generator',
  heroSubtitle: 'Discover unique SaaS business ideas with full revenue breakdowns, tech stacks, and go-to-market strategies.',
  emptyStateText: 'New SaaS ideas are auto-generated daily. Check back soon!',
  generateLabel: 'Generate Idea',
  ideaLabel: 'idea',
  ideaLabelPlural: 'ideas',
}

const FULL_CONFIG: SiteConfig = {
  mode: 'full',
  name: 'OpenProjectIdea',
  shortName: 'OpenProjectIdea',
  brandWord: 'Project',
  domain: 'openprojectidea.com',
  tagline: 'AI-powered project & business idea generator',
  metaDescription: 'AI-powered idea generator for SaaS, local businesses, hardware, science, manufacturing, and more. Full revenue breakdowns and execution plans.',
  themeStorageKey: 'openprojectidea-theme',
  logoAlt: 'OpenProjectIdea',
  heroTitle: 'AI Project Idea Generator',
  heroSubtitle: 'Discover unique project ideas across every industry — SaaS, local business, hardware, science, manufacturing, and more.',
  emptyStateText: 'New project ideas are auto-generated daily. Check back soon!',
  generateLabel: 'Generate Idea',
  ideaLabel: 'idea',
  ideaLabelPlural: 'ideas',
}

const mode = (import.meta.env.VITE_SITE_MODE || 'saas') as SiteMode

export const siteConfig: SiteConfig = mode === 'full' ? FULL_CONFIG : SAAS_CONFIG

// Helper to render the branded name as parts for JSX
// e.g. "Open" + "SaaS" (branded) + "Idea" or "Open" + "Project" (branded) + "Idea"
export function getBrandParts(): { prefix: string; brand: string; suffix: string } {
  return {
    prefix: 'Open',
    brand: siteConfig.brandWord,
    suffix: 'Idea',
  }
}
