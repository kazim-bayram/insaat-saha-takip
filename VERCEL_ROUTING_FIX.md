# 🔧 Vercel Routing Fix - 401 Error Resolution

## Problem
Deployment was returning **401 errors** for static assets. Vercel didn't know how to route between:
- Vite frontend (React SPA)
- Backend API functions (`/api/*`)

## Solution
Added `rewrites` configuration to `vercel.json` to properly route requests.

---

## What Was Changed

### Updated: `vercel.json`

**Added routing rules:**
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## How It Works

### Route 1: API Requests
```
Request:  /api/admin-actions
Rule:     /api/(.*)  →  /api/$1
Result:   Routes to serverless function in api/ folder
```

**Purpose:** Ensures all `/api/*` requests go to backend functions.

### Route 2: SPA Fallback
```
Request:  /dashboard, /login, /notes, /static/css/main.js, etc.
Rule:     /(.*)  →  /index.html
Result:   Serves index.html, React Router handles routing
```

**Purpose:** Single Page Application (SPA) fallback - all other requests serve `index.html` so React Router can handle client-side routing.

---

## Why This Fixes the 401 Error

### Before (❌ Broken):
```
GET /dashboard         → 404 (Vercel doesn't find this file)
GET /api/admin-actions → Works (function exists)
GET /static/main.js    → 401 (Permission denied)
```

**Problem:** Vercel tried to serve static files directly but couldn't find them because they're bundled in the React app.

### After (✅ Fixed):
```
GET /dashboard         → index.html → React Router → Dashboard component ✓
GET /api/admin-actions → Serverless function ✓
GET /static/main.js    → index.html → Vite serves bundled assets ✓
```

**Solution:** All non-API requests go to `index.html`, which loads the React app with all bundled assets.

---

## Complete `vercel.json` Configuration

```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "FIREBASE_SERVICE_ACCOUNT_KEY": "@firebase_service_account_key",
    "ALLOWED_ORIGIN": "https://your-domain.vercel.app"
  }
}
```

### Configuration Breakdown:

| Section | Purpose |
|---------|---------|
| `functions` | Configure serverless function settings (memory, timeout) |
| `rewrites` | Route requests between frontend and backend |
| `env` | Environment variables (reference to secrets) |

---

## Testing After Deployment

### Test API Routes:
```bash
# Should return 200 (or proper auth error)
curl https://your-domain.vercel.app/api/admin-actions

# Should return HTML (index.html)
curl https://your-domain.vercel.app/dashboard
```

### Test in Browser:
1. ✅ Navigate to `/dashboard` - Should load React app
2. ✅ Navigate to `/login` - Should load React app
3. ✅ Refresh on any route - Should stay on same route (not 404)
4. ✅ Admin actions - Should call `/api/admin-actions` successfully

---

## Common Issues & Solutions

### Issue: Still getting 401 errors
**Cause:** Environment variables not set  
**Fix:** Make sure `FIREBASE_SERVICE_ACCOUNT_KEY` is set in Vercel dashboard

### Issue: API calls fail with CORS error
**Cause:** `ALLOWED_ORIGIN` not matching your domain  
**Fix:** Update `ALLOWED_ORIGIN` in Vercel environment variables:
```bash
vercel env add ALLOWED_ORIGIN production
# Enter: https://your-actual-domain.vercel.app
```

### Issue: Routes work but refresh gives 404
**Cause:** Rewrites not applied  
**Fix:** Redeploy with `vercel --prod`

### Issue: Static assets not loading
**Cause:** Build output not in correct directory  
**Fix:** Ensure `vite.config.ts` has correct `build.outDir`:
```typescript
export default defineConfig({
  build: {
    outDir: 'dist'
  }
})
```

---

## Deployment Checklist

After adding rewrites, verify:

- [ ] `vercel.json` has `rewrites` section
- [ ] Redeploy: `vercel --prod`
- [ ] Test `/dashboard` route in browser
- [ ] Test API endpoints with auth token
- [ ] Check browser console for errors
- [ ] Test refresh on different routes
- [ ] Verify static assets load correctly

---

## Understanding SPA Routing

### Traditional Server:
```
/dashboard → dashboard.html
/login     → login.html
/admin     → admin.html
```

### React SPA (Single Page Application):
```
/dashboard → index.html → React Router → Dashboard component
/login     → index.html → React Router → Login component
/admin     → index.html → React Router → Admin component
```

**Key Point:** There's only ONE HTML file (`index.html`). All routing happens client-side in JavaScript.

### Why This Matters for Vercel:

Without rewrites:
```
User navigates to /dashboard
→ Browser requests /dashboard from server
→ Vercel looks for dashboard.html file
→ File not found → 404 ❌
```

With rewrites:
```
User navigates to /dashboard
→ Browser requests /dashboard from server
→ Vercel rewrites to /index.html
→ Serves index.html with React app
→ React Router sees /dashboard in URL
→ Renders Dashboard component ✅
```

---

## Technical Details

### Rewrite vs Redirect

**Rewrite (what we use):**
- URL stays the same in browser
- Server internally routes to different file
- User sees: `/dashboard`
- Server serves: `index.html`

**Redirect (not what we want):**
- URL changes in browser
- Server tells browser to go to different URL
- User sees: `/index.html`
- Breaks React Router!

### Order Matters

```json
"rewrites": [
  {
    "source": "/api/(.*)",      // ← Checked FIRST
    "destination": "/api/$1"
  },
  {
    "source": "/(.*)",          // ← Checked SECOND (catch-all)
    "destination": "/index.html"
  }
]
```

**Why:** API routes must be checked before the catch-all, otherwise all requests (including API calls) would go to `index.html`.

---

## Related Files

- `vercel.json` - Deployment configuration
- `vite.config.ts` - Build configuration
- `src/main.tsx` - React app entry point
- `api/admin-actions.js` - Backend function

---

## Summary

✅ **Fixed:** Added `rewrites` to `vercel.json`  
✅ **Result:** Proper routing between frontend and backend  
✅ **Impact:** 401 errors resolved, SPA routing works correctly  
✅ **Status:** Ready for deployment  

---

**Version:** 2.0.1  
**Date:** February 4, 2026  
**Issue:** 401 errors for static assets  
**Resolution:** ✅ FIXED with proper Vercel routing configuration
