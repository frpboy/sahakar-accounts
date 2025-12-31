# Role & Access Governance Policy

**Document Owner**: Super Admin  
**Last Updated**: 2024-12-22  
**Version**: 1.0  
**Status**: Active

---

## 1. PURPOSE

This document defines the governance policies for user access, role assignment, and lifecycle management in the Sahakar Accounts system.

**Scope**: All users across all 140+ stores

---

## 2. WHO CAN CREATE USERS

### Super Admin (Primary Authority)

**Who**: Designated system administrator (1-2 people max)

**Can Create**:
- All user types
- All roles
- Any number of users

**Process**:
1. Receive request via email: `access-request@zabnix.com`
2. Verify requester identity
3. Confirm with HO Accountant (for store users)
4. Create user in system
5. Send credentials via secure channel
6. Log creation in audit trail

**Approval Required**: None (but actions are audited)

### HO Accountant (Limited Authority)

**Who**: Head Office Accountant

**Can Create**:
- Store Users (data entry only)
- Store Managers (with Super Admin approval)

**Process**:
1. Submit request to Super Admin
2. Wait for approval
3. Super Admin creates user
4. HO notified of completion

**Cannot Create**:
- Super Admin
- Other HO Accountants
- CA/Auditors

### Store Manager (No Authority)

**Who**: Outlet managers

**Can Create**: None

**Process**:
1. Request new Store User via email
2. Super Admin creates after verification
3. Store Manager notified

---

## 3. WHO APPROVES ACCESS

### New User Requests

| Role | Requester | Approver | Secondary Approval |
|------|-----------|----------|-------------------|
| Super Admin | Management | Board/CEO | N/A |
| HO Accountant | Super Admin | Management | N/A |
| Store Manager | Store Owner | Super Admin | HO Accountant |
| Store User | Store Manager | Super Admin | None |
| CA/Auditor | External | Super Admin | Management |

### Access Modifications

**Role Change**:
- Requester: User's manager
- Approver: Super Admin
- Notification: HO Accountant + Management

**Store Assignment**:
- Requester: Store Manager
- Approver: Super Admin
- Notification: HO Accountant

**Access Revocation**:
- Requester: Manager or HR
- Approver: Super Admin (immediate)
- Notification: HO Accountant + IT

---

## 4. AUDITOR ACCESS LIFECYCLE

### Access Request

**Who Can Request**:
- External CA firms
- Internal audit team
- Regulatory authorities
- Management (special review)

**Process**:
1. **Submit Request**
   - Email: `audit-access@zabnix.com`
   - Include: Firm name, auditor name, purpose, date range, duration

2. **Verification**
   - Super Admin verifies request authenticity
   - Check: Valid CA license, engagement letter, authorization

3. **Approval**
   - Super Admin approves
   - Management notified
   - HO Accountant notified

4. **Grant Access**
   - Create CA/Auditor account
   - Set expiry date (default: 7 days)
   - Scope: Locked data only
   - Send credentials via secure email

### Access Duration

**Default**: 7 days

**Extensions**:
- Auditor requests extension
- Super Admin approves (max 2 extensions)
- Management notified
- Maximum total: 21 days

**Auto-Expiry**:
- Account auto-deactivates after expiry
- System sends notification 24 hours before
- Auditor must request extension before expiry

### Access Revocation

**Immediate Revocation** (if):
- Engagement ends
- Suspicious activity detected
- Management requests
- External request (e.g., CA firm)

**Process**:
1. Super Admin deactivates account
2. Audit log entry created
3. Management notified
4. Auditor notified via email

### Audit Trail

**All auditor actions logged**:
- Login/logout timestamps
- Pages viewed
- Reports exported
- Filters applied
- Search queries

**Retention**: 7 years (compliance requirement)

---

## 5. EMPLOYEE EXIT PROCESS

### Resignation / Termination

#### Immediate Actions (Day 1)

**HR Notification**:
- HR sends exit notification to Super Admin
- Include: Name, Role, Last working day, Reason

