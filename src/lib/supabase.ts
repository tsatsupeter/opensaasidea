import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { safeStorage } from './safe-storage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// No-op lock: bypasses navigator.locks which deadlocks in some browsers,
// causing the entire app to hang until localStorage is cleared.
const noopLock = async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
  return await fn()
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    storage: safeStorage,
    lock: noopLock,
  } as any,
})

// Safe columns for list/card views — excludes Pro-only detailed fields
// so they never appear in Network tab responses
export const SAFE_IDEA_COLUMNS = 'id,title,tagline,description,slug,category,platform,monetization_model,estimated_mrr_low,estimated_mrr_high,estimated_monthly_sales,tech_stack,pros,cons,unique_differentiators,is_public,generated_for,views,upvotes,downvotes,vote_score,comment_count,created_at,updated_at,ai_model_used'
