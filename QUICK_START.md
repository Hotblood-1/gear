# Quick Start - Deploy TestSeries to Vercel

## 30-Second Overview

TestSeries is now production-ready with:
- ✅ Razorpay signature verification (configurable)
- ✅ CORS protection (configurable)
- ✅ Secure OTP system (admin-managed)
- ✅ JWT 1-day expiration
- ✅ Logout with token revocation

All configuration through **environment variables only** - no code changes needed.

---

## Quick Deployment (5 Steps)

### Step 1: Push to GitHub
```bash
cd /home/claude/gear
git add .
git commit -m "Security: Razorpay verify, CORS config, OTP redesign, JWT 1-day, logout support"
git push origin main
```

### Step 2: Create Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. "Add New" → "Project"
3. Select your GitHub repo
4. Click "Deploy"

### Step 3: Add Environment Variables
In Vercel Project Settings → Environment Variables, add:

```
MONGO_URL              = your-mongodb-connection-string
DB_NAME                = testseries
JWT_SECRET             = (generate strong random key)
ADMIN_EMAIL            = admin@yourdomain.com
ADMIN_PASSWORD         = strong-password
ALLOWED_ORIGIN         = https://yourdomain.com
EXPOSE_OTP             = false
RAZORPAY_KEY_ID        = (leave empty for now)
RAZORPAY_KEY_SECRET    = (leave empty for now)
```

### Step 4: Deploy
Click "Deploy" in Vercel. Takes 2-3 minutes.

### Step 5: Test
```bash
curl https://your-vercel-app.vercel.app/api/
# Should return: {"app": "TestSeries", "status": "ok"}
```

---

## New Features

### Admin OTP Management
**Endpoint:** `POST /api/admin/otps/generate`
```json
{
  "phone": "9876543210",
  "quantity": 5
}
```

### Logout with Token Revocation
**Endpoint:** `POST /api/auth/logout`
- Immediately revokes token
- User cannot use token again

---

## Documentation

📖 **Read These Files:**
1. `DEPLOYMENT.md` - Detailed deployment guide
2. `SECURITY_IMPROVEMENTS.md` - Security changes explained
3. `ADMIN_OTP_GUIDE.md` - How to manage OTPs
4. `backend/.env.example` - All environment variables