# Fix Supabase Magic Link Redirect

## The Problem
Your magic link is redirecting to a malformed URL that combines Supabase and Vercel domains.

## Solution: Update Supabase Settings

### 1. Go to Supabase Dashboard
- Visit https://supabase.com/dashboard
- Select your project (nfeozvwfidcvhhmcqauw)

### 2. Update Authentication Settings
Navigate to: **Authentication → URL Configuration**

### 3. Update Site URL
Set the **Site URL** to your production URL:
```
https://homeschool-plannner-mvp.vercel.app
```

### 4. Update Redirect URLs
In the **Redirect URLs** section, add these URLs (one per line):
```
https://homeschool-plannner-mvp.vercel.app/**
https://homeschool-plannner-mvp.vercel.app/dashboard
http://localhost:5173/**
http://localhost:5173/dashboard
```

### 5. Update Email Templates (Optional but Recommended)
Go to: **Authentication → Email Templates → Magic Link**

Make sure the template uses the correct variable:
```
{{ .ConfirmationURL }}
```

The email template should look something like:
```html
<h2>Magic Link</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
```

### 6. Save Changes
Click "Save" on all modified settings.

## Alternative: Update Code for Custom Domain Handling

If the above doesn't work, we can also update the code to be more explicit:

```typescript
// In AuthContext.tsx
const signInWithMagicLink = async (email: string) => {
  // Determine the correct redirect URL based on environment
  const redirectTo = process.env.NODE_ENV === 'production' 
    ? 'https://homeschool-plannner-mvp.vercel.app/dashboard'
    : 'http://localhost:5173/dashboard';
    
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    }
  })
  return { data, error }
}
```

## Testing
1. After updating Supabase settings, wait 1-2 minutes for changes to propagate
2. Try requesting a new magic link
3. The link should now redirect to: `https://homeschool-plannner-mvp.vercel.app/dashboard#access_token=...`

## Important Notes
- The redirect URL must be in your Supabase allowed list
- The Site URL in Supabase should match your production domain
- Local development URLs should also be in the redirect URLs list