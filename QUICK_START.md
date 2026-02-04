# 🚀 Quick Start - Backend Integration

## ⚡ TL;DR - What Changed?

Your app now has a **backend API** and uses **username-only authentication**. Here's what you need to know:

### 🔑 For Users (Login Changes)
**Before:** `ahmet@example.com` + password  
**After:** `ahmet_yilmaz` + password (just username!)

The system automatically converts `ahmet_yilmaz` to `ahmet_yilmaz@insaat.local` behind the scenes.

### 👨‍💼 For Admins (New Powers)

**Password Reset (Şifre Değiştir):**
1. Open User Management
2. Click the 🔑 key icon next to any user
3. Enter new password (min 6 chars)
4. Done! User can now log in with new password

**Disable User (Devre Dışı Bırak):**
1. Open User Management
2. Click the 🗑️ trash icon next to user
3. Confirm
4. User is immediately logged out and cannot log back in
5. Account appears dimmed with "Devre Dışı" badge

**Restore User (Aktif Et):**
1. Find disabled user (dimmed, shows "Devre Dışı")
2. Click the ✓ check icon
3. User can now log in again

---

## 📦 Deployment in 3 Steps

### 1️⃣ Get Firebase Service Account Key

```bash
# Firebase Console → Project Settings → Service Accounts
# → Generate New Private Key → Download JSON
```

### 2️⃣ Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add service account key (paste the JSON as single line)
vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production

# Add CORS origin
vercel env add ALLOWED_ORIGIN production
# Enter: https://your-domain.vercel.app

# Redeploy
vercel --prod
```

### 3️⃣ Update Environment Variables

Create `.env` file:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# For production
VITE_API_BASE_URL=https://your-domain.vercel.app/api
```

Done! Your app is now live with backend functionality.

---

## 🧪 Quick Test Checklist

After deployment, test these features:

- [ ] **Login with username only** (no email field)
- [ ] **Create new user** (email auto-generated as `username@insaat.local`)
- [ ] **Reset someone's password** (admin only)
- [ ] **Disable a user** → Try logging in as that user (should fail)
- [ ] **Restore disabled user** → Login should work again
- [ ] **Profile settings** → Email change tab should be gone

---

## 🆘 Common Issues

**Problem:** "Missing or invalid authorization header"  
**Solution:** Make sure you're logged in as admin

**Problem:** CORS error in browser console  
**Solution:** Update `ALLOWED_ORIGIN` in Vercel environment variables

**Problem:** "Firebase ID token has expired"  
**Solution:** Refresh the page to get a new token

**Problem:** Can't log in after disabling user  
**Solution:** This is expected! Have an admin restore the user

---

## 📁 File Structure (What's New)

```
KeepClone/
├── api/                              # ← NEW: Backend API
│   └── admin-actions.js              # ← Admin operations (reset password, delete user)
├── src/
│   ├── services/                     # ← NEW: API services
│   │   └── adminApi.ts               # ← Frontend → Backend communication
│   ├── contexts/
│   │   └── AuthContext.tsx           # ← UPDATED: Username-only auth
│   ├── components/
│   │   ├── Login.tsx                 # ← UPDATED: Single username field
│   │   ├── UserManagement.tsx        # ← UPDATED: Password reset, delete, restore
│   │   ├── AddUserModal.tsx          # ← UPDATED: Auto email generation
│   │   └── ProfileSettings.tsx       # ← UPDATED: Email tab removed
│   └── types/
│       └── index.ts                  # ← UPDATED: Added isActive field
├── vercel.json                       # ← NEW: Vercel configuration
├── .env.example                      # ← UPDATED: Backend env vars
├── DEPLOYMENT_GUIDE.md               # ← NEW: Full deployment instructions
├── CHANGELOG.md                      # ← NEW: Version history
└── QUICK_START.md                    # ← You are here!
```

---

## 🎯 Key Concepts

### Username-Only Authentication
- Users only need to remember their **username** (not email)
- System uses `@insaat.local` as a virtual domain
- Simplifies login process and reduces errors

### Backend API (`/api/admin-actions`)
- Runs on Vercel serverless functions
- Uses Firebase Admin SDK (more powerful than client SDK)
- Only accessible by admins (verified with ID tokens)

### Soft Delete
- Users aren't permanently deleted
- `isActive: false` in Firestore + `disabled: true` in Firebase Auth
- Can be restored by admin at any time

### Admin Verification
Every backend request:
1. Checks if user is authenticated (valid ID token)
2. Checks if user has `role: 'admin'` in Firestore
3. Only then allows the privileged operation

---

## 🔗 Next Steps

1. ✅ Deploy to Vercel (see step 2 above)
2. 📖 Read full [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for details
3. 🔒 Review [Security Best Practices](./DEPLOYMENT_GUIDE.md#-security-best-practices)
4. 📊 Set up [monitoring](./DEPLOYMENT_GUIDE.md#-monitoring)
5. 🚶 Plan [migration](./DEPLOYMENT_GUIDE.md#-migration-guide) for existing users (if any)

---

## 💡 Pro Tips

- **Store service account key securely** - Never commit to Git!
- **Use Vercel environment variables** - Different keys for dev/prod
- **Test locally first** with `vercel dev`
- **Monitor Vercel function logs** for backend errors
- **Communicate new passwords securely** when resetting for users

---

**Need more details?** Check the full [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Questions?** Review the [troubleshooting section](./DEPLOYMENT_GUIDE.md#-troubleshooting)

---

**Version:** 2.0.0 | **Last Updated:** February 4, 2026
