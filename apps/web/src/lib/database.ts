import { supabase } from './supabase'
import type { Child, Activity, SavedPlan } from './supabase'

// Children operations
export async function getChildren(userId: string) {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  
  // Map database columns to TypeScript interface
  return (data || []).map(child => ({
    ...child,
    curriculumTypes: child.curriculum_types || []
  })) as Child[]
}

export async function createChild(child: Omit<Child, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('children')
    .insert([child])
    .select()
    .single()
  
  if (error) throw error
  return data as Child
}

export async function updateChild(id: string, updates: Partial<Child>) {
  // Convert camelCase to snake_case for database columns
  const dbUpdates: any = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.age !== undefined) dbUpdates.age = updates.age
  if (updates.grade !== undefined) dbUpdates.grade = updates.grade
  if (updates.goals !== undefined) dbUpdates.goals = updates.goals
  if (updates.curriculumTypes !== undefined) dbUpdates.curriculum_types = updates.curriculumTypes
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes
  if (updates.color !== undefined) dbUpdates.color = updates.color
  if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji
  
  const { data, error } = await supabase
    .from('children')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  
  // Map database columns to TypeScript interface
  return {
    ...data,
    curriculumTypes: data.curriculum_types || []
  } as Child
}

export async function deleteChild(id: string) {
  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Activities operations
export async function getActivities(userId: string) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('day', { ascending: true })
    .order('start_time', { ascending: true })
  
  if (error) throw error
  return data as Activity[]
}

export async function createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('activities')
    .insert([activity])
    .select()
    .single()
  
  if (error) throw error
  return data as Activity
}

export async function updateActivity(id: string, updates: Partial<Activity>) {
  const { data, error } = await supabase
    .from('activities')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Activity
}

export async function deleteActivity(id: string) {
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function deleteAllActivities(userId: string) {
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('user_id', userId)
  
  if (error) throw error
}

// Saved plans operations
export async function getSavedPlans(userId: string) {
  const { data, error } = await supabase
    .from('saved_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as SavedPlan[]
}

export async function createSavedPlan(plan: Omit<SavedPlan, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('saved_plans')
    .insert([plan])
    .select()
    .single()
  
  if (error) throw error
  return data as SavedPlan
}

export async function updateSavedPlan(id: string, updates: Partial<SavedPlan>) {
  const { data, error } = await supabase
    .from('saved_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as SavedPlan
}

export async function deleteSavedPlan(id: string) {
  const { error } = await supabase
    .from('saved_plans')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Profile operations
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, updates: { full_name?: string; email?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}