# TestSeries - Deployment & Security Guide

## Overview

This guide covers deploying TestSeries to Vercel with all security fixes implemented. The application is production-ready with environment variable configuration for all critical security components.

## Quick Summary of Security Fixes

### 1. ✅ Razorpay Payment Verification (Environment Variables)
- **Signature Verification**: All Razorpay payments are verified using `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- **Safe Defaults**: Application works without keys in development
- **Server-Side Validation**: Payment amounts are re-calculated server-side

### 2. ✅ CORS Protection (Environment Variables)
- **Configurable Origin**: Set via `ALLOWED_ORIGIN` environment variable
- **No Hardcoded Domains**: Fully configurable for any domain
- **Strict Headers**: Only POST, GET, PUT, PATCH, DELETE allowed

### 3. ✅ OTP Security Enhancements
- **No Auto-Exposure**: `EXPOSE_OTP=false` by default
- **Admin-Controlled OTPs**: Admin generates OTPs manually in admin panel
- **Usage Tracking**: Each OTP logs phone, time, and status
- **Single Use Only**: OTPs become "used" after successful verification
- **Reuse Prevention**: Used OTPs cannot be reused

### 4. ✅ JWT Token Security
- **Expiration**: Reduced from 30 days to **1 day**
- **Token Revocation**: Logout revokes tokens immediately
- **Secure Headers**: X-Content-Type-Options, X-Frame-Options configured

### 5. ✅ Logout & Token Revocation
- **POST /api/auth/logout**: Revokes the current token
- **Revoked Tokens DB**: Checked on every authenticated request
- **Secure Session Management**: Prevents token replay attacks

---

## Environment Variables

### Required (All Environments)
```
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/
DB_NAME=testseries
JWT_SECRET=your-strong-random-secret
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=strong-password
```

### Development (Local)
```
ALLOWED_ORIGIN=http://localhost:3000
EXPOSE_OTP=true          # For debugging during development
RAZORPAY_KEY_ID=         # Leave empty in development
RAZORPAY_KEY_SECRET=     # Leave empty in development
```

### Production (Vercel)
```
ALLOWED_ORIGIN=https://yourdomain.com
EXPOSE_OTP=false         # Never expose OTPs in production
RAZORPAY_KEY_ID=rzp_live_xxxxx        # From Razorpay Dashboard
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx     # From Razorpay Dashboard
```

---

## Deployment Steps

### Step 1: Prepare Your Repository
```bash
cd /home/claude/gear
```

Ensure `.env` is in `.gitignore`:
```bash
echo ".env" >> backend/.gitignore
echo ".env.local" >> backend/.gitignore
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Security fixes: Razorpay verification, CORS config, OTP system overhaul"
git push origin main
```

### Step 3: Create Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Select your GitHub repository
4. Framework: "Other"
5. Root Directory: `.`

### Step 4: Configure Environment Variables in Vercel
1. Go to Project Settings → Environment Variables
2. Add all **Required** variables
3. Add **Production** variables
4. Make sure variables are added to "Production" environment

```
MONGO_URL = mongodb+srv://...
DB_NAME = testseries
JWT_SECRET = (generate new strong secret)
ADMIN_EMAIL = admin@yourcompany.com
ADMIN_PASSWORD = (your admin password)
ALLOWED_ORIGIN = https://yourdomain.com
EXPOSE_OTP = false
RAZORPAY_KEY_ID = (leave empty initially)
RAZORPAY_KEY_SECRET = (leave empty initially)
```

### Step 5: Configure Backend for Vercel

Create `backend/vercel.json`:
```json
{
  "buildCommand": "pip install -r requirements.txt",
  "serverless": {
    "backend/server.py": "api"
  }
}
```

### Step 6: Update Frontend API URL

In your frontend, update the API base URL for production:
```javascript
// frontend/src/lib/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// In .env.production:
REACT_APP_API_URL=https://your-vercel-backend.vercel.app/api
```

### Step 7: Test Deployment

1. Push changes to GitHub
2. Vercel automatically deploys
3. Test all endpoints

---

## Razorpay Integration (Production Only)

### Setup Razorpay Account

1. Sign up at [razorpay.com](https://razorpay.com)
2. Complete KYC verification
3. Go to Settings → API Keys
4. Get your Key ID and Key Secret

### Add to Vercel

1. Go to Vercel Project Settings → Environment Variables
2. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
3. Deploy

### Testing

1. Use Razorpay's test keys first
2. Test with test cards
3. Move to production keys after testing

---

## Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Change `ADMIN_PASSWORD` to a strong value
- [ ] Set `ALLOWED_ORIGIN` to your production domain
- [ ] Set `EXPOSE_OTP=false` in production
- [ ] Use strong MongoDB password
- [ ] Enable MongoDB IP whitelist
- [ ] Razorpay keys added only in production (not in code)
- [ ] HTTPS enabled on frontend
- [ ] Tokens are sent only with `Authorization: Bearer` header
- [ ] Logout revokes tokens immediately

---

## Support

For security issues, contact your team immediately. Do not commit secrets to GitHub.