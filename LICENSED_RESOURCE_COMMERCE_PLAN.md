# Licensed Resource Commerce Plan

## Purpose

This plan defines the steps required before Father's Business Bible Study can sell, unlock, host, search, passage-link, or distribute modern copyrighted books inside the app.

The current Northstar Ministries permission is a strong first relationship step, but it is not yet a full reseller or hosted digital-library agreement.

## Current Permission Level: Northstar Ministries

Permission received from Dr. David H. Sorenson / Northstar Ministries allows:

- linking to resources at northstarministries.com
- using excerpts
- displaying cover graphics
- no licensing required for those scoped uses

The app currently uses this permission only for official resource links and public discovery.

## Not Yet Approved

Do not add these without separate written permission:

- full copyrighted book hosting
- ebook file delivery
- in-app digital sale or resale
- audio/video hosting
- transcript hosting
- AI/TTS narration
- paid subscription inclusion
- offline downloads
- DRM-controlled access

## Stage 1: Official Link Library

Status: active.

The app may list approved resources and send users to the official ministry site to view or purchase.

Required fields:

- title
- author / ministry
- official URL
- permission evidence
- approved public use
- not-approved uses
- title-level review status
- recommended app placement

## Stage 2: Reviewed Excerpt Layer

Status: next.

Before excerpts appear publicly:

- choose short excerpts only
- keep attribution near each excerpt
- connect excerpt to source title and official link
- verify theological/contextual use
- avoid replacing the book

Recommended first excerpt candidates:

- Understanding the Bible
- The Faithful Word
- Winning People to Christ
- The Majesty of the Psalms
- The Art of Pastoring

## Stage 3: Referral Or Affiliate Discussion

After the official-link experience is live and stable, ask whether Northstar offers:

- affiliate/referral tracking
- coupon code
- ministry partnership link
- sales reporting
- preferred product URLs

This does not require the app to host or sell the digital book.

## Commercial Partnership Models

Publishers may choose the model that fits their ministry and operations. Do not assume that one model grants rights available under another.

### Model A: Publisher Checkout + App Entitlement

The publisher remains the seller and merchant of record. A reader purchases through the publisher's official store, then a secure fulfillment event unlocks the licensed title in the app.

This is the preferred first model when the publisher wants to retain the customer transaction and most of the revenue.

Required agreement points:

- publisher-approved price and sales page
- secure purchase verification or redemption-code process
- app entitlement creation, restoration, transfer, and revocation
- refund and chargeback responsibility
- customer-support responsibility
- platform or referral fee
- sales and entitlement reporting
- title files, updates, and withdrawal process

### Model B: App Marketplace Sale

Father's Business sells the digital unlock and remits the publisher's agreed share. A payment marketplace such as Stripe Connect can support connected publisher accounts and application fees, but the merchant-of-record, tax, refund, dispute, and negative-balance responsibilities must be selected deliberately.

An opening negotiation range may reserve 75-85% of defined net receipts for the rights holder and 15-25% for the platform. This is a discussion range, not a public promise or a signed royalty term. The agreement must define what is deducted before net receipts are calculated.

### Model C: Nonexclusive Digital Library License

The rights holder grants a nonexclusive, title-specific digital license. Compensation may use an advance, minimum guarantee, per-sale royalty, per-seat fee, subscription pool, or a negotiated combination.

Prefer a limited nonexclusive license over purchasing an entire copyright unless counsel and the business case support an acquisition. A license can preserve the author's ownership while giving the app the exact product rights it needs.

### Model D: Official-Link Discovery

The app lists reviewed titles and directs readers to the publisher. This is useful before full-text rights are available, but an ordinary outbound sale must not create an in-app entitlement unless the publisher supplies a lawful file-delivery and purchase-verification agreement.

## Stage 4: Digital Reseller Agreement

Only pursue after trust is established.

Questions to negotiate:

