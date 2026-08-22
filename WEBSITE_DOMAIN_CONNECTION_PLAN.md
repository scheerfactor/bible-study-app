# Website And Domain Connection Plan

Prepared 2026-08-22 from live DNS and hosting checks.

## Verified Current State

- `https://fathersbusinessmasteryresources.com` serves the existing WordPress commerce site from Namecheap/LiteSpeed.
- The root domain resolves to `198.54.115.231`.
- `www.fathersbusinessmasteryresources.com` points to the root site.
- `https://bible-study-app-eight.vercel.app` serves the Bible study app from Vercel.
- The local repository is linked to the Vercel project `bible-study-app`.
- `study.fathersbusinessmasteryresources.com` has no current DNS target.
- The main domain is already known to the Father's Business Vercel team, but the `study` subdomain is not yet assigned to the Bible app project.

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

## Connection Steps

1. Add `study.fathersbusinessmasteryresources.com` to the Vercel `bible-study-app` project.
2. Record the exact DNS target Vercel provides.
3. In Namecheap Advanced DNS, create the requested `study` CNAME or A record.
4. Wait for Vercel domain verification and TLS issuance.
5. Update `NEXT_PUBLIC_SITE_URL` and all Supabase authentication redirect URLs to the verified custom domain.
6. Deploy the reviewed commit and run live release, feedback, authentication, Bible API, library, commentary, Strong's, and TSK checks.
7. Create the WordPress `/bible-study/` landing page and add the app link to navigation.
8. Keep the Vercel URL as a technical fallback, but publish and share the custom domain.

## Do Not Change Yet

- Do not point the root domain at Vercel.
- Do not remove the Namecheap root A record.
- Do not replace the current store.
- Do not change Supabase redirect URLs until the custom domain verifies.
- Do not advertise the custom URL until TLS and production checks pass.

## Action-Time Approval

Adding a Vercel project domain, changing Namecheap DNS, editing the public WordPress site, and deploying are external changes. Confirm the exact domain, DNS target, WordPress text, and release commit immediately before those actions.
