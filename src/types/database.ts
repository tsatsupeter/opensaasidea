export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          cv_text: string | null
          cv_file_url: string | null
          experience_level: 'beginner' | 'intermediate' | 'senior' | 'expert' | null
          interests: string[]
          preferred_platforms: string[]
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      user_skills: {
        Row: {
          id: string
          user_id: string
          skill_name: string
          skill_category: 'frontend' | 'backend' | 'mobile' | 'ai_ml' | 'devops' | 'design' | 'marketing' | 'seo' | 'business' | 'other'
          proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_skills']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['user_skills']['Row']>
      }
      saas_ideas: {
        Row: {
          id: string
          title: string
          tagline: string | null
          description: string
          is_public: boolean
          generated_for: string | null
          category: string
          platform: 'web' | 'mobile' | 'desktop' | 'browser_extension' | 'api' | 'multi_platform'
          monetization_model: 'subscription' | 'freemium' | 'one_time' | 'marketplace' | 'advertising' | 'affiliate' | 'hybrid'
          pricing_tiers: PricingTier[]
          estimated_mrr_low: number | null
          estimated_mrr_high: number | null
          estimated_daily_sales: number | null
          estimated_weekly_sales: number | null
          estimated_monthly_sales: number | null
          revenue_breakdown: RevenueBreakdown
          tech_stack: TechStack
          team_roles: TeamRole[]
          lead_generation: LeadGeneration
          marketing_strategy: MarketingStrategy
          seo_strategy: SeoStrategy
          existing_competitors: Competitor[]
          unique_differentiators: string[]
          pros: string[]
          cons: string[]
          views: number
          upvotes: number
          downvotes: number
          vote_score: number
          ai_model_used: string | null
          generation_prompt_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['saas_ideas']['Row']> & {
          title: string
          description: string
          category: string
        }
        Update: Partial<Database['public']['Tables']['saas_ideas']['Row']>
      }
      votes: {
        Row: {
          id: string
          user_id: string
          idea_id: string
          vote_type: 'up' | 'down'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['votes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['votes']['Row']>
      }
      generation_feedback: {
        Row: {
          id: string
          idea_id: string
          category: string | null
          platform: string | null
          monetization_model: string | null
          vote_score: number
          feedback_data: Record<string, unknown>
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['generation_feedback']['Row']>
        Update: Partial<Database['public']['Tables']['generation_feedback']['Row']>
      }
    }
  }
}

export interface PricingTier {
  name: string
  price: number
  billing: 'monthly' | 'yearly' | 'one_time'
  features: string[]
}

export interface RevenueBreakdown {
  primary_revenue: string
  secondary_revenue?: string
  free_trial_conversion_rate?: number
  average_customer_lifetime_months?: number
  customer_acquisition_cost?: number
  lifetime_value?: number
}

export interface TechStack {
  frontend: string[]
  backend: string[]
  database: string[]
  hosting: string[]
  ai_ml?: string[]
  other?: string[]
}

export interface TeamRole {
  role: string
  responsibilities: string[]
  skills_needed: string[]
  priority: 'critical' | 'important' | 'nice_to_have'
}

export interface LeadGeneration {
  channels: string[]
  strategies: string[]
  estimated_cost_per_lead?: number
  conversion_funnel?: string[]
}

export interface MarketingStrategy {
  channels: string[]
  content_strategy?: string[]
  paid_advertising?: string[]
  partnerships?: string[]
  launch_strategy?: string
}

export interface SeoStrategy {
  target_keywords?: string[]
  content_plan?: string[]
  technical_seo?: string[]
  estimated_organic_traffic_monthly?: number
}

export interface Competitor {
  name: string
  url?: string
  weakness?: string
  our_advantage?: string
}

export type SaasIdea = Database['public']['Tables']['saas_ideas']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type UserSkill = Database['public']['Tables']['user_skills']['Row']
