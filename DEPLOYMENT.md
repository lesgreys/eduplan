# Deployment Guide

## Prerequisites
- Vercel account (https://vercel.com)
- Supabase project with database set up
- Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Push Code to Git Repository
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel

# Follow the prompts to link your project
```

#### Option B: Using Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure project:
   - Framework Preset: Vite
   - Root Directory: `./` (keep as is)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `apps/web/dist` (auto-detected)

### 3. Configure Environment Variables in Vercel

Add these environment variables in Vercel Dashboard (Settings → Environment Variables):

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Redeploy After Adding Environment Variables

After adding environment variables, trigger a redeployment:
- In Vercel Dashboard: Go to Deployments → Click "..." on latest → Redeploy

## Post-Deployment Checklist

- [ ] Verify authentication works (magic link email)
- [ ] Test user registration and onboarding flow
- [ ] Create and save a calendar plan
- [ ] Test drag-and-drop functionality
- [ ] Verify Settings page loads user data correctly
- [ ] Test on mobile devices

## Custom Domain (Optional)

To add a custom domain:
1. Go to Settings → Domains in Vercel Dashboard
2. Add your domain
3. Follow DNS configuration instructions

## Troubleshooting

### Environment Variables Not Working
- Ensure variables start with `VITE_` prefix
- Redeploy after adding/changing variables
- Check browser console for errors

### Build Failures
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in package.json
- Verify Node version compatibility

### Database Connection Issues
- Verify Supabase URL and anon key are correct
- Check Supabase project is not paused
- Ensure RLS policies are properly configured