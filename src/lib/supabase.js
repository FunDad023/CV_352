import { createClient } from '@supabase/supabase-js'

// Supabase anon keys are intended to be public in browser apps. Access is protected
// by the row-level security policies in supabase/schema.sql.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jxhgpnjmfijtkrzptavk.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aGdwbmptZmlqdGtyenB0YXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1OTk5MDAsImV4cCI6MjExMDE3NTkwMH0.UTqGAv4Au3M6mrXiU9h5ZnpzbfTyWMBUWjL4pjn-gAo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
})
