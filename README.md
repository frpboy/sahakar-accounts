# Sahakar Accounts

Multi-tenant accounting system for hyperpharmacies with Google Sheets integration.

## 📋 Features

- **Multi-tenant Architecture**: Support for 140+ outlets
- **Role-Based Access Control**: Master Admin, HO Accountant, Outlet Manager, Outlet Staff
- **Daily Entry System**: Structured transaction entry with real-time balance calculation
- **Google Sheets Sync**: Automated sync to Google Sheets for HO monitoring
- **Audit Trail**: Complete activity logging
- **Security**: Row-level security with Supabase

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Cloud account (for Sheets API)

### Installation

1. **Clone and install dependencies**:
```bash
cd sahakar-accounts
npm install
```

2. **Set up Supabase**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run `database/schema.sql`
   - Copy your project URL and anon key

3. **Configure environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. **Create your first admin user**:
   - Go to Supabase Auth → Users → Create User
   - After creating auth user, run this SQL:
   ```sql
   INSERT INTO users (id, organization_id, email, full_name, role)
   VALUES (
     'USER_ID_FROM_AUTH',
     '00000000-0000-0000-0000-000000000001',
     'admin@example.com',
     'Admin Name',
     'master_admin'
   );
   ```

5. **Run the development server**:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and login with your admin credentials.

## 📁 Project Structure

```
sahakar-accounts/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   └── login/
│   ├── (dashboard)/         # Dashboard pages (protected)
│   │   ├── dashboard/
│   │   ├── daily-entry/
│   │   ├── monthly/
│   │   ├── outlets/
│   │   └── users/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/              # Reusable React components
│   ├── dashboard-nav.tsx
│   ├── user-menu.tsx
│   └── providers.tsx
├── lib/
│   ├── database.types.ts   # TypeScript types for database
│   ├── supabase.ts         # Supabase client
│   ├── db.ts               # Database helper functions
│   └── utils.ts            # Utility functions
├── database/
│   └── schema.sql          # Database schema
└── public/                  # Static assets
```

## 🔐 User Roles

### Master Admin
- Full system access
- Create/manage outlets and users
- View all data across all outlets

### HO Accountant
- Read-only access to all outlets
- Lock/unlock days after verification
- Flag discrepancies

### Outlet Manager
- Full access to assigned outlet(s)
- Create/edit daily entries (until locked)
- Manage outlet staff

### Outlet Staff
- Add transactions (today only)
- View own entries
- No historical data access

## 📊 Daily Entry Workflow

1. **Select Outlet & Date**: Choose the outlet and date for entry
2. **Opening Balances**: Auto-filled from previous day's closing
3. **Add Transactions**: Enter income/expense transactions
4. **Live Totals**: View real-time cash/UPI balances
5. **Submit Day**: Lock the day for HO review

## 🗄️ Database Schema

See [action_plan.md](./action_plan.md) for complete schema documentation.

Key tables:
- `organizations` - Multi-tenant root
- `outlets` - Hyperpharmacy locations
- `users` - System users with roles
- `daily_records` - Daily accounting days
- `transactions` - Income/expense entries
- `categories` - Transaction categories

## 🔄 Google Sheets Integration

(To be implemented in Phase 4)

- One Google Sheet per outlet
- Automated batch sync every 15 minutes
- Read-only for HO Accountant
- Daily sheets auto-created from template

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Query, Zustand
- **Forms**: React Hook Form, Zod
- **Deployment**: Vercel

## 📝 Development Roadmap

- [x] Phase 1: Planning & Architecture
- [x] Phase 2: Core Setup
- [x] Phase 3: Database Implementation
- [ ] Phase 4: Backend Development
- [x] Phase 5: Frontend Development (In Progress)
- [ ] Phase 6: Integration & Testing
- [ ] Phase 7: Deployment

## 🤝 Contributing

This is a private project. For access or questions, contact the development team.

## 📄 License

Proprietary - All rights reserved.

## 🆘 Support

For technical support:
- Email: support@sahakar-accounts.com
- Documentation: See [action_plan.md](./action_plan.md)

---

Built with ❤️ for Sahakar Hyperpharmacies
