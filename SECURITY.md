# Security Policy

## 🔒 Proprietary Software Notice

This is **proprietary software** owned by **Zabnix**. Security matters are handled internally by authorized personnel only.

## Reporting a Vulnerability

### For Zabnix Employees & Authorized Contractors

If you discover a security vulnerability in this software:

1. **DO NOT** open a public issue
2. **DO NOT** discuss the vulnerability publicly
3. **DO** report immediately via one of these channels:
   - **Email**: security@zabnix.com
   - **Slack**: Send a direct message to the security team
   - **In person**: Contact your manager or the technical lead

### Information to Include

When reporting a security vulnerability, please include:

- **Description**: Clear description of the vulnerability
- **Location**: Where in the codebase the issue exists
- **Impact**: Potential impact and severity assessment
- **Reproduction**: Step-by-step instructions to reproduce
- **Proof of Concept**: If applicable (code, screenshots, logs)
- **Suggested Fix**: If you have recommendations

### Response Timeline

- **Critical**: Response within 4 hours, patch within 24 hours
- **High**: Response within 24 hours, patch within 1 week
- **Medium**: Response within 3 days, patch within 2 weeks
- **Low**: Response within 1 week, patch in next release

## Security Measures

### Authentication & Authorization

- ✅ Supabase Auth with JWT tokens
- ✅ 2FA (TOTP) for Super Admin accounts
- ✅ Row-Level Security (RLS) on all database tables
- ✅ Role-based access control (RBAC)
- ✅ Session expiry: 24 hours
- ✅ Auto-logout after 30 minutes of inactivity

### Data Protection

- ✅ HTTPS enforced in production
- ✅ Data encrypted at rest (Supabase default)
- ✅ Data encrypted in transit (TLS 1.3)
- ✅ Input sanitization with Zod validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (React auto-escaping + CSP headers)
- ✅ CSRF protection

### Audit & Compliance

- ✅ Immutable audit logs (7-year retention)
- ✅ All sensitive actions logged
- ✅ Export watermarking
- ✅ GDPR-compliant data handling
- ✅ Regular security audits

## Security Best Practices for Developers

### Code Security

1. **Never commit secrets**
   - Use environment variables
   - Add sensitive files to `.gitignore`
   - Rotate API keys regularly

2. **Validate all input**
   - Use Zod schemas for validation
   - Sanitize user input before processing
   - Never trust client-side data

3. **Database security**
   - Always use RLS policies
   - Use parameterized queries
   - Never bypass security checks
   - Limit database permissions

4. **API security**
   - Implement rate limiting
   - Validate JWT tokens
   - Check user permissions server-side
   - Use CORS properly

5. **Dependencies**
   - Keep dependencies updated
   - Run `npm audit` regularly
   - Review security advisories
   - Use Dependabot alerts

### Access Control

1. **Principle of Least Privilege**
   - Grant minimum necessary permissions
   - Review permissions regularly
   - Revoke access immediately upon termination

2. **Password Requirements**
   - Minimum 12 characters
   - Must include: uppercase, lowercase, number, symbol
   - Password expiry: 90 days
   - No password reuse (last 5 passwords)

3. **API Keys & Tokens**
   - Store securely in environment variables
   - Never log sensitive tokens
   - Rotate regularly
   - Revoke immediately if compromised

## Incident Response Plan

### If a Security Breach Occurs

1. **Immediate Actions**
   - Isolate affected systems
   - Preserve evidence (logs, snapshots)
   - Notify security team
   - Document incident timeline

2. **Investigation**
   - Determine scope of breach
   - Identify compromised data
   - Assess impact
   - Trace attack vector

3. **Remediation**
   - Patch vulnerability
   - Rotate compromised credentials
   - Update security measures
   - Deploy fixes

4. **Communication**
   - Notify affected users (if applicable)
   - Report to management
   - Document lessons learned
   - Update security procedures

## Secure Development Lifecycle

### Pre-Development
- Threat modeling
- Security requirements gathering
- Secure architecture review

### Development
- Secure coding standards
- Code review (security focus)
- Static code analysis
- Dependency scanning

### Testing
- Security testing
- Penetration testing (annually)
- Vulnerability scanning
- Access control testing

### Deployment
- Secure configuration
- Environment hardening
- Secret management
- Monitoring setup

### Maintenance
- Regular security updates
- Patch management
- Security audit logs review
- Incident response drills

## Compliance Requirements

### Data Retention
- Financial records: 7 years minimum
- Audit logs: 7 years minimum
- User data: Per GDPR requirements

### Access Logging
- All authentication attempts
- All authorization failures
- All data modifications
- All exports and reports
- All administrative actions

### Encryption Standards
- TLS 1.3 for data in transit
- AES-256 for data at rest
- Argon2 for password hashing

## Security Contacts

**Internal Security Team**  
Email: security@zabnix.com  
Emergency Hotline: [Internal number]

**Technical Lead**  
GitHub: [@frpboy](https://github.com/frpboy)

**Project Manager**  
Email: pm@zabnix.com

## External Security Researchers

⚠️ **This is NOT a public bug bounty program.**

If you are an external security researcher and have discovered a vulnerability:

1. **Do NOT** exploit the vulnerability
2. **Do NOT** access, modify, or delete data
3. **Contact us immediately**: security@zabnix.com
4. **Provide details**: vulnerability description and reproduction steps
5. **Wait for response**: We will respond within 48 hours

We take security seriously and will work with you to understand and resolve the issue, but we do not offer financial rewards or bounties.

---

**Last Updated**: December 22, 2024  
**Policy Version**: 1.0

**Copyright © 2024 Zabnix. All Rights Reserved.**  
**Built by [@frpboy](https://github.com/frpboy)**
