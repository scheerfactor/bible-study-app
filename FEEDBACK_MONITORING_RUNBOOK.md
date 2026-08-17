# Feedback Monitoring Runbook

Public destination: `hello@fathersbusinessmasteryresources.com`

Private queue: Supabase `public.beta_feedback`

## Owner Routine

During private and founding beta:

1. Check the private queue and ministry inbox every weekday.
2. Acknowledge partnership inquiries and reports with an email address within two business days.
3. Copy reproducible bugs into the current launch checklist before adding features.
4. Treat optional email addresses and report text as private user data.
5. Do not paste private feedback into public issues, demonstrations, or release notes.
6. Delete disposable delivery-audit rows immediately after each probe.

## Queue Check

Run this only in the authenticated Supabase SQL Editor or an equivalently protected admin connection:

```sql
select
  id,
  created_at,
  category,
  passage_or_resource,
  message,
  optional_email
from public.beta_feedback
order by created_at asc;
```

The public browser roles have insert-only access. They cannot list, read, update, or delete feedback.

## Delivery Audit

The static contract check is safe to run locally:

```bash
npm run audit:feedback
```

Before a release, provide the project URL, publishable or legacy anonymous key, and service-role key as process environment variables, then run:

```bash
npm run audit:feedback:live
```

The live audit submits one marked row through the anonymous client, removes it through the server-only service role, and verifies that cleanup succeeded. Never place the service-role key in a `NEXT_PUBLIC_` variable or commit it to the repository.

## Failure Rule

If direct queue delivery fails, the form must say so plainly and offer the pre-addressed email fallback. Do not claim that feedback was sent when it was only copied to the clipboard.
