import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pvdqotuhuwzooysrmtrd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZHFvdHVodXd6b295c3JtdHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMzE2NTQsImV4cCI6MjA4MTcwNzY1NH0.jE7Qe7EW4ULF1YCPJA9paUGp9D8h0iXwf7Tt5N0l2_E'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)