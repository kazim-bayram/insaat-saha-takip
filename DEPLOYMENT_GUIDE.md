# 🚀 Deployment Guide - Backend Integration & Username-Only Auth

This guide covers the major architectural upgrade that adds backend functionality, username-only authentication, and admin-managed user security.

## 📋 Table of Contents

- [Overview](#overview)
- [What's New](#whats-new)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Configuration](#frontend-configuration)
- [Deployment to Vercel](#deployment-to-vercel)
- [Testing](#testing)
- [Migration Guide](#migration-guide)

---

## 🎯 Overview

This upgrade transitions your application from a standard Firebase authentication system to a **username-only system** with **backend-managed security** using Vercel Serverless Functions and Firebase Admin SDK.

### Architecture Changes

**Before:**
- Email + username authentication
- Client-side user management
- Email-based password resets
- No soft delete capability

**After:**
- Username-only authentication (`@insaat.local` domain)
- Backend API for privileged operations
- Admin-controlled password resets
- Soft delete (disable user accounts)
- Enhanced security with Firebase Admin SDK

---

## 🆕 What's New

### 1. **Username-Only Authentication**
- Users now log in with **username only** (no email required)
- System automatically appends `@insaat.local` domain
- Example: `ahmet_yilmaz` → `ahmet_yilmaz@insaat.local`

### 2. **Backend API (`/api/admin-actions`)**
Three new admin actions:
- **resetPassword**: Force update any user's password
- **deleteUser**: Soft delete (disable Firebase Auth + mark `isActive: false`)
- **restoreUser**: Restore a disabled user

### 3. **Enhanced Admin Panel**
- **"Şifre Değiştir"** button: Opens modal to set new password for any user
- **"Devre Dışı Bırak"** button: Soft delete user (they can't log in)
- **"Aktif Et"** button: Restore disabled users
- Visual indicators for disabled accounts (dimmed, badge)

### 4. **Security Enhancements**
- `isActive` field in user profiles (default: `true`)
- Automatic sign-out if user becomes inactive during session
- Login rejection for disabled accounts
- Admin verification for all backend operations

### 5. **Simplified User Profile**
- Email change section removed (username is the primary identifier)
- Only username, display name, and password can be updated

---

## ✅ Prerequisites

Before deploying, ensure you have:

1. **Firebase Project** with:
   - Firestore Database enabled
   - Firebase Authentication enabled (Email/Password provider)
   - Service Account credentials (for Admin SDK)

2. **Vercel Account** (free tier works)

3. **Node.js** 18+ installed locally

4. **Firebase Admin Service Account Key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely

---

## 🔧 Backend Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install `firebase-admin` (now in production dependencies).

### Step 2: Update Firestore Security Rules

**IMPORTANT:** Deploy the updated Firestore rules to allow admins to create user profiles.

1. Go to Firebase Console → Firestore Database → Rules
2. The `firestore.rules` file in your project has been updated
3. Deploy the rules:

```bash
# If you have Firebase CLI installed:
firebase deploy --only firestore:rules

# Or manually copy the rules from firestore.rules and paste in Firebase Console
```

**Key Change:** Added `|| isAdmin()` to the create rule:
```javascript
allow create: if isOwner(userId) || isAdmin();
```

This allows admins to create user profiles for other users (required for the Add User feature).

### Step 3: Configure Environment Variables

Create a `.env` file (use `.env.example` as template):

```env
# Frontend - Firebase Client SDK
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend API Base URL (for production)
VITE_API_BASE_URL=https://your-domain.vercel.app/api

# CORS Origin (update in vercel.json too)
ALLOWED_ORIGIN=https://your-domain.vercel.app
```

### Step 4: Prepare Service Account Key

Convert your Firebase service account JSON to a **single-line string**:

```bash
# On macOS/Linux:
cat service-account-key.json | jq -c '.'

# On Windows (PowerShell):
Get-Content service-account-key.json | ConvertFrom-Json | ConvertTo-Json -Compress
```

Copy the output - you'll need it for Vercel environment variables.

---

## 🎨 Frontend Configuration

### Step 5: Verify Vercel Configuration

The `vercel.json` file is already configured with proper routing:

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
    "ALLOWED_ORIGIN": "https://your-actual-domain.vercel.app"
  }
}
```

**Important:** Update `ALLOWED_ORIGIN` to match your actual Vercel domain before deploying.

### Step 6: Update API Base URL

For **local development**, the API defaults to `/api` (proxied by Vite).

For **production**, update `.env`:

```env
VITE_API_BASE_URL=https://your-production-domain.vercel.app/api
```

---

## ☁️ Deployment to Vercel

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set Environment Variables:**
   ```bash
   # Production environment
   vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production
   # Paste the single-line JSON string when prompted

   vercel env add ALLOWED_ORIGIN production
   # Enter: https://your-domain.vercel.app
   ```

5. **Redeploy with env vars:**
   ```bash
   vercel --prod
   ```

### Method 2: Vercel Dashboard

1. **Import Project:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository

2. **Configure Build Settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`
   - **CRITICAL:** Add `FIREBASE_SERVICE_ACCOUNT_KEY` as a single-line JSON string

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

---

## 🧪 Testing

### Test Backend API Locally

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Link Project:**
   ```bash
   vercel link
   ```

3. **Pull Environment Variables:**
   ```bash
   vercel env pull .env.local
   ```

4. **Run Development Server:**
   ```bash
   vercel dev
   ```

5. **Test API Endpoint:**
   ```bash
   # Get admin token (after logging in as admin)
   # Then test password reset:
   curl -X POST http://localhost:3000/api/admin-actions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_ID_TOKEN" \
     -d '{"action":"resetPassword","uid":"USER_UID","newPassword":"newpass123"}'
   ```

### Test Frontend Features

1. **Username Login:**
   - Try logging in with just a username (no email)
   - System should automatically append `@insaat.local`

2. **Admin Panel:**
   - Open User Management (Kullanıcı Yönetimi)
   - Test password reset modal
   - Test soft delete (Devre Dışı Bırak)
   - Test restore (Aktif Et)

3. **Disabled Account:**
   - Disable a test user
   - Try logging in with that user → should see error
   - Restore the user → login should work again

---

## 🔄 Migration Guide

### For Existing Users

If you have existing users with real email addresses (not `@insaat.local`):

#### Option 1: Gradual Migration (Recommended)

Keep both systems working:

1. Update `AuthContext.tsx` login function to check both:
   ```typescript
   // Try username@insaat.local first
   let email = `${username.toLowerCase()}@insaat.local`;
   try {
     await signInWithEmailAndPassword(auth, email, password);
   } catch (err) {
     // Fallback to checking Firestore for real email
     const foundEmail = await getEmailByUsername(username);
     if (foundEmail) {
       email = foundEmail;
       await signInWithEmailAndPassword(auth, email, password);
     }
   }
   ```

2. Inform users to:
   - Log in with their username (system will find their real email)
   - Update their credentials if needed

#### Option 2: Force Migration

Use Firebase Admin SDK to update all user emails:

```javascript
// migration-script.js
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function migrateUsers() {
  const usersSnapshot = await db.collection('users').get();
  
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const newEmail = `${userData.username}@insaat.local`;
    
    try {
      await auth.updateUser(doc.id, { email: newEmail });
      await db.collection('users').doc(doc.id).update({ email: newEmail });
      console.log(`✅ Migrated: ${userData.username}`);
    } catch (err) {
      console.error(`❌ Failed: ${userData.username}`, err.message);
    }
  }
}

migrateUsers().then(() => console.log('✨ Migration complete'));
```

Run with: `node migration-script.js`

### For New Installations

No migration needed! Just deploy and start using username-only authentication from day one.

---

## 🔒 Security Best Practices

1. **Service Account Key:**
   - Never commit the service account JSON to Git
   - Store it only in Vercel environment variables
   - Rotate keys periodically in Firebase Console

2. **CORS Configuration:**
   - Set `ALLOWED_ORIGIN` to your specific domain (not `*`)
   - Update when changing domains

3. **Admin Verification:**
   - Backend API verifies ID token + admin role for every request
   - Non-admins cannot access privileged operations

4. **Password Security:**
   - Minimum 6 characters enforced
   - Admins should communicate new passwords securely (consider password managers)

5. **Audit Logging:**
   - Consider adding logging to track admin actions:
     ```javascript
     await db.collection('audit_logs').add({
       action: 'password_reset',
       adminId: adminUid,
       targetUserId: uid,
       timestamp: admin.firestore.FieldValue.serverTimestamp()
     });
     ```

---

## 📊 Monitoring

### Vercel Function Logs

Monitor your backend API:

1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `api/admin-actions.js`
3. View real-time logs and errors

### Firebase Console

Track authentication events:

1. Firebase Console → Authentication → Users
2. Check "Disabled" status for soft-deleted users

---

## 🐛 Troubleshooting

### "Profile save failed" when adding user
- **Cause:** Firestore security rules not allowing admin to create user profiles
- **Fix:** Deploy updated `firestore.rules` with `allow create: if isOwner(userId) || isAdmin();`
- **Deploy:** `firebase deploy --only firestore:rules` or update manually in Firebase Console

### "Missing or invalid authorization header"
- **Cause:** Frontend not sending ID token
- **Fix:** Check that admin is logged in and token is being fetched in `adminApi.ts`

### "User profile not found" or "Unauthorized"
- **Cause:** Current user is not an admin
- **Fix:** Verify `role: 'admin'` in Firestore `users/{uid}` document

### "Failed to reset password: Firebase ID token has expired"
- **Cause:** Admin session expired
- **Fix:** Refresh page to get new ID token, or implement token refresh logic

### CORS Errors
- **Cause:** `ALLOWED_ORIGIN` mismatch
- **Fix:** Update `vercel.json` and redeploy

### "auth/email-already-in-use" when creating user
- **Cause:** Username already exists
- **Fix:** Choose a different username (system checks before creating)

### "Permission denied" on Firestore operations
- **Cause:** Security rules too restrictive or auth context incorrect
- **Fix:** Review `firestore.rules` and ensure rules match your use case. For admin operations, make sure `isAdmin()` is included in the rule.

---

## 📚 API Reference

### POST `/api/admin-actions`

**Authentication:** Bearer token (Admin ID token)

**Request Body:**
```json
{
  "action": "resetPassword" | "deleteUser" | "restoreUser",
  "uid": "user-firebase-uid",
  "newPassword": "string" // Only for resetPassword
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Operation completed successfully"
}
```

**Response (Error):**
```json
{
  "error": "Error message description"
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad request (missing parameters)
- `403`: Unauthorized (not admin)
- `405`: Method not allowed
- `500`: Server error

---

## 🎉 Conclusion

You now have a fully integrated backend system with enhanced admin controls and username-only authentication!

### Key Takeaways:
- ✅ Username-only login with automatic `@insaat.local` domain
- ✅ Backend API for secure admin operations
- ✅ Admin can force password resets without email
- ✅ Soft delete users (they can be restored)
- ✅ Enhanced security with Firebase Admin SDK

### Next Steps:
1. Deploy to Vercel
2. Test all features in production
3. Migrate existing users (if any)
4. Set up monitoring and alerts
5. Document admin procedures for your team

**Need help?** Check the troubleshooting section or review the code comments in `api/admin-actions.js`.

---

**Last Updated:** February 4, 2026  
**Version:** 2.0.0
