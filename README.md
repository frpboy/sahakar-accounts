# Sahakar Accounts - Sales Management System

A comprehensive, offline-capable sales management system designed to replace Google Sheets data collection with robust accounting integrity and role-based access control.

## 🚀 Features

### Core Functionality
- **Multi-role Access Control**: Admin, Store Manager, and Store User roles with granular permissions
- **Comprehensive Sales Entry**: Support for multiple payment modes (Cash, UPI, Card, Credit)
- **Customer Management**: Mandatory referral tracking with phone number validation
- **Offline-first Architecture**: Draft management system with no silent sync
- **Real-time Dashboard**: Role-based data visualization with charts and statistics
- **Export Capabilities**: PDF, Excel, and CSV export for admin users
- **Progressive Web App**: Installable on all devices with offline capability

### User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full CRUD operations, export customer database, manage all settings |
| **Store Manager** | Full CRUD for store functions, view customers referred by staff |
| **Store User** | Add new entries and customers only, no edit/delete permissions |

### Transaction Types
- **New Sales**: Multi-payment mode support with validation
- **Sales Returns**: Cash and UPI return processing
- **Purchases**: Vendor management with payment breakdown
- **Credit Received**: Customer credit payment tracking

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS 3
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS policies
- **Offline Storage**: IndexedDB via idb library
- **PWA**: Workbox service worker
- **Forms**: React Hook Form + Zod validation
- **Charts**: Chart.js + React Chart.js 2
- **Export**: jsPDF + XLSX libraries
- **State Management**: Zustand + React Query

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- Supabase account and project

### 1. Clone and Install
```bash
git clone <repository-url>
cd sahakar-accounts
npm install
```

### 2. Supabase Configuration
1. Create a new Supabase project
2. Run the migration files in `/supabase/migrations/` in order:
   ```bash
   # Apply migrations through Supabase dashboard or CLI
   ```
3. Get your project URL and anon key from Supabase dashboard

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Architecture

### Database Schema
- **users**: User profiles with roles and outlet assignments
- **customers**: Customer data with mandatory referral tracking
- **sales**: Sales transactions with payment mode breakdown
- **sales_returns**: Return transactions
- **purchases**: Purchase entries with vendor details
- **credit_received**: Credit payment tracking
- **outlets**: Store outlet management

### Offline Strategy
The system implements a **draft-only offline mode** to maintain accounting integrity:

1. **No Silent Sync**: Entries are saved as drafts when offline
2. **Manual Submission**: Users must explicitly submit drafts when online
3. **Network Status Detection**: Persistent banner showing online/offline status
4. **IndexedDB Storage**: Local storage for drafts with proper indexing
5. **Service Worker**: Caching for offline functionality

### Security Features
- **Row Level Security (RLS)**: Database-level access control
- **Role-based Permissions**: Frontend and backend permission checks
- **Input Validation**: Comprehensive form validation with Zod
- **Phone Number Validation**: Unique customer phone requirement

## 📱 Progressive Web App

The system is configured as a PWA with:
- **Offline Capability**: Service worker caching
- **Installable**: Can be installed on mobile devices
- **Responsive Design**: Mobile-first approach
- **Push Notifications**: Ready for notification implementation

To install:
1. Open the application in a supported browser
2. Look for the "Install" option in the browser menu
3. Follow the installation prompts

## 🔧 Usage Guide

### For Admins
1. **Login**: Use admin credentials to access full functionality
2. **Dashboard**: View comprehensive store analytics and charts
3. **Customer Export**: Navigate to Export section to download customer data
4. **User Management**: Create and manage store managers and users

### For Store Managers
1. **Daily Operations**: Use Daily Entries hub for all transactions
2. **Customer Management**: Add customers with mandatory referral tracking
3. **Sales Entry**: Create sales with multiple payment modes
4. **Draft Management**: Review and submit offline drafts

### For Store Users
1. **Limited Access**: Can only add new entries and customers
2. **Customer Creation**: Add customers (automatically referred to self)
3. **Sales Entry**: Create sales entries with payment breakdown

## 📊 Dashboard Features

- **Role-based Charts**: Different views based on user role
- **Payment Mode Distribution**: Visual breakdown of payment types
- **Daily Sales Trends**: 7-day sales history
- **Quick Statistics**: Today's sales, total sales, customer count
- **Recent Transactions**: Latest sales entries

## 🔄 Offline Workflow

1. **Network Detection**: System automatically detects online/offline status
2. **Draft Creation**: All entries saved as drafts when offline
3. **Visual Indicators**: Clear offline mode indicators and warnings
4. **Manual Submission**: Users submit drafts when connection restored
5. **Conflict Resolution**: Duplicate entry prevention

## 🛡️ Data Integrity

### Accounting Principles
- **No Offline Writes**: Prevents accounting corruption
- **Entry Number Validation**: Unique bill/entry numbers required
- **Payment Validation**: Total payment must equal sales value
- **Customer Uniqueness**: Phone number-based customer identification

### Backup Strategy
- **IndexedDB**: Local draft storage with proper indexing
- **Service Worker**: Asset caching for offline functionality
- **Supabase**: Cloud backup with real-time sync when online

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Environment Variables for Production
```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

## 🔍 Testing

### Run TypeScript Check
```bash
npm run check
```

### Run Linter
```bash
npm run lint
```

### Manual Testing Checklist
- [ ] Offline mode functionality
- [ ] Role-based access control
- [ ] Form validation and error handling
- [ ] Draft submission process
- [ ] Export functionality

## 📦 CI/CD & Documentation Workflow

- Automated verification on push: lint, typecheck, tests, builds
- Deployment to Vercel and Supabase after successful verification
- Weekly dependency updates via automated PRs
- Wiki pages managed in `wiki/` and synced to GitHub Wiki
- Changelogs:
  - `log.md` for detailed local developer notes
  - `CHANGELOG.md` for user-facing release notes

## 🤖 GitHub MCP
- This repo is ready for use with the GitHub MCP Server
- See `docs/github-mcp.md` for setup and recommended toolsets
- [ ] PWA installation
- [ ] Network status detection

## 📈 Performance Optimizations

- **React Query**: Efficient data fetching and caching
- **IndexedDB**: Fast local storage for drafts
- **Service Worker**: Asset caching for faster loads
- **Code Splitting**: Lazy loading for better performance
- **Image Optimization**: Responsive images with proper sizing

## 🔒 Security Considerations

- **Supabase RLS**: Row Level Security policies implemented
- **Input Sanitization**: All user inputs validated
- **Role Validation**: Both frontend and backend permission checks
- **API Key Security**: Anon keys used in frontend only

## 🐛 Troubleshooting

### Common Issues

**Service Worker Not Registering**
- Check browser console for errors
- Ensure HTTPS in production
- Clear browser cache and retry

**Offline Drafts Not Saving**
- Check IndexedDB browser support
- Verify service worker registration
- Check browser storage quotas

**Supabase Connection Issues**
- Verify environment variables
- Check Supabase project status
- Review RLS policies

### Support
For issues and questions, please check the documentation or create an issue in the repository.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Supabase team for the excellent backend services
- TailwindCSS for the utility-first CSS framework
- React community for the robust ecosystem
- Chart.js for the beautiful data visualization
