# Sahakar Accounts - Complete Setup Guide

**Critical Infrastructure Setup Checklist**

This guide walks through the essential setup steps before development begins. Complete these in order.

---

## 1️⃣ GOOGLE CLOUD PROJECT (CRITICAL)

### Why This Matters
- Required for Google Sheets API access
- Required for Google Drive folder management
- Provides stable, auditable access without OAuth popups
- No personal account rate limits

### Step-by-Step Setup

#### 1.1 Create Google Cloud Project

1. **Navigate to Google Cloud Console**
   - URL: https://console.cloud.google.com/
   - Sign in with Zabnix Google Workspace account (NOT personal)

2. **Create New Project**
   - Click "Select a project" dropdown (top bar)
   - Click "NEW PROJECT"
   - **Project Name**: `Sahakar Accounts Production`
   - **Organization**: Select Zabnix organization
   - **Location**: Zabnix (if available)
   - Click "CREATE"

3. **Note the Project ID**
   - Format: `sahakar-accounts-prod-xxxxxx`
   - Copy this - you'll need it later

#### 1.2 Enable Required APIs

1. **Navigate to APIs & Services**
   - Left sidebar → "APIs & Services" → "Library"
   - Or direct URL: https://console.cloud.google.com/apis/library

2. **Enable Google Drive API**
   - Search: "Google Drive API"
   - Click the card
   - Click "ENABLE"
   - Wait for confirmation

3. **Enable Google Sheets API**
   - Click "ENABLE APIS AND SERVICES" (top)
   - Search: "Google Sheets API"
   - Click the card
   - Click "ENABLE"
   - Wait for confirmation

#### 1.3 Create Service Account

1. **Navigate to Service Accounts**
   - Left sidebar → "IAM & Admin" → "Service Accounts"
   - Or: https://console.cloud.google.com/iam-admin/serviceaccounts

2. **Create Service Account**
   - Click "+ CREATE SERVICE ACCOUNT"
   - **Service account name**: `sahakar-sheets-sync`
   - **Service account ID**: Auto-generated (e.g., `sahakar-sheets-sync@xxx.iam.gserviceaccount.com`)
   - **Description**: `Service account for automated Google Sheets sync in Sahakar Accounts system`
   - Click "CREATE AND CONTINUE"

