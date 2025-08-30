import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a mock client for build time if environment variables are not available
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for build time
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: () => Promise.resolve({ error: { message: 'Environment variables not configured' } }),
        signInWithPassword: () => Promise.resolve({ error: { message: 'Environment variables not configured' } }),
        signOut: () => Promise.resolve({ error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null })
      },
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: { message: 'Environment variables not configured' } }),
          getPublicUrl: () => ({ data: { publicUrl: '' } })
        })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null })
            }),
            single: () => Promise.resolve({ data: null, error: { message: 'Environment variables not configured' } })
          }),
          insert: () => Promise.resolve({ data: null, error: { message: 'Environment variables not configured' } }),
          delete: () => Promise.resolve({ error: null }),
          upsert: () => Promise.resolve({ error: null })
        })
      })
    } as any
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()

// Database types
export interface User {
  id: string
  email: string
  username: string
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  file_url: string
  title: string
  summary: string | null
  created_at: string
}

export interface Quiz {
  id: string
  document_id: string
  question: string
  options: string[]
  correct_answer: string
}

export interface Progress {
  id: string
  user_id: string
  document_id: string
  quiz_score: number | null
  time_spent: number
  last_accessed: string
}

export interface Flashcard {
  id: string
  document_id: string
  front: string
  back: string
}
