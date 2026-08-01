/**
 * Supabase client factory. The real client (@supabase/supabase-js) is added
 * in Loop 001 when the schema lands — keeping the dependency out until it is
 * exercised end to end.
 */
export function supabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey)
    throw new Error(
      "Supabase env vars missing — copy .env.example to .env.local and fill them in",
    );
  return { url, anonKey };
}
