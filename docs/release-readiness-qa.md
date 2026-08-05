# Release Readiness QA

Task 110 adds a blocking release audit for public and member-facing content. Run
`npm run test:release` against a production build before release. CI starts the
application, runs the audit, and uploads `.tmp/release-readiness-audit.json`.

## What The Gate Checks

- Public fallback copy cannot contain placeholder language, example URLs,
  legacy tier prices, or obsolete Professional/Enterprise labels.
- Public enterprise surfaces use Cabeus Council, keep Scout at `$25,000`, and do not
  expose Stripe, checkout, invoices, public payment, or `mailto:` workflows.
- Cabeus Council intake retains the business-email denylist, server-side Resend
  adapter, `info@potomacdb.com` routing, safe Reply-To, and Free-plan preflight.
- LinkedIn uses the approved Cabeus Explorer company URL. Configured Substack
  and podcast URLs must pass the existing HTTPS host allowlists. X/Twitter and
  example social destinations fail the gate.
- Tracker and contract-award loaders retain citations, source freshness or
  review timestamps, value-basis state, and separately gated analyst estimates.
- Carousel, content, CTA, and sponsor paths retain expiration metadata and
  suppress expired promotional material.
- Anonymous member/tracker requests return to `/request-access` or profile
  completion. Public routes must not unexpectedly redirect into member gates.
- Critical rendered routes are checked for HTTP failures, broken internal links,
  visible placeholders, serious/critical accessibility violations, unsafe link
  schemes, and mobile horizontal overflow.

## Resolving A Blocker

1. Open `.tmp/release-readiness-audit.json` and find the failing `location`.
2. For copy or tier failures, update the CMS record or reviewed fallback source;
   do not weaken the prohibited-term pattern to permit temporary copy.
3. For citation, freshness, value-basis, or expiration failures, complete the
   source/review metadata and republish the record through the editor workflow.
4. For gated-data failures, fix the loader/RLS split so public payloads omit the
   protected field. Hiding an already-delivered value with CSS is not a fix.
5. For broken links, replace the destination with its canonical HTTPS or valid
   internal route and verify the destination before republishing.
6. For Cabeus Council or Resend failures, restore the server-side contract-discussion
   workflow and Free-plan controls. Do not substitute client email or checkout.
7. Rerun `npm run test:content-expiration`, `npm run test:release`, and the normal
   lint/test/build suite. Record any external-source outage as a blocked task;
   do not bypass a repeatable application failure.
