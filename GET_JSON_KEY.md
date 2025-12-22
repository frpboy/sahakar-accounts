# 🔑 How to Get Your Service Account JSON Key

The JSON key file download might be blocked by your browser settings. Here's how to get it:

## Option 1: Try Download Again with Browser Settings

1. **Open Google Cloud Console**: https://console.cloud.google.com/iam-admin/serviceaccounts/details/113629729962423468662/keys?project=sahakar-accounts-production

2. **Check Browser Downloads**:
   - Look at your browser's download bar (usually bottom-left or top-right)
   - The file should be named: `sahakar-accounts-production-ec58d2fc201c.json`

3. **If Download is Blocked**:
   - Chrome: Click the downloads icon (↓) in the top-right
   - Look for blocked downloads
   - Click "Keep" or "Allow" if blocked

4. **Alternative: Download from Keys Tab**:
   - Click "ADD KEY" → "Create new key"
   - Select "JSON"
   - Click "CREATE"
   - **Right-click the download notification** → "Show in folder"

## Option 2: Copy Key Content Directly

If you still can't download the file, you can view the key in the browser:

1. Open the downloaded JSON file location (if found):
   - Press `Win + E` to open File Explorer
   - Navigate to: `C:\Users\LENOVO\Downloads`
   - Look for: `sahakar-accounts-production-*.json`
   - Sort by "Date modified" (newest first)

2. **Open the file** with a text editor (Notepad, VS Code)

3. **Copy the entire content** - it should look like this:

```json
{
  "type": "service_account",
  "project_id": "sahakar-accounts-production",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYourLongKeyHere...\n-----END PRIVATE KEY-----\n",
  "client_email": "sahakar-sheets-sync@sahakar-accounts-production.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## What You Need from the JSON File

For your `.env.local` file, you need two specific values:

### 1. CLIENT_EMAIL (already have this):
```
GOOGLE_SHEETS_CLIENT_EMAIL=sahakar-sheets-sync@sahakar-accounts-production.iam.gserviceaccount.com
```

### 2. PRIVATE_KEY (copy from JSON):
- Open the JSON file
- Find the `"private_key"` field
- Copy the ENTIRE VALUE including:
  - The opening quote `"`
  - The text: `-----BEGIN PRIVATE KEY-----`
  - All the `\n` characters (these are important!)
  - The encoded key
  - The text: `-----END PRIVATE KEY-----`
  - The closing quote `"`

Example:
```
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...YourKeyHere...NBw=\n-----END PRIVATE KEY-----\n"
```

**IMPORTANT**: Keep the `\n` escape sequences - they represent line breaks!

## Quick Setup Steps

1. **Locate the JSON file** (check Downloads folder)
2. **Open it with text editor**
3. **Copy the `private_key` value** (including quotes and \n characters)
4. **Create `.env.local`** in your project root
5. **Copy from `.env.example`** and fill in the values
6. **Save and close**

## Verify Setup

Run this command to test if the key works:

```bash
node -e "const fs = require('fs'); const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY; console.log(key ? 'Key loaded' : 'Key missing')"
```

---

**Need help?** The JSON key file should be in one of these locations:
- `C:\Users\LENOVO\Downloads`
- Browser's download folder (check browser settings)
- Temporary download location

**Browser Download Settings**:
- Chrome: `chrome://settings/downloads`
- Edge: Check Edge downloads (Ctrl+J)
