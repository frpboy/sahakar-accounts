# Contributing to Sahakar Accounts

Thank you for your interest in contributing to Sahakar Accounts! This document provides guidelines and instructions for contributing.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (for database)
- Git
- Code editor (VS Code recommended)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/frpboy/sahakar-accounts.git
   cd sahakar-accounts
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Enable DEV_MODE for local testing**
   ```env
   NEXT_PUBLIC_DEV_MODE=true
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:3000
   ```

---

## 📝 Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow configured rules
- **Prettier**: Auto-format on save
- **Naming**: 
  - Components: PascalCase (`TransactionForm.tsx`)
  - Files: kebab-case (`transaction-form.tsx`)
  - Functions: camelCase (`handleSubmit`)
  - Constants: UPPER_SNAKE_CASE (`DEV_MODE`)

### Component Structure

```typescript
'use client'; // If using hooks/state

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ComponentProps {
    prop1: string;
    prop2?: number;
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
    const [state, setState] = useState('');

    // Logic here

    return (
        <div>
            {/* JSX here */}
        </div>
    );
}
```

### API Route Structure

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { ValidationSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        
        // Logic here
        
        return NextResponse.json(data);
    } catch (error: any) {
        // Sanitized error logging
        console.error('Error:', {
            message: error.message,
            code: error.code,
        });
        
        return NextResponse.json(
            { error: 'An error occurred' },
            { status: 500 }
        );
    }
}
```

---

## 🔒 Security Guidelines

### Critical Rules

1. **Never commit credentials**
   - Use `.env.local` for secrets
   - Never commit `.env.local`
   - Use environment variables only

2. **Always validate input**
   ```typescript
   // Use Zod schemas
   const validated = TransactionSchema.parse(body);
   ```

3. **Always use idempotency keys for writes**
   ```typescript
   const idempotencyKey = request.headers.get('x-idempotency-key');
   ```

4. **Sanitize error messages**
   ```typescript
   // BAD:
   console.error(err); // May contain passwords
   
   // GOOD:
   console.error({ message: err.message, code: err.code });
   ```

5. **Use IST timezone for dates**
   ```typescript
   const istOffset = 5.5 * 60 * 60 * 1000;
   const istTime = new Date(now.getTime() + istOffset);
   ```

---

## 🧪 Testing

### Running Tests
```bash
npm run test        # Unit tests
npm run test:e2e    # End-to-end tests
npm run lint        # Linting
npm run type-check  # TypeScript check
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('TransactionForm', () => {
    it('should validate amount is positive', () => {
        const result = TransactionSchema.parse({
            amount: 100,
            // ... other fields
        });
        
        expect(result.amount).toBeGreaterThan(0);
    });
});
```

---

## 📊 Database Changes

### Adding Migrations

1. Create SQL file in `database/`
   ```sql
   -- Add new column
   ALTER TABLE transactions 
   ADD COLUMN new_field TEXT;
   
   -- Add index
   CREATE INDEX idx_new_field 
   ON transactions(new_field);
   ```

2. Document in CHANGELOG.md
3. Update database.types.ts if needed

### RLS Policies

Always add RLS policies for new tables:
```sql
-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Users can access own data"
ON new_table
FOR SELECT
USING (user_id = auth.uid());
```

---

## 🎯 Pull Request Process

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Follow code style guidelines
   - Add tests for new features
   - Update documentation

3. **Test thoroughly**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   ```

4. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add transaction export feature"
   git commit -m "fix: resolve timezone bug in daily records"
   git commit -m "docs: update API documentation"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manually tested

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No new warnings
   ```

---

## 🐛 Reporting Issues

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]
```

---

## 📚 Documentation

### Update These Files

- **README.md** - Overview and features
- **CHANGELOG.md** - Version history
- **LOG.md** - Development log
- **API docs** - For new endpoints
- **Code comments** - For complex logic

---

## ✅ Definition of Done

A feature is complete when:

- [ ] Code implemented and tested
- [ ] Unit tests added
- [ ] Integration tests pass
- [ ] TypeScript errors resolved
- [ ] ESLint warnings resolved
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] PR reviewed and approved
- [ ] Merged to main branch

---

## 🤝 Code Review Guidelines

### For Reviewers

- Check for security vulnerabilities
- Verify input validation
- Ensure error handling
- Review test coverage
- Check for hardcoded values
- Verify timezone handling

### For Authors

- Self-review before requesting review
- Respond to comments promptly
- Update based on feedback
- Keep PRs focused and small

---

## 📞 Getting Help

- **Questions**: Open a discussion
- **Bugs**: Create an issue
- **Security**: Email privately to admin
- **Documentation**: Check README.md and LOG.md

---

## 📜 License

This is proprietary software. See [LICENSE](LICENSE) for details.

---

**Thank you for contributing to Sahakar Accounts! 🎉**
