# Contributing to Sahakar Accounts

## ⚠️ IMPORTANT NOTICE

This is a **proprietary software project** owned exclusively by **Zabnix**. This project is **NOT open source** and is not accepting public contributions.

## For Zabnix Employees & Authorized Contractors Only

If you are an authorized developer working on this project, please follow these guidelines:

### Prerequisites

- Employee or contractor agreement with Zabnix
- Authorized access granted by project maintainer
- Signed NDA (Non-Disclosure Agreement)
- Access to internal documentation

### Development Workflow

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Follow Naming Conventions**
   - Features: `feature/short-description`
   - Bug fixes: `fix/bug-description`
   - Hotfixes: `hotfix/critical-issue`
   - Refactoring: `refactor/what-changed`

3. **Commit Message Format**
   
   Use Conventional Commits:
   ```
   type(scope): subject
   
   body (optional)
   
   footer (optional)
   ```
   
   **Types**:
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation changes
   - `style`: Formatting, missing semicolons, etc.
   - `refactor`: Code refactoring
   - `test`: Adding tests
   - `chore`: Maintenance tasks
   
   **Example**:
   ```
   feat(transactions): add bulk import functionality
   
   - Added CSV parser for transaction import
   - Implemented validation for imported data
   - Added progress indicator for large imports
   
   Closes #123
   ```

4. **Code Quality Standards**
   
   Before committing:
   ```bash
   npm run lint        # Fix linting issues
   npm run type-check  # Ensure TypeScript types are correct
   npm run format      # Format code with Prettier
   ```

5. **Testing Requirements**
   
   - Write unit tests for new features
   - Update existing tests if modifying functionality
   - Ensure all tests pass:
     ```bash
     npm run test
     ```

6. **Create Pull Request**
   
   - Push your branch to GitHub
   - Create PR with descriptive title and description
   - Link related issues (e.g., "Closes #123")
   - Request review from designated code reviewer
   - Address all review comments

7. **Code Review Process**
   
   - At least 1 approval required from core team
   - All CI checks must pass
   - No merge conflicts
   - Squash and merge when approved

### Code Standards

#### TypeScript
- Use strict mode
- Define proper types (no `any` unless absolutely necessary)
- Use interfaces for object shapes
- Document complex type definitions

#### React Components
- Use functional components with hooks
- Keep components small and focused
- Use meaningful component names
- Extract reusable logic to custom hooks
- Implement proper error boundaries

#### Database
- Never bypass RLS policies
- Use parameterized queries (no string concatenation)
- Properly index new columns
- Write migration scripts for schema changes
- Document complex queries

#### Security
- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user input
- Sanitize data before database insertion
- Follow principle of least privilege

### File Organization

```
app/
├── (auth)/           # Authentication pages
├── (dashboard)/      # Protected dashboard pages
└── api/             # API routes

components/
├── ui/              # shadcn/ui base components (don't modify)
├── forms/           # Form components
├── tables/          # Table components
└── ...              # Feature-specific components

lib/
├── db.ts            # Database client
├── supabase.ts      # Supabase utilities
├── validations.ts   # Zod schemas
└── utils.ts         # Shared utilities
```

### Branching Strategy

- `main`: Production-ready code (protected)
- `develop`: Integration branch for features
- `feature/*`: New features
- `fix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

### Release Process

1. All features merged to `develop`
2. Create release branch: `release/v1.x.x`
3. Perform testing and bug fixes
4. Merge to `main` and tag release
5. Deploy to production
6. Merge back to `develop`

### Getting Help

- **Technical Lead**: [@frpboy](https://github.com/frpboy)
- **Documentation**: See `plan.md` and `action_plan.md`
- **Internal Wiki**: [Link to internal documentation]
- **Slack Channel**: #sahakar-accounts-dev

### Confidentiality Reminder

🔒 All code, data, and discussions related to this project are **strictly confidential**. Do not:

- Share code publicly
- Discuss project details outside Zabnix
- Commit sensitive data to repository
- Use this code in personal projects
- Share access credentials

Violation of confidentiality agreements will result in immediate termination and legal action.

---

**For External Parties**: This project does not accept external contributions. If you believe you have found a security vulnerability, please contact security@zabnix.com directly.

**Copyright © 2024 Zabnix. All Rights Reserved.**  
**Built by [@frpboy](https://github.com/frpboy)**
