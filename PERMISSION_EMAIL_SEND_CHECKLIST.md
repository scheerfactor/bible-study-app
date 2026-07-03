# Permission Email Send Checklist

Use this checklist before sending permission emails from `hello@fathersbusinessmasteryresources.com`.

## Before Sending

- Confirm the resource is not already public domain in the app.
- Confirm the author, publisher, ministry, or rights holder is the right contact.
- Ask for one title, one excerpt, one sermon, or one sample first.
- Do not ask for a whole catalog in the first email.
- Do not promise payment, revenue share, or public distribution before terms are known.
- Do not attach copyrighted files unless the rights holder requested them.
- Include the exact requested use.
- Include your email signature.

## First Email Should Include

- Who you are
- What Father's Business Bible Study is
- That the app is rights-first
- That nothing copyrighted is published without written permission
- The exact resource or type of resource
- The small first ask
- A request for the correct permissions process

## After Sending

Record:

- date sent
- contact name
- contact email or form used
- resource title
- requested use
- status
- next follow-up date

Also add a row to `data/library/acquisition/permission-reply-review-log.csv` with `No Response Yet`.

## Follow-Up Timing

- 7-10 days: one friendly follow-up
- 21 days: mark as needs follow-up or no response
- 45 days: keep as permission needed and do not import

Prepared follow-up drafts live in:

- `PERMISSION_FOLLOW_UP_DRAFTS.md`
- `data/library/acquisition/permission-follow-up-drafts.csv`

Do not send a follow-up if a reply has already arrived. Review the reply first.

## Next Ready-To-Review Batch

The next five permission requests are staged for Stephen review here:

- `PERMISSION_READY_TO_SEND_BATCH_2.md`
- `data/library/acquisition/permission-ready-to-send-batch-2.csv`

These are not sent. Stephen must verify the contact route, approve the message, and send each request manually before any status changes to `Permission Requested`.

## If They Say Yes

Before importing, confirm:

- full title
- edition
- permitted text/audio/video/excerpt uses
- free beta permission
- paid access permission
- TTS or audiobook rights
- attribution wording
- removal/revocation terms
- whether permission is temporary or ongoing

Save the written approval.

Then update `data/library/acquisition/permission-reply-review-log.csv`. Do not update `permission-targets.csv` to approved unless the reply clearly grants the exact use being requested.

## If They Say No

- Mark the resource as denied.
- Do not import it publicly.
- Keep metadata only if metadata/linking is allowed.
- Thank them politely.

## If The Reply Is Unclear

Mark as needs review. Do not import.

Use `PERMISSION_REPLY_REVIEW_WORKFLOW.md` to classify unclear replies before taking any public-library action.
