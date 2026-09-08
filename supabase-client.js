/* REALYZE!! Supabase client bridge. Frontend-safe: use only the publishable key. */
(function () {
  const url = window.REALYZE_SUPABASE_URL;
  const key = window.REALYZE_SUPABASE_PUBLISHABLE_KEY;
  if (!window.supabase || !url || !key || url.includes('YOUR_SUPABASE_') || key.includes('YOUR_SUPABASE_')) {
    console.warn('REALYZE!! Supabase is not configured. Edit supabase-config.js first.');
    window.REALYZE_DB = null;
    return;
  }
  window.REALYZE_DB = window.supabase.createClient(url, key, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
})();
