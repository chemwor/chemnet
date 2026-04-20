import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cxbfuzqjlqipjyinhzqv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YmZ1enFqbHFpcGp5aW5oenF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTI3MjUsImV4cCI6MjA5MjIyODcyNX0.jq4FTM9sJU3HtCUsWyZyxegBg2XS1wgYjt2rYlAAdX0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
