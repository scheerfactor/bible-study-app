# Website And Domain Connection Plan

Prepared and verified 2026-08-22 from live DNS, hosting, deployment, and authentication checks.

## Verified Current State

- `https://fathersbusinessmasteryresources.com` serves the existing WordPress commerce site from Namecheap/LiteSpeed.
- The root domain resolves to `198.54.115.231`.
- `www.fathersbusinessmasteryresources.com` points to the root site.
- `https://study.fathersbusinessmasteryresources.com` serves the production Bible study app from Vercel with valid configuration and TLS.
- `https://bible-study-app-eight.vercel.app` remains the technical Vercel fallback.
- The local repository is linked to the Vercel project `bible-study-app`.
- Namecheap points the `study` CNAME to `6651c33ccfc197c6.vercel-dns-017.com`.
- Vercel production deployment `7fAngvVUiEftJGr4vA4ULswiR14T` is ready and assigned to the custom domain.
- Vercel sets `NEXT_PUBLIC_SITE_URL` to `https://study.fathersbusinessmasteryresources.com` for production and preview deployments.
- Supabase uses the custom domain as its Site URL and allows the exact production sign-in return `https://study.fathersbusinessmasteryresources.com/?open=settings`.
- Existing Vercel preview, fallback, localhost, and local test redirect URLs remain allowed.

## Recommended Public Structure

Keep the current store at:

- `https://fathersbusinessmasteryresources.com`

Connect the Bible app at:

- `https://study.fathersbusinessmasteryresources.com`

Add a WordPress navigation item and landing page at:

- `https://fathersbusinessmasteryresources.com/bible-study/`

The landing page should explain the product, show verified screenshots or a short demonstration, link to the public partners and rights pages, invite beta feedback, and open the app at the `study` subdomain.

## Why A Subdomain First

- It does not replace or interrupt the existing WordPress store.
- Vercel can serve the Next.js application directly with its own TLS certificate.
- App routes, APIs, authentication callbacks, and future entitlements remain under one app origin.
- WordPress can continue handling the public brand, existing products, articles, and commerce while the app matures.
- A reverse-proxied `/bible-study` application path would require more fragile WordPress/server routing and would complicate Next.js API paths and authentication.

## Connection Status

1. Completed: add `study.fathersbusinessmasteryresources.com` to the Vercel `bible-study-app` project.
2. Completed: add the exact Vercel CNAME target in Namecheap Advanced DNS.
3. Completed: verify the domain and TLS in Vercel.
4. Completed: set `NEXT_PUBLIC_SITE_URL` to the verified custom domain.
5. Completed: set the Supabase Site URL and exact production authentication redirect.
6. Completed: deploy reviewed commit `ad5311a` and verify the live app, feedback page, partners page, and production build.
7. Pending: create the WordPress `/bible-study/` landing page and add the app link to navigation.
8. Pending: restore GitHub terminal authentication and push the reviewed branch history.

## Do Not Change Yet

- Do not point the root domain at Vercel.
- Do not remove the Namecheap root A record.
- Do not replace the current store.
- Do not remove the Vercel fallback or development redirect URLs without a separate authentication audit.
- Do not publish the WordPress landing page until its copy, links, screenshots, and release status are reviewed.

## Action-Time Approval

Adding a Vercel project domain, changing Namecheap DNS, editing the public WordPress site, and deploying are external changes. Confirm the exact domain, DNS target, WordPress text, and release commit immediately before those actions.
