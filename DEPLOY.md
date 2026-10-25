# Xravity Operations Guide

Production: `https://xravity.xyz` · Repository: `xravitycapital/xravity-site`

## Publishing Flow

```text
Decap CMS (Netlify Identity + Git Gateway) → GitHub main → Netlify production deploy → xravity.xyz
```

Netlify currently serves the production domain and provides Identity and Git Gateway. Verified on October 25, 2026: the Netlify project showed the current main commit as Published, production responses came from Netlify Edge, and www points to xravity.netlify.app. Cloudflare Workers Builds also runs on repository commits, but its successful check alone does not prove the public domain has changed. Keep `netlify.toml` and the existing auth services in place.

## Admin Publishing

Open `https://xravity.xyz/admin/` and sign in with the existing invited Netlify Identity account. The maintenance overview provides content counts, analytics, build history, comments, and registration settings. Counts are generated at build time, not live visitor totals. No analytics run on Admin.

Choose **进入内容编辑器** to open the Chinese Decap editor. Returning to the overview keeps the editor mounted, but closing/reloading the tab can lose unsaved changes. Saving commits directly to `main`; Netlify then builds automatically.

- Keep `Draft` enabled for unpublished articles; disable it and save to publish.
- Drafts still exist in the public Git repository. Never store secrets or private information in drafts, settings, or uploads.
- The content-language selector describes the actual article/resource language. The website UI language does not translate authored content.
- Decap is pinned to `3.17.1` and the Identity widget to `2.0.3`, with fallback CDNs, bounded loading, and visible errors. Update deliberately and test login, preview, media, save, and publish after changes.
- Rich-text previews are sanitized. The public site never accepts unauthenticated CMS writes; Git Gateway enforces server-side authorization.
- If the editor fails, the maintenance overview remains available. Check connectivity and the browser console, then retry. Do not repeatedly save when a build is failing.
- Some settings are retained for compatibility with the old homepage. Hints identify text now controlled by `public/data/translations.json`; changing legacy text does not override the current bilingual UI.

## Admin Security Checklist

On October 25, 2026, Netlify Identity registration was changed to **Invite only** with email confirmation still required. Anonymous `/.netlify/identity/settings` returned `disable_signup: true` and `autoconfirm: false`. This preserves existing accounts and login methods.

1. Identity → Registration: keep **Invite only**. The maintenance overview reads the actual setting and warns if it changes or cannot be checked.
2. Identity → Users: send an invitation only to trusted publishers. Use **Send reset password email** for recovery; do not share passwords in chat or commits.
3. Netlify User settings → Security: enable **two-factor authentication**. Account-level 2FA does not replace reviewing individual Identity users.
4. Review Identity users periodically and revoke accounts that should no longer publish.
5. Production Admin responses should remain `no-store`, `noindex, nofollow, noarchive`, `nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`. Verify actual response headers, not only repository configuration.

## Release Verification and Rollback

Run `ASTRO_TELEMETRY_DISABLED=1 npm run check` before pushing. This builds all routes, validates content/config/translations, and runs analytics/admin logic tests.

After pushing `main`:

1. Confirm the commit's GitHub checks, including **Workers Builds: xravity-site** and **build**, then verify that Netlify Deploys shows the same main commit as **Published**.
2. Compare production HTML/CSS asset hashes with the fresh local build; do not equate a successful push with a completed deployment.
3. Check Blog, Resources, and Admin in a real browser. Test both UI languages and light/dark themes at mobile widths.
4. If a release is wrong, revert the specific commit through normal Git history and let Netlify rebuild. Never reset shared `main` destructively.

CMS commits use `content:` or `media:` prefixes. Inspect commit history for accidental publishes and revert only the relevant change.

## Google Analytics 4 — Phase 1

The existing public measurement ID is `G-60NSLRCLLD`, overridable with `PUBLIC_GA_MEASUREMENT_ID` in the Netlify production build environment. It is not an API credential. If retaining a parallel Cloudflare build, keep its public build variables consistent as well.

