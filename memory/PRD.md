# TestSeries — Product Requirements Document

## Original Problem Statement
Build a modern ecommerce website "TestSeries" for Indian students selling notebooks, LCD writing tablets, geometry boxes, water bottles, pens, study kits and stationery. White + blue theme, premium UI, responsive, with full storefront + admin panel + discount system.

## User Choices (Locked)
- Tech stack: **React + FastAPI + MongoDB** (selected over original Supabase request)
- Customer auth: **Phone OTP — MOCK** (OTP returned in API response; real SMS provider can be plugged in later)
- Admin auth: **Email + Password (JWT)**
- Payment: **COD + UPI (placeholder) + Razorpay (placeholder, to be wired later)**
- Product images: Stock images defaulted; user will upload custom images later via admin
- Admin creds: `AyzalKhan@testseries.com` / `AyzalKhan@2023`

## Architecture
- **Backend**: FastAPI, MongoDB, JWT (Bearer token), bcrypt for admin password, mock OTP via Mongo TTL collection
- **Frontend**: React + React Router + Tailwind + shadcn-style design, sonner toasts, lucide icons
- **State**: AuthContext + CartContext (localStorage-backed cart)

## Implemented (Feb 2026 — Iteration 1)
- Homepage hero, trust badges, category strip, popular products grid, promo band, footer
- Products listing with search + category filter
- Product detail with qty selector + add to cart
- Cart page (qty controls, remove, totals)
- Checkout (address form, payment method selector, discount code apply, COD+UPI+Razorpay-disabled)
- Order confirmation page
- Phone OTP login flow (mock — OTP shown in toast)
- Admin login
- Admin: Products (CRUD, hide/show, low-stock alert), Orders (status update), Discount Codes (create/copy/delete, one-time use tracking)
- Customer Account + Order History
- About / Privacy / Terms pages
- Responsive nav + mobile menu
- Auto-seed: 10 products from problem spec + admin user
- Free shipping over ₹499 (else ₹49)
- 24/24 backend tests passing

## Backlog (P0/P1/P2)
- **P0**: Razorpay integration when keys are provided (Stripe-like flow); replace mock OTP with real SMS provider (MSG91/Fast2SMS/Twilio) when chosen
- **P1**: Image upload from admin (currently URL-only); product reviews/ratings; address book on account page
- **P1**: Forgot password flow for admin (token in console)
- **P2**: Wishlist, product recommendations, sales analytics dashboard, coupon usage report
- **P2**: Multi-image gallery on product detail, related products carousel

## Next Tasks
1. User to upload product photos via admin → ready (image_url field editable)
2. When Razorpay keys are shared: enable razorpay button, integrate order/payment endpoints
3. When SMS provider chosen: replace mock in `/api/auth/customer/request-otp` with real send
