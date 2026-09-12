// ==============================================================================
// JUBILANT METAL AND ALLOYS - SUPABASE CLIENT INTEGRATION
// ==============================================================================

/**
 * Optional live Supabase backend connection.
 * To enable direct Supabase cloud sync:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Execute the migration script in `supabase/schema.sql` in the Supabase SQL editor.
 * 3. Create a `.env` file with:
 *    VITE_SUPABASE_URL=https://your-project.supabase.co
 *    VITE_SUPABASE_ANON_KEY=your-anon-key
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabaseConfig = {
  url: SUPABASE_URL,
  configured: isSupabaseConfigured,
};