**Super Admin Actions**:
1. Mark user as "Exit in Progress"
2. Schedule deactivation for last working day + 1
3. Notify HO Accountant
4. Begin access audit

#### Last Working Day

**Store Level**:
- Store Manager ensures handover
- All pending transactions submitted
- Physical handover completed

**System Level**:
- User completes all pending tasks
- No new transactions allowed (read-only)

#### Day After Last Working Day

**Super Admin**:
1. Deactivate user account (`is_active = false`)
2. Revoke all store access
3. User cannot login
4. All historical data retained (audit requirement)

**System Shows**:
- "Created by: {Name} (Former Employee)"
- All audit trails remain intact

#### Data Retention

**NEVER delete**:
- User's historical transactions
- Audit logs
- Submitted/locked days
- Export records

**Update**:
- User status: `is_active = false`
- Exit date: `exited_at = {date}`
- Exit reason: `exit_reason = {resignation/termination/transfer}`

### Transfer to Another Store

**Process**:
1. HR notifies Super Admin of transfer
2. Super Admin:
   - Revokes access to old store
   - Grants access to new store
   - Retains same role (unless changed)
3. User notified of transfer
4. Old store manager notified
5. New store manager notified

**Data**:
- Historical data at old store remains tagged to user
- User can access new store immediately
- Cannot access old store (unless explicitly granted)

---

## 6. ACCESS REQUEST PROCEDURES

### New User Request

**Template Email**:
```
To: access-request@zabnix.com
Subject: New User Access Request - {Store Name}

Requester: {Your Name}
Role: {Your Role}

New User Details:
- Full Name: 
- Email: 
- Phone: 
- Role Requested: [Store Manager / Store User]
- Store Assignment: 
- Justification: 

Manager Approval: [Name, Date]
```

**Super Admin Response**:
- Acknowledge within 4 hours
- Create user within 24 hours
- Send credentials securely
- CC requester and manager

### Role Change Request

**Template Email**:
```
To: access-request@zabnix.com
Subject: Role Change Request - {User Name}

Requester: {Your Name}
Current User: {Name}
Current Role: {Role}
Requested Role: {New Role}
Justification: 

HO Accountant Approval: [If applicable]
Management Approval: [If required]
```

**Super Admin Actions**:
1. Verify approvals
2. Update role
3. Log change in audit trail
4. Notify user, requester, HO Accountant

### Emergency Access (After Hours)

**Scenario**: Critical issue, user locked out

**Process**:
1. User contacts on-call Super Admin (phone)
2. Super Admin verifies identity (security questions)
3. Temporary access granted (24 hours)
4. Logged as "Emergency Access Grant"
5. Management notified next morning
6. Permanent solution implemented within 24 hours

---

## 7. ACCESS REVIEW & AUDIT

### Quarterly Access Review

**Process**:
1. **Super Admin generates report**:
   - All active users
   - Role assignments
   - Store access mappings
   - Last login dates

2. **Review with HO Accountant**:
   - Identify inactive users (no login in 90 days)
   - Verify role appropriateness
   - Check for orphaned accounts

3. **Cleanup**:
   - Deactivate inactive users
   - Revoke unnecessary permissions
   - Update documentation

4. **Report to Management**:
   - Total users by role
   - Changes made
   - Security findings

**Schedule**: Every Jan 1, Apr 1, Jul 1, Oct 1

### Annual Security Audit

**Process**:
1. External security firm reviews:
   - Access controls
   - Role separation
   - Audit logs
   - Compliance with policies

2. **Findings reported** to management
3. **Remediation plan** created (if issues found)
4. **Re-audit** in 90 days (if critical issues)

---

## 8. ROLE-SPECIFIC POLICIES

### Super Admin

**Count**: Maximum 2 people

**Requirements**:
- 2FA mandatory
- Strong password (20+ chars)
- Password rotation: 60 days
- Activity review: Weekly

**Access**:
- System access: 24/7
- Locking window edits: 2 AM - 6:59 AM IST only
- Override actions: Require reason + approval log

**Accountability**:
- All actions auto-logged
- Overrides trigger email to management
- Quarterly review with CEO

