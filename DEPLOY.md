# Xravity Operations Guide

Production: `https://xravity.xyz` · Repository: `xravitycapital/xravity-site`

## Publishing Flow

```text
Decap CMS (existing Netlify Identity + Git Gateway) → GitHub main → Cloudflare Workers Builds → xravity.xyz
```

This is the live production architecture, verified on October 25, 2026 (America/Los_Angeles). GoDaddy delegates DNS to `kallie.ns.cloudflare.com` and `yisroel.ns.cloudflare.com`. Cloudflare Universal SSL is active for the apex and first-level subdomains. Only the apex A and www CNAME are proxied; mail and `_domainconnect` records remain DNS-only. Registration and renewal remain at GoDaddy.

The apex uses Worker Route `xravity.xyz/*`, persisted in `wrangler.jsonc`. A Cloudflare Single Redirect matches the exact host `www.xravity.xyz` and returns 308 to `https://xravity.xyz` plus the original path and query. Always Use HTTPS redirects HTTP requests. Keep the original apex A and www CNAME values for rollback; the Worker route serves the public frontend without fetching the old Netlify origin.

A real authenticated Admin **立即发布** operation re-saved the welcome article, producing main commit `d2ad8a1f3c52818bf6f0d3700a9f68b9cf62d22c`. GitHub CI passed and the public hostname's `/__release.json` returned that exact production/main commit after automatic deployment. The article's wording was unchanged; Decap normalized Markdown/YAML and added its missing explicit `draft: false` field. No test article was published. A successful save alone still does not prove deployment: verify DNS, TLS, response headers and the current release marker for every future release.

Keep the Netlify project, `netlify.toml`, existing Identity users, Git Gateway, and the published Forms deploy `6addd771a99d20b6b49a286d`. Cloudflare serves the frontend and forwards only the fixed Identity/Git Gateway paths to `xravity.netlify.app`; it does not create new administrator accounts or grant anonymous repository access. Contact forms on all pages use `/api/contact`, forwarded to the retained Forms deploy. Domain registration and renewal stay at GoDaddy; changing DNS hosting is not a registrar transfer.

Workers Builds deploys `main` with `npm run build` and `npx wrangler deploy`. Non-production builds use `npx wrangler versions upload`. The build script generates production assets only for `WORKERS_CI_BRANCH=main`; `cloudflare-preview` remains isolated, saves CMS changes to that branch only, and excludes previews from indexing. Local production-bundle checks can use `CLOUDFLARE_BUILD_MODE=production`. Preserve the existing encrypted Worker secrets; no new API token is needed in the public repository.

## Admin Publishing

Open `https://xravity.xyz/admin/` and sign in with the existing invited Netlify Identity account. The maintenance overview provides content counts, analytics, build history, comments, and registration settings. Counts are generated at build time, not live visitor totals. No analytics run on Admin.

Choose **进入内容编辑器** to open the Chinese Decap editor. Returning to the overview keeps the editor mounted, but closing/reloading the tab can lose unsaved changes. Saving commits directly to `main`; Cloudflare then builds automatically. Saving successfully does not mean the build has finished.

- Keep `Draft` enabled for unpublished articles; disable it and save to publish.
- For an older imported article whose Draft control looks off but is reported as missing, toggle it on and back off before publishing. This writes an explicit `false` without changing the article's public status. The existing welcome article has already been normalized this way.
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

1. Confirm the commit's GitHub checks, including **Workers Builds: xravity-site** and **build**, then verify the same production commit at `/__release.json` (`mode: production`, `branch: main`). Netlify builds may remain paused due to its free-plan quota; they are not the Cloudflare publication signal.
2. Compare production HTML/CSS asset hashes with the fresh local build; do not equate a successful push with a completed deployment.
3. Check Home, Vision, Blog, Resources, and Admin in a real browser. Test both UI languages and the dark-only layout at mobile widths. Public pages must be indexable; Admin/API responses must remain private and uncached. Check that the homepage and vision contact forms both use the Cloudflare endpoint.
4. If a release is wrong, revert the specific commit through normal Git history and let Cloudflare rebuild. Never reset shared `main` destructively. For a hosting rollback, retain the pre-cutover GoDaddy zone export and the original Netlify origin. Restore only the intended web records or previous nameservers; preserve mail/verification records and consider DNS propagation and certificates before changing delegation.

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

Node 22 is used by CI. The local dev server may choose the next port if 4321 is busy; read its output. Local tests do not send GA4 events. Localhost is for layout previews, not production publishing. Perform real login/publishing checks on `https://xravity.xyz/admin/` or the same-origin Cloudflare preview Admin; do not weaken CORS or authentication for a preview.

## Domains and Search

Keep the canonical domain consistent in `astro.config.mjs`, `src/data/site.json`, structured data, robots, CMS, Netlify domain configuration, DNS, and the Identity endpoint. Sitemap: `https://xravity.xyz/sitemap-index.xml`.

Use Google Search Console domain verification and submit that sitemap. If HTML-tag verification is needed, set `PUBLIC_GOOGLE_SITE_VERIFICATION` in the production build environment and rebuild. Review search queries, indexing, top pages, and broken links regularly.