3. **Grant Permissions** (Optional, skip for now)
   - Click "CONTINUE" (we'll manage Drive permissions separately)

4. **Grant Users Access** (Optional, skip)
   - Click "DONE"

#### 1.4 Create and Download JSON Key

1. **Find Your Service Account**
   - You should see `sahakar-sheets-sync@xxx.iam.gserviceaccount.com` in the list

2. **Create Key**
   - Click on the service account email
   - Go to "KEYS" tab
   - Click "ADD KEY" → "Create new key"
   - Select "JSON" format
   - Click "CREATE"

3. **Download Completes Automatically**
   - File downloads as: `sahakar-accounts-prod-xxxxxx-xxxxxxxxxx.json`
   - **CRITICAL**: Move this file to a secure location IMMEDIATELY
   - **NEVER commit this to Git**
   - Suggested location: Password manager or secure vault

4. **Note the Service Account Email**
   - Copy the full email: `sahakar-sheets-sync@sahakar-accounts-prod-xxxxxx.iam.gserviceaccount.com`
   - You'll need this for Drive folder sharing

#### 1.5 Security Checklist

- ✅ JSON key file stored securely (NOT in project folder)
- ✅ Service account email copied
- ✅ Project ID noted
- ✅ Both APIs enabled (Drive + Sheets)

---

## 2️⃣ GOOGLE DRIVE FOLDER GOVERNANCE

### Why This Matters
- Prevents manual edits to Sheets (which would cause data inconsistency)
- Ensures proper access control
- Creates single source of truth

### Step-by-Step Setup

#### 2.1 Access Existing Drive Folder

1. **Open the Existing Folder**
   - URL: https://drive.google.com/drive/folders/1rVL2Vz_BGUvD8HCcNxOs1hBFZPEK_kwn
   - This is your current folder structure

2. **Verify Structure**
   - Should have store folders (MELATTUR, PERINTHALMANNA, etc.)
   - Each store may have year/month files

#### 2.2 Rename Root Folder

1. **Right-click the root folder**
   - Select "Rename"
   - New name: `Sahakar Accounts (READ ONLY - Auto-Synced)`
   - This makes it clear: NO MANUAL EDITS

#### 2.3 Share with Service Account

1. **Right-click the root folder**
   - Select "Share"
   - Click "Add people and groups"

2. **Add Service Account**
   - Paste the service account email: `sahakar-sheets-sync@xxx.iam.gserviceaccount.com`
   - Change permission to: **Editor**
   - **UNCHECK**: "Notify people"
   - Click "Share"

3. **Verify**
   - Service account should appear in "People with access"
   - Role: Editor

#### 2.4 Set Up Access for HO Accountant

1. **Share with HO Accountant**
   - Click "Share" again
   - Add HO Accountant's email (e.g., `ho-accountant@zabnix.com`)
   - Permission: **Viewer**
   - Check "Notify people" (they should know about this)
   - Click "Share"

#### 2.5 Add Warning in Folder Description

1. **Edit Folder Details**
   - Right-click folder → "View details"
   - Add description:
   ```
   ⚠️ READ-ONLY FOLDER ⚠️
   
   This folder contains auto-synced financial data from Sahakar Accounts web application.
   
   DO NOT EDIT MANUALLY - All changes will be overwritten.
   
   Data is synced every 15 minutes from the web app.
   
   For support: support@zabnix.com
   ```

#### 2.6 Folder Structure Best Practices

**Recommended Structure**:
```
Sahakar Accounts (READ ONLY - Auto-Synced)/
├── PRODUCTION/
│   ├── MELATTUR/
│   │   ├── 2024/
│   │   │   ├── November.xlsx
│   │   │   └── December.xlsx
│   │   └── 2025/
│   └── PERINTHALMANNA/
├── ARCHIVE/ (old data, manual backups)
└── TEMPLATES/ (sheet templates, hidden from users)
```

---

## 3️⃣ ENVIRONMENT SETUP

### Why This Matters
- Test changes safely before production
- Separate data prevents accidents
- Each environment needs isolated resources

### Environments Required

#### 3.1 Development (DEV)

**Purpose**: Local development and testing

**Supabase Project**: `sahakar-accounts-dev`
- Create: https://app.supabase.com/
- Click "New project"
- Name: `Sahakar Accounts DEV`
- Database password: Generate strong password
- Region: Select closest (e.g., Singapore)
- Plan: Free tier OK for now

**Google Drive Folder**:
- Create new folder: `Sahakar Accounts DEV`
- Share with service account (Editor)
- Note folder ID

**Vercel Project**: Not needed yet (use local dev server)

#### 3.2 Staging (STAGING) - Optional but Recommended

**Purpose**: Final testing before production

**Supabase Project**: `sahakar-accounts-staging`
- Same steps as DEV

**Google Drive Folder**:
- Create: `Sahakar Accounts STAGING`
- Share with service account (Editor)
- Note folder ID

**Vercel Project**:
- Create when ready to deploy
- Environment: Preview
- Custom domain: `staging-accounts.zabnix.com`

#### 3.3 Production (PROD)

**Purpose**: Live system for 140+ stores

**Supabase Project**: `sahakar-accounts-prod`
- Same steps as DEV
- **CRITICAL**: Choose paid plan when traffic grows
- Enable backups (see section 7)

**Google Drive Folder**:
- Use existing: `Sahakar Accounts (READ ONLY - Auto-Synced)`
- Already configured above

**Vercel Project**:
- Create when ready to deploy
- Environment: Production
- Custom domain: `accounts.zabnix.com`

### Environment Variables Checklist

For each environment, you need:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Sheets
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=
GOOGLE_DRIVE_FOLDER_ID=

# App
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
NODE_ENV=
```

---

## 4️⃣ GOOGLE SERVICE ACCOUNT SECRETS STORAGE

### Where to Store (By Priority)

#### ✅ DO: Vercel Environment Variables

1. **Navigate to Vercel Dashboard**
   - URL: https://vercel.com/dashboard
   - Select your project

2. **Go to Settings → Environment Variables**
   - Or: Project → Settings → Environment Variables

3. **Add Variables**
   
   **GOOGLE_SHEETS_CLIENT_EMAIL**:
   - Name: `GOOGLE_SHEETS_CLIENT_EMAIL`
   - Value: `sahakar-sheets-sync@xxx.iam.gserviceaccount.com`
   - Environments: All (Production, Preview, Development)
   
   **GOOGLE_SHEETS_PRIVATE_KEY**:
   - Name: `GOOGLE_SHEETS_PRIVATE_KEY`
   - Value: Open JSON file, copy entire `private_key` field
     - Format: `"-----BEGIN PRIVATE KEY-----\nXXX...XXX\n-----END PRIVATE KEY-----\n"`
     - Include quotes and escape sequences
   - Environments: All
   - **MARK AS SENSITIVE** (eye icon)
   
   **GOOGLE_DRIVE_FOLDER_ID**:
   - Name: `GOOGLE_DRIVE_FOLDER_ID`
   - Value: `1rVL2Vz_BGUvD8HCcNxOs1hBFZPEK_kwn` (from folder URL)
   - Environments: Production only

4. **Save and Redeploy**
   - Click "Save"
   - Trigger new deployment to apply

#### ✅ DO: Local Development (.env.local)

1. **Create .env.local** (already in .gitignore)
2. **Copy from .env.example**
3. **Fill in actual values**
4. **NEVER commit this file**

#### ❌ DON'T: GitHub Repository

- NEVER commit JSON key file
- NEVER commit .env.local
- .gitignore already configured to prevent this

#### ❌ DON'T: Frontend Code

- These secrets are SERVER-SIDE ONLY
- Use in API routes, server actions, cron jobs
- Never expose in client components

---

## 5️⃣ ERROR LOGGING & VISIBILITY

### Minimum Required (Phase 1)

#### 5.1 Vercel Logs

**Already Enabled by Default**
- Dashboard → Your Project → Logs
- Shows all serverless function errors
- Real-time streaming
- 24hr retention (free tier)

**What to Monitor**:
- API route failures
- Cron job errors
- Build failures

#### 5.2 Supabase Logs

**Enable in Supabase Dashboard**
1. Go to: https://app.supabase.com/project/_/logs/explorer
2. Navigate to: Project → Logs → Query
3. Monitor:
   - `postgres_logs`: Database errors
   - `edge_logs`: API errors
   - `auth_logs`: Authentication issues

**Critical Queries**:

RLS Denial Detection:
```sql
SELECT timestamp, event_message
FROM postgres_logs
WHERE event_message ILIKE '%permission denied%'
ORDER BY timestamp DESC
LIMIT 50;
```

Failed Queries:
```sql
SELECT timestamp, event_message
FROM postgres_logs
WHERE event_message ILIKE '%error%'
ORDER BY timestamp DESC
LIMIT 50;
```

### Optional (Phase 2 - After Pilot)

#### 5.3 Sentry (Recommended)

**Why**: Better error grouping, source maps, user context

**Setup**:
1. Create account: https://sentry.io/
2. Create project: `sahakar-accounts`
3. Add to Next.js:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
4. Environment variable: `SENTRY_DSN`

#### 5.4 Logtail (Alternative)

**Why**: Better log search and retention

**Setup**:
1. Account: https://logtail.com/
2. Create source: Vercel
3. Add webhook to Vercel integrations

---

## 6️⃣ CRON / SCHEDULER SETUP

### Use Vercel Cron Jobs (Recommended)

#### 6.1 Create vercel.json

**File**: `vercel.json` in project root

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-sheets",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/daily-reminder",
      "schedule": "0 13 * * *"
    },
    {
      "path": "/api/cron/missed-submission-alert",
      "schedule": "30 2 * * *"
    }
  ]
}
```

**Schedule Explanation**:
- `*/15 * * * *`: Every 15 minutes (Sheets sync)
- `0 13 * * *`: Daily at 1:00 PM IST (converted to UTC: 7:30 AM UTC)
- `30 2 * * *`: Daily at 2:30 AM IST (check missed submissions)

#### 6.2 Create Cron Endpoints

**File**: `app/api/cron/sync-sheets/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Your sync logic here
    const result = await syncToGoogleSheets();
    
    return NextResponse.json({ 
      success: true, 
      synced: result.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sheets sync failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

#### 6.3 Secure Cron Endpoints

1. **Generate CRON_SECRET**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **Add to Environment Variables**:
   - Vercel Dashboard → Environment Variables
   - Name: `CRON_SECRET`
   - Value: Generated secret
   - Mark as sensitive

3. **Verify in Endpoints**:
   - Check `Authorization: Bearer {CRON_SECRET}` header
   - Return 401 if missing or invalid

#### 6.4 Monitor Cron Jobs

**Vercel Dashboard**:
- Project → Deployments → Function Logs
- Filter by cron path
- Check success/failure rates

---

## 7️⃣ BACKUP & RECOVERY PLAN

### 7.1 Supabase Backups

#### Enable Automatic Backups

1. **Navigate to Database Settings**
   - Supabase Dashboard → Project → Database → Backups

2. **Verify Automatic Backups**
   - Free tier: Daily backups, 7-day retention
   - Pro tier: Daily backups, 30-day retention
   - **Recommended**: Upgrade to Pro for production

3. **Enable Point-in-Time Recovery (PITR)**
   - Available on Pro plan
   - Allows restore to any point in last 7/30 days
   - Toggle: "Enable Point-in-Time Recovery" → ON

4. **Manual Backup** (Before major changes)
   - Click "Create backup now"
   - Name: `pre-production-deploy-2024-12-22`
   - Wait for completion

#### Restore Process

1. **Navigate to Backups**
2. **Select Backup** to restore
3. **Click "Restore"**
4. **CRITICAL**: This creates a NEW project
5. **Update connection strings** in app

### 7.2 Google Drive Backups

#### Enable Version History

**Already Enabled by Default**
- Google Sheets auto-save versions every few minutes
- Retention: 30 days (free), 100 versions max
- Workspace accounts: Extended retention

#### Access Version History

1. **Open any Sheet**
2. **File → Version history → See version history**
3. **Select version** to restore
4. **Click "Restore this version"**

#### Archive Strategy

**NEVER delete sheets programmatically**

Instead:
1. **Create ARCHIVE folder** in Drive root
2. **Move old sheets** to archive (not delete)
3. **Naming convention**: `MELATTUR_2024_ARCHIVED_2025-01-01.xlsx`

**Archive Cron Job** (Monthly):
```typescript
// Move sheets older than 12 months to ARCHIVE folder
// Keep folder structure intact
// Update database: mark as archived
```

### 7.3 Database Export (Weekly)

**Automated Weekly Export**:

1. **Create cron job**: `/api/cron/weekly-export`
2. **Schedule**: `0 0 * * 0` (Sunday midnight)
3. **Export tables to CSV**:
   - `daily_records`
   - `transactions`
   - `monthly_summaries`
   - `audit_logs`
4. **Upload to Google Drive** `/BACKUPS` folder
5. **Log export** in database

### 7.4 Disaster Recovery Test

**Quarterly DR Drill**:

1. **Restore latest Supabase backup** to staging
2. **Verify data integrity**
3. **Test application functionality**
4. **Document time to recover** (RTO)
5. **Document data loss** (RPO)

**Target**:
- RTO: < 4 hours
- RPO: < 24 hours

---

## 8️⃣ ROLE & ACCESS GOVERNANCE DOCUMENT

### Purpose
- Define who can create users
- Define who approves access
- Define auditor access lifecycle
- Define employee exit procedures

---

**File**: `ROLE_GOVERNANCE.md` (created separately)

See dedicated document for complete governance policies.

---

## SETUP COMPLETION CHECKLIST

### Google Cloud
- [ ] Google Cloud Project created
- [ ] Project ID noted
- [ ] Google Drive API enabled
- [ ] Google Sheets API enabled
- [ ] Service Account created
- [ ] Service Account email copied
- [ ] JSON key downloaded and secured
- [ ] JSON key NOT in Git repository

### Google Drive
- [ ] Root folder renamed (READ ONLY warning)
- [ ] Service Account has Editor access
- [ ] HO Accountant has Viewer access
- [ ] Folder description added (warnings)
- [ ] Folder ID noted

### Environments
- [ ] DEV Supabase project created
- [ ] PROD Supabase project created
- [ ] DEV Drive folder created
- [ ] PROD Drive folder configured
- [ ] Environment variables documented

### Secrets
- [ ] Service account JSON in password manager
- [ ] GOOGLE_SHEETS_CLIENT_EMAIL in Vercel
- [ ] GOOGLE_SHEETS_PRIVATE_KEY in Vercel (sensitive)
- [ ] GOOGLE_DRIVE_FOLDER_ID in Vercel
- [ ] CRON_SECRET generated and stored
- [ ] .env.local created (not committed)

### Monitoring
- [ ] Vercel logs accessible
- [ ] Supabase logs accessible
- [ ] RLS denial query saved
- [ ] Sentry setup (optional, Phase 2)

### Cron Jobs
- [ ] vercel.json created
- [ ] Cron endpoints created
- [ ] CRON_SECRET configured
- [ ] Endpoints secured (Bearer token)

### Backups
- [ ] Supabase auto-backups enabled
- [ ] Backup retention verified
- [ ] Manual backup created (baseline)
- [ ] Drive version history verified
- [ ] ARCHIVE folder created
- [ ] Weekly export cron planned

### Documentation
- [ ] ROLE_GOVERNANCE.md created
- [ ] Access request process documented
- [ ] Employee exit process documented
- [ ] Auditor access lifecycle documented

---

## NEXT STEPS AFTER SETUP

1. **Test Service Account Access**
   ```bash
   npm run test:sheets-auth
   ```

2. **Run First Sync** (manual test)
   ```bash
   curl -X GET http://localhost:3000/api/cron/sync-sheets \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

3. **Verify Drive Folder Write**
   - Check if test sheet created
   - Verify permissions

4. **Deploy to Vercel Staging**
   ```bash
   vercel --prod
   ```

5. **Test Production Cron**
   - Wait 15 minutes
   - Check Vercel logs
   - Verify sheet sync

---

**Setup Guide Version**: 1.0  
**Last Updated**: 2024-12-22  
**Maintained By**: [@frpboy](https://github.com/frpboy)  
**For**: Zabnix - Sahakar Accounts System
