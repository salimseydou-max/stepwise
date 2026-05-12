# Supabase setup

## 1. Paste the SQL schema in Supabase

1. Open your Supabase project dashboard.
2. In the left sidebar, click **SQL Editor**.
3. Click **New query**.
4. Open `supabase/schema.sql` from this repo.
5. Copy the entire file contents and paste it into the SQL editor.
6. Click **Run**.

## 2. Local environment file

Create or update `.env.local` in the project root with:

```bash
VITE_SUPABASE_URL=https://pygboftphzagwyofwrak.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
VITE_OPENROUTER_API_KEY=your-openrouter-api-key
VITE_OPENROUTER_MODEL=openai/gpt-4o-mini
VITE_OPENROUTER_APP_NAME=StepWise
VITE_OPENROUTER_APP_URL=http://localhost:5173
```

## 3. Start the app

```bash
npm install
npm run dev
```

## Notes

- This implementation uses a client-generated profile UUID stored locally, then syncs data to Supabase.
- The SQL file includes permissive demo policies for anonymous access so the app works immediately with the anon key.
- For production, replace those policies with authenticated user policies.
