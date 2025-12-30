-- Enable realtime on required tables
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table outlets;
alter publication supabase_realtime add table role_approvals;
alter publication supabase_realtime add table daily_records;
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table audit_logs;

