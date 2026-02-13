
# Repurpose Admin Page into Analytics Dashboard

## Overview
Replace the current word management UI on the `/admin` page with an analytical dashboard that shows user activity metrics. The password-protected gate stays in place.

## What the Dashboard Will Show

### 1. Summary Stat Cards (top row)
- **Total Users** -- count of profiles
- **Total Words** -- count of all words
- **Words Today** -- words added in the last 24 hours
- **Avg Words/User** -- total words divided by total users

### 2. Words Added Over Time (line/area chart)
- Recharts AreaChart showing daily word additions over the last 30 days
- Data sourced by grouping `words.created_at` by date

### 3. Difficulty Distribution (pie/donut chart)
- Recharts PieChart breaking down words by easy/medium/hard

### 4. Recent Activity Feed
- A table listing the 20 most recently added words with columns: word, difficulty, user display name, date added

### 5. Top Users Table
- Table showing users ranked by word count, with columns: display name, word count, latest activity date

## Technical Approach

### Edge Function: `admin-dashboard`
A new backend function (password-protected, `verify_jwt = false`) that uses the service role key to bypass RLS and aggregate data across all users. It will return a single JSON payload containing:
- `stats`: total users, total words, words today, avg per user
- `wordsByDate`: array of `{ date, count }` for the last 30 days
- `difficultyBreakdown`: array of `{ difficulty, count }`
- `recentWords`: last 20 words joined with profiles for display name
- `topUsers`: top 10 users by word count with display names

This avoids RLS issues that currently block the admin from seeing other users' data.

### Frontend Changes

**`src/pages/Admin.tsx`** -- Full rewrite:
- Keep the password login gate (unchanged)
- Replace the word-list CRUD UI with the dashboard layout
- Use a single `useQuery` call to fetch from the `admin-dashboard` edge function
- Render stat cards, charts (Recharts -- already installed), and tables using existing UI components (`Card`, `Table`, `Badge`)

**`supabase/config.toml`** -- Add entry:
```
[functions.admin-dashboard]
verify_jwt = false
```

### Files Created
- `supabase/functions/admin-dashboard/index.ts`

### Files Modified
- `src/pages/Admin.tsx` (rewritten to dashboard)
- `supabase/config.toml` (register new function)

### Dependencies
No new dependencies needed. Recharts and all UI components are already installed.
