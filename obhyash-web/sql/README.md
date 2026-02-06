# SQL Database Scripts

This folder contains all SQL scripts organized by domain/purpose.

## Structure

```
sql/
├── users/          # User management tables
├── subscriptions/  # Subscription & payment schemas
├── questions/      # Question bank tables
├── exams/          # Exam results & configs
├── reports/        # Reports, notifications, leaderboard
├── rls/            # Row Level Security policies
├── fixes/          # Database fixes & migrations
└── seed/           # Seed data scripts
```

## Folder Contents

### `/users` - User Management

- `recreate_users_table.sql` - Main users table schema
- `FRESH_START_USERS_TABLE.sql` - Clean slate users schema
- `create_missing_user.sql` - Insert missing user records
- `manual_insert_users.sql` - Manual user insertion
- `check_admin_user.sql` - Admin user verification

### `/subscriptions` - Subscription System

- `subscriptions_schema.sql` - Subscription tables schema
- `seed_subscription_plans.sql` - Default subscription plans
- `fix_subscription_rls.sql` - RLS policies for subscriptions
- `fix_subscription_fk.sql` - Foreign key fixes

### `/questions` - Question Bank

- `create_questions_table.sql` - **Main questions table** (use this!)
- `update_questions_schema.sql` - Migration for existing tables
- `populate_subject_groups.sql` - Subject/chapter/topic data

### `/exams` - Exam System

- `exam_schema_update.sql` - Exam configuration schema
- `recreate_exam_results_table.sql` - Exam results table

### `/reports` - Reports & Features

- `create_reports_table.sql` - Subject reports table
- `notifications_schema.sql` - Notifications system
- `leaderboard_database_setup.sql` - Leaderboard tables
- `advanced_features_schema.sql` - Additional features

### `/rls` - Row Level Security

- `rls_policy_fix.sql` - General RLS fixes
- `fix_admin_users_rls.sql` - Admin-specific policies
- `FINAL_RLS_FIX.sql` - Comprehensive RLS setup

### `/fixes` - Database Migrations & Fixes

- `fix_database_schema.sql` - Schema corrections
- `fix_all_constraints.sql` - Constraint fixes
- `complete_database_fix.sql` - Full database fix script
- `COMPLETE_FIX_RUN_THIS.sql` - One-click complete fix
- `add_stream_column.sql` - Add stream to tables
- `add_stream_to_subjects.sql` - Subject stream column

## Usage

Run scripts in Supabase SQL Editor in this order for a fresh database:

1. `users/FRESH_START_USERS_TABLE.sql`
2. `subscriptions/subscriptions_schema.sql`
3. `subscriptions/seed_subscription_plans.sql`
4. `questions/create_questions_table.sql`
5. `exams/exam_schema_update.sql`
6. `reports/notifications_schema.sql`
7. `rls/FINAL_RLS_FIX.sql`
