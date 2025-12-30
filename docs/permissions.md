# Permissions Matrix

Action | Roles | Scope
------ | ----- | -----
Create User | superadmin, master_admin | global
Assign Outlet | superadmin, master_admin; outlet_manager (own outlet) | outlet
Update Role | superadmin, master_admin; outlet_manager (staff/manager only, own outlet) | outlet/global
Delete User | superadmin, master_admin; outlet_manager (staff only, own outlet) | outlet/global
Create Transaction | staff/manager (draft, own outlet); superadmin/master_admin | outlet/global
Update Transaction | staff/manager (own outlet, draft); superadmin/master_admin | outlet/global
Delete Transaction | staff/manager (own outlet, draft); superadmin/master_admin | outlet/global
Submit Day | manager/staff (own outlet) | outlet
Lock Day | ho_accountant/superadmin/master_admin | global
Unlock Day | master_admin | global

# Presence Visibility
- Default: same-outlet only
- Auditors/admins: cross-outlet

