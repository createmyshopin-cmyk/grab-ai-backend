import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseAnonKey;

if (!isConfigured) {
    console.warn('⚠️ Supabase credentials missing! Persistence will be disabled.');
    console.warn('Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
}

// Export a real client if configured, otherwise a safe mock to prevent runtime crashes
export const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
            upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
            insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
            update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
            delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
            // Add other methods if needed
        }),
        auth: {
            getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not configured' } }),
        }
    } as any;
