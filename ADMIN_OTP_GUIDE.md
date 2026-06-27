# Admin Guide - OTP Management System

## Overview

The new OTP management system gives admins complete control over student verification. Instead of automatic OTP generation, admins now:
1. Generate OTP codes manually
2. Distribute them outside the system (WhatsApp, SMS, etc.)
3. Track usage and history
4. Manage student access

---

## Admin Panel Features

### 1. Generate OTP Codes

**Location:** Admin Panel → OTP Management → Generate OTPs

**How to:**
1. Enter student phone number (10 digits)
2. Enter quantity of OTPs to generate (1-100)
3. Click "Generate"
4. System shows generated codes
5. Share codes with student via:
   - WhatsApp
   - SMS
   - In-person
   - Email

**Example:**
```
Phone: 9876543210
Quantity: 5

Generated:
- 123456
- 234567
- 345678
- 456789
- 567890
```

**Screenshot Flow:**
```
┌─────────────────────────────────┐
│ Generate OTP Codes              │
├─────────────────────────────────┤
│ Phone Number:  [9876543210   ]  │
│ Quantity:      [5            ]  │
│                                 │
│ [Generate OTP]                  │
├─────────────────────────────────┤
│ Generated 5 OTP(s):             │
│ ✓ 123456                        │
│ ✓ 234567                        │
│ ✓ 345678                        │
│ ✓ 456789                        │
│ ✓ 567890                        │
│                                 │
│ [Copy All] [Share] [Done]       │
└─────────────────────────────────┘
```

---

## Common Workflows

### Workflow 1: Add New Student

1. **Generate OTP**
   - Admin Panel → Generate OTPs
   - Enter phone: `9876543210`
   - Quantity: `1`
   - Generate

2. **Share with Student**
   - Send OTP code via WhatsApp
   - Message: "Your TestSeries access code: 123456"

3. **Student Verifies**
   - Student opens TestSeries app
   - Enters phone: `9876543210`
   - Enters OTP: `123456`
   - Creates account

---

## Best Practices

### ✅ DO
- Generate OTPs before students need them
- Keep a record of which batch gets which OTP range
- Check history regularly for audit trail
- Delete accidentally generated OTPs
- Monitor unused OTPs (might need follow-up)
- Use admin panel for all OTP management

### ❌ DON'T
- Don't share OTP codes in email (use WhatsApp/SMS)
- Don't reuse OTP codes across batches
- Don't forget to share codes (students need them!)
- Don't delete used OTPs (breaks audit trail)
- Don't expose OTP codes through public channels
- Don't share login credentials with students

See ADMIN_OTP_GUIDE.md in repo for full guide.