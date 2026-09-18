# Teaching archive review release — September 18, 2026

The tested `codex/teaching-archive-rc1` branch is published to `scheerfactor/bible-study-app`.

Review comparison (includes the two preceding local lesson/PWA commits):
https://github.com/scheerfactor/bible-study-app/compare/codex%2Fpre-class-countdown...codex%2Fteaching-archive-rc1

A pull request has not been created: the available browser session is signed out of GitHub. Repository SSH push works; HTTPS write credentials are unavailable. No merge or production promotion was performed.

The existing Vercel destination was verified read-only:

- Project: `st396-7775s-projects/bible-study-app`
- Project ID: `prj_XdMj3hDoeV1v2HLlZui3eX0FdA2U`
- Framework: Next.js; Node 24.x

`vercel.json` now explicitly runs `npm run build -- --webpack`. This includes the npm postbuild step that creates the offline service worker, matching the already-tested local production build.

The dry-run file audit initially included 1,859 files totaling 1,318,785,407 bytes. The largest unused source-batch directory was `data/strongs/mapping-batches` (about 481 MiB). It is excluded from deployment; runtime code reads generated `mappings-by-chapter` shards through the existing content-storage resolver instead. Runtime lexicon batches, directly imported commentary/TSK data, public assets and the existing remote-content paths are retained. Local environment files and TypeScript build cache are explicitly excluded.

Preview deployment is pending explicit user approval. Automatic approval review rejected the upload because destination authorization had not been established; no upload was performed by the rejected command. The project owner and identity were subsequently verified. The user has been asked to approve source upload to this exact existing project for preview only.

No Supabase development branches currently exist for the Bible Study project. The archive migration remains unapplied. Hosted authenticated two-device sync therefore remains unverified; use an isolated review database before claiming that release gate. Creating a paid Supabase branch requires its separate cost-confirmation flow. Production schema/data remain unchanged.

Next step after preview approval: deploy preview, check `/sw.js`, manifest and KJV APIs, and run the offline browser regression against the preview. Then establish the isolated database and verify account sync/retry/sign-out before production release.
