# Realtime Subscriptions

## Users
- Channel: `rt-users`
- Events: INSERT, UPDATE, DELETE
- Purpose: Keep Users list and Admin KPIs in sync

## Outlets
- Channel: `rt-outlets`
- Events: INSERT, UPDATE, DELETE
- Purpose: Reflect outlet changes across Admin and Users pages

## Role Approvals
- Channel: `rt-approvals`
- Events: INSERT, UPDATE, DELETE
- Purpose: Live updates for Pending Superadmin Role Approvals

## Daily Records
- Channel: `rt-daily-{outletId}`
- Filter: `outlet_id=eq.{outletId}`
- Purpose: Staff dashboard updates for day status and balances

## Transactions
- Channel: `rt-trans-{dailyRecordId}`
- Filter: `daily_record_id=eq.{dailyRecordId}`
- Purpose: Live transaction list and summary updates

## Presence
- Channel: `presence:{room}`
- Purpose: Show who is online in a given room (optional)

