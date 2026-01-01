# Active User Credentials

## Summary
This document contains credentials for **active users only** after the database cleanup.

**Total Active Users: 11**
- 3 Global users (Superadmin, HO Accountant, Auditor)
- 8 Outlet users (4 Managers + 4 Staff across 4 active outlets)

---

## Global Access Users

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| frpboy12@gmail.com | Zabnix@2025 | Superadmin | All outlets |
| paymentstarterxpmna@gmail.com | Zabnix@2025 | HO Accountant | All outlets |
| auditor.test@sahakar.com | Zabnix@2025 | Auditor | All outlets (read-only) |

---

## Hyper Pharmacy Outlets

### Tirur (HP-TIRUR)
**Outlet ID:** `b64f135c-5279-4f5e-9331-00392011d3da`

| Email | Password | Role | Full Name |
|-------|----------|------|-----------|
| manager.hp.tirur@sahakar.com | Zabnix@2025 | Outlet Manager | Sahakar Hyper Pharmacy - Tirur Manager |
| staff.hp.tirur@sahakar.com | Zabnix@2025 | Outlet Staff | Sahakar Hyper Pharmacy - Tirur Staff |

### Makkaraparamba (HP-MAKKARA)
**Outlet ID:** `11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca`

| Email | Password | Role | Full Name |
|-------|----------|------|-----------|
| manager.hp.makkara@sahakar.com | Zabnix@2025 | Outlet Manager | Sahakar Hyper Pharmacy - Makkaraparamba Manager |
| staff.hp.makkara@sahakar.com | Zabnix@2025 | Outlet Staff | Sahakar Hyper Pharmacy - Makkaraparamba Staff |

### Melattur (HP-MELATTUR)
**Outlet ID:** `1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51`

| Email | Password | Role | Full Name |
|-------|----------|------|-----------|
| manager.hp.melattur@sahakar.com | Zabnix@2025 | Outlet Manager | Sahakar Hyper Pharmacy - Melattur Manager |
| staff.hp.melattur@sahakar.com | Zabnix@2025 | Outlet Staff | Sahakar Hyper Pharmacy - Melattur Staff |

### Karinkallathani (HP-KARINKALL)
**Outlet ID:** `716b6d1f-a740-406c-a764-548a4de15722`

| Email | Password | Role | Full Name |
|-------|----------|------|-----------|
| manager.hp.karinkall@sahakar.com | Zabnix@2025 | Outlet Manager | Sahakar Hyper Pharmacy - Karinkallathani Manager |
| staff.hp.karinkall@sahakar.com | Zabnix@2025 | Outlet Staff | Sahakar Hyper Pharmacy - Karinkallathani Staff |

---

## Login Quick Reference

**Universal Password:** `Zabnix@2025`

### For Superadmin/Global Access:
```
Email: frpboy12@gmail.com
Password: Zabnix@2025
```

### For HO Accountant:
```
Email: paymentstarterxpmna@gmail.com
Password: Zabnix@2025
```

### For Auditor:
```
Email: auditor.test@sahakar.com
Password: Zabnix@2025
```

### For Outlet Managers/Staff:
```
Email: manager.hp.[location]@sahakar.com  (or staff.hp.[location])
Password: Zabnix@2025

Where [location] is one of:
- tirur
- makkara
- melattur
- karinkall
```

---

## Notes

1. **ALL users share the same password**: `Zabnix@2025`
2. **Login page** has a Quick Fill dropdown for easy access during development
3. All users are mapped to their respective outlets as shown in the Outlet ID field above
4. Database was cleaned up on 2026-01-01 to retain only these 4 active outlets
5. Total of **11 active user accounts** (3 global + 8 outlet-specific)

---

## Security

⚠️ **IMPORTANT**: 
- This file contains sensitive credentials
- Never commit this file to version control
- Change passwords before production deployment
- The file is listed in `.gitignore` to prevent accidental commits
