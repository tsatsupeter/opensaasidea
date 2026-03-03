import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Safe columns for list/card views — excludes Pro-only detailed fields
// so they never appear in Network tab responses
export const SAFE_IDEA_COLUMNS = 'id,title,tagline,description,slug,category,platform,monetization_model,estimated_mrr_low,estimated_mrr_high,estimated_monthly_sales,pricing_tiers,tech_stack,pros,cons,unique_differentiators,is_public,generated_for,views,upvotes,downvotes,vote_score,comment_count,created_at,updated_at,ai_model_used'
