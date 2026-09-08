# REALYZE!! — GitHub Pages + Supabase

## 1. Supabase
1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase_schema.sql`.
3. In **Authentication → Providers / Email**, disable email confirmation if you want the existing REALYZE username+password screen to log users in immediately. The game uses a private synthetic email derived from ID Name because Supabase password auth uses email/phone credentials.
4. Copy the project URL and Publishable key into `supabase-config.js`.

Example:
```js
window.REALYZE_SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
window.REALYZE_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_...";
```

Use only the publishable key in the browser. Never put a secret/service_role key in GitHub Pages.

## 2. GitHub Pages
Upload the project files to your repository. `index.html` loads Supabase JS from the jsDelivr CDN and then `supabase-config.js` / `supabase-client.js`.

GitHub Pages serves the frontend; Supabase provides Auth + Postgres database/API. No Node.js server is needed.

## 3. Existing REALYZE account screen
The UI stays ID Name + Password. A username is mapped to a private synthetic email such as:
`playername@accounts.realyze.local`

Do not change the mapping unless you also change the login/register code.

## 4. What is online
- Account registration/login
- Game data sync
- ID Name search
- Friend requests
- Accept/decline/cancel
- Friends list
- Friend chat history

Friend/account data is no longer shared through localStorage. localStorage is only used for the Supabase session/cache.

## 5. Security
The SQL enables Row Level Security and uses database functions for friend actions. Keep the publishable key only on the frontend; never expose Supabase secret/service_role keys.
