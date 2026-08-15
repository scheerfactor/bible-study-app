# Mailbox Bounce Reconciliation - 2026-08-14

## Purpose

Separate later application-test delivery failures from the July 2026 permission-outreach record so that unrelated bounces do not change any author, ministry, or publisher rights status.

## Source Reviewed

- Mailbox: Namecheap Private Email inbox for the project account
- Review date: 2026-08-14
- Evidence type: delivery-status notices opened in the authenticated mailbox

## Reconciled Notices

| Notice date | Mailbox message ID | Failed recipient | Delivery result | Rights-pipeline classification |
|---|---:|---|---|---|
| 2026-07-03 | 41 | `st396@hotmail.com` | Rejected as probable spam | Exclude - application test address |
| 2026-07-05 | 47 | `st396@hotmail.com` | Rejected as probable spam | Exclude - application test address |
| 2026-07-07 | 50 | `st396@hotmail.com` | Rejected as probable spam | Exclude - application test address |
| 2026-07-09 | 53 | `st396@hotmail.com` | Rejected as probable spam | Exclude - application test address |
| 2026-07-11 | 55 | `st396@hotmail.com` | Rejected as probable spam | Exclude - application test address |
| 2026-07-14 | 57 | `st396@hotmail.com` | Rejected as probable spam | Exclude - application test address |
| 2026-07-16 | 58 | `st396@hotmail.com` | Rejected because the sending domain had poor reputation | Exclude - application test address |
| 2026-07-18 | 60 | `st396@hotmail.com` | Rejected as probable spam | Exclude - application test address |
| 2026-07-22 | 61 | `st396@hotmail.com` | Rejected as probable spam | Exclude - application test address |

## Rights Conclusion

- These nine notices are not permission-request failures.
- They do not change any author, ministry, publisher, title, excerpt, cover, media, or licensing status.
- The three July 4 permission-outreach bounces remain separately mapped in `permission-email-send-log.csv` to John Goetsch, Striving Together, and Leonard Ravenhill / Voice of Life Ministries.
- No permission can be inferred from a delivery failure.
- No email was sent, retried, deleted, or otherwise modified during this reconciliation.

## Next Action

Keep application-email deliverability work separate from permission acquisition. Continue permission outreach only through verified official contacts and record each reply at the title and permitted-use level.
