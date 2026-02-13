# Add Login System with Personal Word Collections

## Overview

Add a username/password signup and login system so each user has their own personal word collection. Words added by a user will be tied to their account, and the homepage will show only the logged-in user's words.

## What Changes

### 1. Enable Email Auth with Auto-Confirm

Since you want username + password (no email verification), we'll enable auto-confirm so users can sign in immediately after signing up. Users will enter an email (used as their identifier) and a password.

### 2. New Auth Page

A clean `/auth` page with a toggle between Sign Up and Sign In forms, matching the current minimal black-and-white aesthetic. Fields: email, password, and display name (on sign up only).

### 3. Auth Context

A shared auth context (`AuthProvider`) so all pages know if a user is logged in. This wraps the app and provides the current user + sign-out function.

### 4. Navbar Updates

- Show "Sign In" button when logged out
- Show user display name + "Sign Out" button when logged in
- Keep existing dark mode toggle

### 5. Personal Word Collections

- When adding a word on the homepage, attach the logged-in user's ID to the `user_id` column
- Homepage shows only the current user's words (filtered by `user_id`)
- Browse page also becomes personalised

### 6. Protected Routes

- Homepage word-adding requires login (show prompt if not logged in)
- Quiz uses the user's own words
- Admin page stays as-is (hardcoded password)

### 7. Database Changes

- Update RLS policies on `words` table so users can only delete/update their own words, but everyone can still read all words
- The `profiles` table and trigger already exist, so no changes needed there

---

## Technical Details

### Database Migration

```sql
-- Update words RLS: users can only update/delete their own words
DROP POLICY IF EXISTS "Anyone can update words" ON public.words;
DROP POLICY IF EXISTS "Anyone can delete words" ON public.words;

CREATE POLICY "Users can update own words"
  ON public.words FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own words"
  ON public.words FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update insert policy to require auth and set user_id
DROP POLICY IF EXISTS "Anyone can insert words" ON public.words;
CREATE POLICY "Authenticated users can insert words"
  ON public.words FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### Auth Configuration

- Enable auto-confirm for email signups (no verification email needed)

### New Files

- `src/contexts/AuthContext.tsx` -- AuthProvider with `onAuthStateChange` listener
- `src/pages/Auth.tsx` -- Sign up / Sign in page

### Modified Files

- `src/App.tsx` -- Wrap with AuthProvider, add `/auth` route
- `src/components/Navbar.tsx` -- Show auth state, sign out button
- `src/pages/Index.tsx` -- Filter words by user_id, require auth to add words, pass user_id on insert
- `src/pages/Quiz.tsx` -- Filter quiz words by current user's collection
- `src/pages/Browse.tsx` -- Keep as global browse (no filter by user)
- `src/pages/WordDetail.tsx` -- Show edit/delete only if word belongs to current user

### Profiles Trigger

The `handle_new_user` trigger function exists but the trigger itself is missing. We'll create it:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```