### HO Accountant

**Count**: 1 primary, 1 backup

**Requirements**:
- 2FA recommended
- Password rotation: 90 days
- Working hours: 2 AM - 6:59 AM IST (locking window)

**Access**:
- View all stores: Always
- Lock/unlock: During locking window only
- Cannot edit data, create users

**Accountability**:
- Locking actions logged
- Late locks escalated to Super Admin
- Monthly performance review

### Store Manager

**Count**: 1 per store (primary), 1 backup per store

**Requirements**:
- Password rotation: 90 days
- Phone verification recommended

**Access**:
- Assigned store(s) only
- Current day editable
- Past 90 days read-only
- Cannot edit past days

**Accountability**:
- Submission = declaration of accuracy
- Late submissions flagged
- Monthly review by HO Accountant

### Store User

**Count**: Unlimited (as needed per store)

**Requirements**:
- Password rotation: 90 days
- Mobile app usage

**Access**:
- Current day only
- Cannot submit, view past data
- Cannot edit past days

**Accountability**:
- Transaction-level audit
- Manager oversight
- Suspicious activity flagged

### CA / Auditor

**Count**: As needed (time-bound)

**Requirements**:
- CA license verification
- Engagement letter required
- Expiry date mandatory

**Access**:
- Locked data only
- Read-only always
- Time-bound (auto-expire)
- Cannot edit anything

**Accountability**:
- All actions logged
- Export actions tracked
- Access reviews quarterly

---

## 9. VIOLATION & ENFORCEMENT

### Policy Violations

**Examples**:
- Sharing credentials
- Unauthorized access attempts
- Export logs replace any external sheet edits
- Bypassing locking window restrictions
- Creating users without approval

**Enforcement**:

**First Violation**:
- Warning email
- Logged in audit trail
- Manager notified
- Security training required

**Second Violation**:
- Account suspended (7 days)
- Written warning
- Management escalation
- Security re-training

**Third Violation**:
- Account permanently deactivated
- HR escalation
- Possible termination
- Legal action (if malicious)

### Security Incidents

**Examples**:
- Credential compromise
- Unauthorized access
- Data breach
- System manipulation

**Response**:
1. **Immediate**: Account locked
2. **Investigation**: Super Admin + IT + Management
3. **Remediation**: Reset passwords, audit logs, fix vulnerability
4. **Reporting**: Management, legal (if required)
5. **Prevention**: Update policies, training

---

## 10. CONTACT & ESCALATION

### Access Requests
- **Email**: access-request@zabnix.com
- **Response Time**: 4 hours (acknowledgment), 24 hours (completion)

### Emergency Access
- **On-Call Super Admin**: [Phone number]
- **Available**: 24/7
- **Response Time**: 30 minutes

### Security Incidents
- **Email**: security@zabnix.com
- **Phone**: [Emergency line]
- **Response Time**: Immediate

### Policy Questions
- **Email**: admin@zabnix.com
- **Owner**: Super Admin
- **Response Time**: 24 hours

---

## 11. APPENDIX

### Access Request Form (Template)

See Section 6 for email templates.

### Role Permission Matrix

See `plan.md` Section 1 for complete role definitions.

### Audit Log Query Examples

```sql
-- All Super Admin actions in last 7 days
SELECT * FROM audit_logs
WHERE user_id IN (SELECT id FROM users WHERE role = 'super_admin')
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- All access grants in last 30 days
SELECT * FROM audit_logs
WHERE action = 'user.created'
  AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- All auditor exports
SELECT * FROM audit_logs
WHERE action LIKE '%export%'
  AND user_id IN (SELECT id FROM users WHERE role = 'ca_auditor')
ORDER BY created_at DESC;
```

---

**Document Approval**:
- Created By: [@frpboy](https://github.com/frpboy)
- Reviewed By: Management
- Approved By: CEO
- Effective Date: 2024-12-22

**Next Review**: 2025-06-22 (6 months)

---

**Copyright © 2024 Zabnix. All Rights Reserved.**  
**Confidential - Internal Use Only**
