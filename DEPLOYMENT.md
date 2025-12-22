# Sahakar Accounts - Deployment Guide

## 🚀 Complete Application Ready for Deployment

**Status:** ✅ ALL 7 PHASES COMPLETE
**Build Date:** 2025-12-22
**Version:** 1.0.0

---

## 📦 What's Included

### Phase 1-2: Authentication & Basic Navigation ✅
- User authentication (Supabase Auth)
- Role-based access control (Superadmin, HO Accountant, Manager, Staff)
- Protected routes
- Dashboard layouts for all roles

### Phase 3: Transaction Management ✅
- Quick transaction entry form
- Income/Expense categorization  
- Cash/UPI payment modes
- Real-time balance calculation
- Transaction list view

### Phase 4: Daily Workflow ✅
- Draft → Submitted → Locked workflow
- Auto-opening balance from previous day
- Daily record management
- Status-based permissions

### Phase 5: Reports & Analytics ✅
- Monthly summary reports
- Category-wise analysis
- Income/expense breakdown
- Net profit calculation

### Phase 6: Google Sheets Integration ✅
- Auto-sync to Google Sheets
- Monthly sheet creation
- Transaction export
- Google Drive folder organization

### Phase 7: Admin Features ✅
- Outlet management
- User management
- Role assignment
- Access control

---

## 🛠️ Deployment Steps

### 1. Git Commit & Push

```bash
# Check status
git status

# Add all files
git add .

# Commit
git commit -m "feat: Complete Sahakar Accounts application - All 7 phases"

# Push to GitHub
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables (see below)
4. Deploy!

### 3. Environment Variables (Required)

Add these to Vercel:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pvdqotuhuwzooysrmtrd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google Sheets
GOOGLE_SHEETS_CLIENT_EMAIL=sahakar-sheets-sync@sahakar-accounts-production.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Key_Here\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1rVL2Vz_BGUvD8HCcNxOs1hBFZPEK_kwn

# App Config
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET=your_random_secret_here
NEXT_PUBLIC_DEV_MODE=false

# Optional
NODE_ENV=production
```

### 4. Database Setup

Run these SQL files in Supabase SQL Editor:

1. `database/schema.sql` - Create all tables
2. `database/fix-rls-aggressive.sql` - Set up RLS policies
3. Seed demo data (if needed)

### 5. Test Production

1. **Test Login:**
   - Email: `staff.test@sahakar.com`
   - Password: `Zabnix@2025`

2. **Test Features:**
   - Add transactions
   - Submit daily record
   - View reports
   - Sync to Google Sheets

---

## 📁 File Structure

```
sahakar-accounts/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── admin/page.tsx
│   │       ├── accountant/page.tsx
│   │       ├── manager/page.tsx
│   │       └── staff/page.tsx
│   └── api/
│       ├── transactions/
│       ├── categories/
│       ├── daily-records/
│       ├── reports/
│       ├── outlets/
│       └── users/
├── components/
│   ├── transaction-form.tsx
│   ├── transaction-list.tsx
│   ├── daily-record-actions.tsx
│   ├── monthly-report.tsx
│   ├── dashboard-card.tsx
│   └── protected-route.tsx
├── lib/
│   ├── auth-context.tsx
│   ├── supabase.ts
│   └── google-sheets.ts
├── database/
│   ├── schema.sql
│   └── fix-rls-aggressive.sql
└── .env.local
```

---

## 🔧 Development Mode

For local testing without Supabase:

```env
NEXT_PUBLIC_DEV_MODE=true
```

This will:
- Use mock authentication
- Skip Supabase API calls
- Enable immediate testing
- Work offline

**Remember to set `NEXT_PUBLIC_DEV_MODE=false` for production!**

---

## 📊 Features Overview

| Feature | Staff | Manager | Admin | Accountant |
|---------|-------|---------|-------|------------|
| Add Transactions | ✅ | ✅ | ✅ | ❌ |
| Submit Record | ✅ | ✅ | ✅ | ❌ |
| Lock Record | ❌ | ✅ | ✅ | ❌ |
| View Reports | ❌ | ✅ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ | ❌ |
| Manage Outlets | ❌ | ❌ | ✅ | ❌ |
| Google Sheets Sync | ❌ | ✅ | ✅ | ✅ |

---

## 🐛 Troubleshooting

### Issue: Infinite Loading
**Solution:** Set `NEXT_PUBLIC_DEV_MODE=true` for local dev

### Issue: Auth Timeout
**Solution:** Check Supabase URL and API keys

### Issue: Google Sheets Fails
**Solution:** Verify service account and private key

###Issue: RLS Errors
**Solution:** Run `database/fix-rls-aggressive.sql`

---

## 📝 Notes

- All passwords: `Zabnix@2025`
- Default organization ID: `00000000-0000-0000-0000-000000000001`
- Time zone: Asia/Kolkata (IST)
- Currency: INR (₹)

---

## ✅ Checklist

Before going live:

- [ ] Commit all code to Git
- [ ] Push to GitHub
- [ ] Import to Vercel
- [ ] Add environment variables
- [ ] Run database migrations
- [ ] Create RLS policies
- [ ] Test login
- [ ] Test transactions
- [ ] Test reports
- [ ] Test Google Sheets sync
- [ ] Set `NEXT_PUBLIC_DEV_MODE=false`
- [ ] Test production build

---

**Ready to deploy!** 🚀
