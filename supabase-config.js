/* REALYZE!! Supabase configuration */

window.REALYZE_SUPABASE_URL =
  "https://kufpbfomibcxyrghknrv.supabase.co";

window.REALYZE_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_HiQ1258YmSzj9MZnNTlr-A_RiswJS-f";

/* Create the Supabase client */
(function () {
  if (!window.supabase) {
    console.error("Supabase JS library chưa được load.");
    return;
  }

  if (
    !window.REALYZE_SUPABASE_URL ||
    !window.REALYZE_SUPABASE_PUBLISHABLE_KEY
  ) {
    console.error("Thiếu Supabase URL hoặc Publishable Key.");
    return;
  }

  try {
    window.REALYZE_DB = window.supabase.createClient(
      window.REALYZE_SUPABASE_URL,
      window.REALYZE_SUPABASE_PUBLISHABLE_KEY
    );

    console.log("REALYZE Supabase: READY");
  } catch (error) {
    console.error("REALYZE Supabase init failed:", error);
    window.REALYZE_DB = null;
  }
})();