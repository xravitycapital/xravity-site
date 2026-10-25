# Cloudflare migration — preview only

## Scope and safety

This branch (`cloudflare-preview`) is intentionally **not merged into main**.
The existing Worker is `xravity-site` in account
`5efe188fcbc8bfe8dc54de29cb77a35a`. Sign in to Cloudflare using the existing
**GitHub login** (account label: `Xravity@foxmail.com's Account`). Do not create
a replacement account, API key, or Worker just because the login looks empty.

Production `xravity.xyz` still uses Netlify. No DNS, production-branch,
Netlify build toggle, administrator, password, or paid plan changes are made
by this branch. The other Workers and download site are out of scope.

## Build and preview

- Node.js 22 or later; `npm ci`.
- `npm run check` builds the unchanged production assets in `dist`, generates
  a separate `dist-cloudflare`, runs content/logic/security tests, and checks
  the Worker against generated Wrangler runtime types.
- `npm run preview:cloudflare` runs local Worker + static assets on port 8787.
- Cloudflare Builds is already connected to `xravitycapital/xravity-site`:
  production branch `main`, build `npm run build`, production command
  `npx wrangler deploy`, non-production command `npx wrangler versions upload`.
  Non-production builds are enabled. Pushing this branch must upload a version,
  **not deploy it to production**. Check both build logs and the live deployment.
- Intended stable version alias:
  `https://cloudflare-preview-xravity-site.xravity.workers.dev`.
  If Cloudflare does not automatically generate the branch alias, set the
  non-production version command to
  `npx wrangler versions upload --preview-alias cloudflare-preview`.
  Never run `wrangler deploy` from this branch.
- `__preview.json` exposes only build commit, time, mode, and preview branch.
  Preview robots and headers request no indexing. This is not access control:
  public content remains public, and the repository is public.

## Existing Admin accounts

Generated preview configuration saves **only to `cloudflare-preview`**. Source
`public/admin/config.yml` stays on `main` for the existing formal site.
The preview shows an explicit banner and branch status. Existing Netlify
Identity and Git Gateway remain authoritative for authentication and writes.
The Worker has no administrator credential and does not mint tokens.

Only `/.netlify/identity/*`, Git Gateway settings, and
`/.netlify/git/github/*` are forwarded to the fixed original Netlify site.
Authenticated writes require same origin. Bearer tokens remain validated by
Netlify; private responses are streamed, never cached, and stripped of CORS
and cookie headers. URLs, bodies and credentials are not logged.

Sessions are origin-specific. The owner may need to sign in once on the preview
origin with their **website Admin** account (not their Cloudflare login).
Password entry/reset and any verification are done by the owner, not copied
from browser storage or exchanged in chat.

## Contact form

`xravity.netlify.app/` returns a canonical 301 on form POST, so it is not a
valid receipt acknowledgement. The Worker instead uses the existing published
deploy permalink `6addd771a99d20b6b49a286d--xravity.netlify.app/`.
One clearly labeled integration test returned 200 and appeared in Netlify's
contact submissions on October 25, 2026. Retain that deployment while using
this endpoint; deletion/retention changes require revalidation or a different
contact backend. Never forward to `xravity.xyz` after cutover: it will point
back to Cloudflare rather than Netlify.

Forms, Identity and Git Gateway still depend on Netlify availability and
applicable quotas; this is not an unlimited or dependency-free backend.

## Acceptance before any domain switch

- Uploaded preview version / branch alias works, and active production version
  remains unchanged.
- Both languages/themes/particle effects/video, mobile layout, Blog and resources.
- Anonymous API calls denied; registration stays invite-only.
- Owner login, editor, existing content, save test article to preview branch,
  subsequent automatic build, and visible preview update.
- Media upload and account-recovery links (recovery mail still targets original
  site settings unless separately adapted).
- Contact form receipt verified in Netlify (not only HTTP 200).
- With owner approval, default-branch `giscus.json` now permits only the exact
  verified preview origin in addition to the existing formal/local origins
  (`7e3570ce289c8920b0e63548aa000ae8b49963ad`). No wildcards or new app permissions.
  Verify the actual embedded discussion before treating comments as accepted.
- Identity callback routing preserves search parameters before the fragment,
  stays on the same origin, and does not store tokens. Unit coverage is not a
  substitute for an owner-completed recovery email / password-reset test.
- GA4 must stay off on preview/Admin; canonical URLs keep the formal domain.
- Revisit dependency audit warnings before production migration. Existing Astro
  major-version advisories are not solved by moving static hosting; do not run
  a forced major upgrade as part of deployment configuration.

Only after acceptance: decide on production config, merge/review, switch the
formal domain, verify HTTPS/redirects/auth again, then stop duplicate Netlify
production builds. None of those cutover steps is automatic in this branch.

## Verification record — October 25, 2026

- Existing owner account saved a temporary article and uploaded cover through
  the preview CMS. The automatic build published both on the preview alias.
  The two test-only files were removed in a follow-up commit; both now return
  404 and the Blog/RSS contain only the existing welcome article. No content
  was added to main. CMS deletion itself was not verified.
- The Giscus embed renders its reaction control, comment editor and GitHub
  login link on the preview alias after the approved exact-origin addition.
  No public test comment was posted.
- Platinum/ink light surfaces retain the existing composition and original
  particle implementation. At 390px, Chinese and English headline height and
  total hero height match; 320px, 430px and desktop overflow checks pass.
  Dark/shared layout and typography CSS remain unchanged.
- Build, bilingual content validation, 29 logic tests and Worker type checking
  pass. Light palette tests cover normal-text contrast on all three surfaces.
- Domain/DNS cutover, owner-completed recovery and the production configuration
  remain separate acceptance work, not implied by a successful preview build.