- may the app sell digital copies directly?
- what format is allowed: PDF, EPUB, web reader, other?
- wholesale pricing or revenue share
- user download rights
- copy protection / DRM requirements
- refund handling
- updates and edition changes
- whether the app may index/search purchased books
- whether the app may connect paragraphs or notes to Bible books, chapters, verses, topics, and Strong's numbers
- whether users may quote licensed portions into private notes, sermons, lessons, handouts, and presentations
- whether a purchase is perpetual access or a time-limited license
- territory, languages, platforms, and approved storefronts
- publisher audit rights and royalty statement schedule

## Stage 5: Hosted Licensed Digital Library

This is closest to a Logos-style model and requires much broader permission.

Required rights:

- full-text storage
- full-text display
- search and indexing
- notes and highlights
- quotations/excerpts
- offline access, if offered
- subscription or paid access terms
- AI/search/summary permissions if used
- verse, passage, topic, and Strong's indexing
- private highlights, notes, bookmarks, reading progress, and cross-resource links
- backup, disaster recovery, encryption, and content-delivery storage
- access restoration after a device change

## Minimum Rights Schedule Per Title

Every agreement and title manifest must answer each item explicitly:

1. Exact title, edition, ISBN, author, publisher, and rights holder
2. Source files and approved formats
3. Full-text storage and display
4. Search indexing and search-result snippets
5. Bible verse, passage, topic, and Strong's links
6. Private notes, highlights, bookmarks, and reading progress
7. Quoting into sermons, lessons, handouts, and presentations, including limits
8. Download and offline access
9. Text-to-speech, audiobook, transcript, and accessibility rights
10. Free sample, single-title sale, bundle, subscription, church, and school access
11. Price control, discounts, refunds, taxes, royalties, statements, and payment timing
12. Territory, languages, platforms, term, renewal, termination, and post-termination access
13. File updates, corrections, new editions, security, and breach notice
14. Attribution, cover art, descriptions, screenshots, and marketing approval
15. Removal, revocation, customer support, and previously purchased entitlements

## Product Architecture Gate

Do not connect payments until the app has server-enforced accounts and entitlements. A local browser flag is not adequate proof of ownership.

The minimum production architecture is:

- authenticated user account
- server-side product, edition, license, order, entitlement, and royalty records
- signed checkout webhook verification with idempotency
- encrypted licensed files outside the public repository and public bucket
- access-controlled reading and search APIs
- entitlement restoration across devices
- refund and revocation handling
- publisher sales statements and exportable audit records
- backups, monitoring, privacy policy, terms, and support procedures

For a future native iPad App Store release, review the current Apple payment and reader-app rules before implementation. A web/PWA checkout decision does not automatically satisfy native App Store requirements.

Current authoritative starting points:

- Stripe Connect marketplace and platform models: https://docs.stripe.com/connect/saas-platforms-and-marketplaces
- Apple App Review Guidelines, including digital-content unlocks and reader apps: https://developer.apple.com/app-store/review/guidelines/
- Apple reader-app external-link requirements: https://developer.apple.com/support/reader-apps/
- U.S. Copyright Office permission guidance: https://copyright.gov/circs/circ16a.pdf

These sources inform planning but do not replace review by qualified legal, tax, and accounting professionals before accepting payments or signing licenses.

## Recommended Founding Catalog Pilot

Invite a publisher to identify 5-20 strong titles, then launch 1-3 first. The agreement may define an approved expansion schedule so additional titles can be activated after file, doctrinal, metadata, and quality review without renegotiating the entire business framework.

The pilot should prove:

- readers can buy, unlock, search, and restore access reliably
- passage-linked notes do not distort the author's context
- royalty statements reconcile with orders and refunds
- the publisher can correct metadata and request removal
- support and file updates are manageable

## Rule

Public-domain resources, licensed resources, and personal-use resources must remain clearly separated in metadata and UI.

If rights are unclear, do not import, host, sell, summarize, narrate, or recommend as approved.