The Admin overview links to `https://analytics.google.com/analytics/web/`. Select the xravity.xyz property/data stream using your existing Google account. This release does **not** request GA4 read-data access, embed private reports, or invent totals when data is unavailable.

| Event | Meaning | Not equivalent to |
| --- | --- | --- |
| `page_view` | Public production page view | Unique person |
| `download_entry_click` | Tiljot beta download-entry button click | Password accepted / file delivered |
| `download_click` | Direct file-link click, including the vision film | Completed download / installation |
| `resource_open` | Curated resource-link click | Time spent on the external site |

View recent events in **Realtime** and processed counts in **Engagement → Events**. Report processing is delayed; absence does not mean zero. Custom event parameters include a query/fragment-free `link_url`, and where applicable `item_id` or `file_extension`. Register event-scoped custom dimensions in GA4 if you later want these fields in custom reports; this release does not change property settings.

Privacy guards:

- Run only on `xravity.xyz` / `www.xravity.xyz`, never localhost, preview domains, or `/admin`.
- Skip GA4 when Do Not Track or Global Privacy Control is enabled.
- Disable Google signals and advertising-personalization signals in site configuration.
- Strip query strings and fragments from configured page URLs/referrers and custom link events. Do not send form values, search terms, passwords, invitation tokens, or signed download URLs.
- Blockers, privacy preferences, and failed requests can reduce counts. Repeated clicks are not deduplicated into unique downloaders.

Tiljot's password-gated download service is separate. Genuine file-delivery/completion metrics require server-side instrumentation there and careful event definitions. They are not part of this release. Adding real GA4 totals inside Admin later requires a server-side, authenticated, read-only data integration; never put service-account keys or OAuth secrets in static frontend files.

## Future GitHub Backend Migration

The repository intentionally keeps `git-gateway` so existing Netlify Identity login continues working. Git Gateway is deprecated by Netlify. Plan a separate migration before removing it:

- Configure an appropriate server-side GitHub OAuth flow.
- Change `public/admin/config.yml` to the GitHub backend and `repo: xravitycapital/xravity-site`.
- Confirm that every CMS user has the necessary repository access without broadening it unnecessarily.
- Test login, media upload, preview, direct publish, and rollback before retiring Git Gateway.

Do not put OAuth client secrets, personal access tokens, or admin credentials in this repository.

## Blog Comments

Giscus is installed only on `xravitycapital/xravity-site`, using the **Announcements** discussion category. Readers sign in with GitHub to comment, reply, and react. No GitHub password is stored by the website.

- Moderate at `https://github.com/xravitycapital/xravity-site/discussions`.
- Keep each `blog/<slug>` discussion key stable when changing titles or UI languages.
- `giscus.json` restricts embed origins. Add a new production domain there before moving domains.
- Comments load near the viewport and follow the website language/theme. Readers can retry or open Discussions if the widget is blocked.
- Removing the frontend component does not delete existing discussions.

## Local Development

From this repository:

```sh
npm ci
ASTRO_TELEMETRY_DISABLED=1 npm run dev -- --host 127.0.0.1 --port 4321
ASTRO_TELEMETRY_DISABLED=1 npm run check
```

Node 20 is used by CI. The local dev server may choose the next port if 4321 is busy; read its output. Local tests do not send GA4 events. Localhost is for layout previews, not production publishing: the Identity service may reject cross-origin settings requests. Perform real login/publishing checks on `https://xravity.xyz/admin/`; do not weaken CORS or authentication for a preview.

## Domains and Search

Keep the canonical domain consistent in `astro.config.mjs`, `src/data/site.json`, structured data, robots, CMS, Netlify domain configuration, DNS, and the Identity endpoint. Sitemap: `https://xravity.xyz/sitemap-index.xml`.

Use Google Search Console domain verification and submit that sitemap. If HTML-tag verification is needed, set `PUBLIC_GOOGLE_SITE_VERIFICATION` in the production build environment and rebuild. Review search queries, indexing, top pages, and broken links regularly.
