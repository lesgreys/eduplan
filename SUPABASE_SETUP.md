# 🚀 Supabase Setup Guide - Quick Launch

## Step 1: Supabase Dashboard Setup (10 minutes)

1. **Go to your Supabase project** at https://supabase.com/dashboard

2. **Run the SQL Schema**:
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"
   - Copy ALL contents from `/supabase/schema.sql`
   - Paste and click "Run"
   - You should see "Success. No rows returned"

3. **Get your credentials**:
   - Go to "Settings" → "API"
   - Copy these two values:
     - `Project URL` (looks like: https://xxxxx.supabase.co)
     - `anon public` key (long string)

4. **Create .env file** in `/apps/web/`:
   ```
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

5. **Enable Email Auth** (if not already):
   - Go to "Authentication" → "Providers"
   - Make sure "Email" is enabled

## Step 2: Update Frontend Components (20 minutes)

We need to update these files to use Supabase instead of mock data:
1. ✅ Login.tsx - Connect to Supabase auth
2. ✅ Signup.tsx - Create new users
3. ✅ Dashboard.tsx - Load real data
4. ✅ Settings.tsx - Update real children
5. ✅ App.tsx - Add auth protection

## Step 3: Deploy to Vercel (5 minutes)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## Quick Test Checklist

- [ ] User can sign up
- [ ] User can log in
- [ ] Children persist after refresh
- [ ] Activities save to database
- [ ] Plans can be saved/loaded

## That's it! 🎉

Your app will be live and ready for real users!