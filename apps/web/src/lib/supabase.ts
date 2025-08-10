import { createClient } from '@supabase/supabase-js'

// These will be replaced with your actual Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  email: string
  full_name: string
  created_at: string
  updated_at: string
}

export interface Child {
  id: string
  user_id: string
  name: string
  age: string
  grade: string
  goals: string[]
  curriculumTypes: string[]  // Using camelCase for consistency with frontend
  notes: string
  color: string
  emoji: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  user_id: string
  child_id: string
  title: string
  subject: string
  description: string
  day: string
  start_time: string
  end_time: string
  materials?: string[]
  instructions?: string[]
  objectives?: string[]
  enhanced: boolean
  status?: 'pending' | 'completed' | 'skipped'
  completed_at?: string
  recurring?: boolean
  recurrence_rule?: 'weekly' | 'biweekly' | 'monthly'
  created_at: string
  updated_at: string
}

export interface SavedPlan {
  id: string
  user_id: string
  name: string
  activities: Activity[]
  created_at: string
  updated_at: string
}