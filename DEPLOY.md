# Xravity Operations Guide

Current production domain: `https://xravity.xyz`

## Publishing Flow

```text
Decap CMS (authenticated) -> GitHub main -> Netlify build -> https://xravity.xyz
```

## Admin Publishing

Open `https://xravity.xyz/admin/` and sign in with Netlify Identity. Saving an entry commits directly to `main`; Netlify then builds the site automatically.

- Keep `Draft` enabled when an entry should remain out of the public site.
- Turn `Draft` off and save when the entry is ready to publish.
- A failed login or editor load now shows a retry action instead of leaving the page spinning.
- The editor still requires Identity authentication; the public site never accepts CMS writes directly.

## Admin Security Checklist

Keep these settings in Netlify Project configuration:

1. Identity → Registration → choose **Invite only**. This prevents random visitors from creating CMS accounts.
2. Identity → Users → use **Send reset password email** for account recovery.
3. Netlify User settings → Security → enable **two-factor authentication**.
4. Review Identity users periodically and delete accounts that should no longer publish.

Because Admin publishes directly to `main`, an accidental publish should be reverted from the GitHub commit history, then Netlify will rebuild the previous content. The commit messages are prefixed with `content:` or `media:` so these changes are easy to find.

## Future GitHub Backend Migration

The current repository intentionally keeps `git-gateway` so the existing Netlify Identity login continues to work. Git Gateway is deprecated by Netlify, so migrate it when you are ready to configure OAuth in Netlify.

The migration requires:

- enabling GitHub authentication/OAuth for the Netlify site;
- changing `public/admin/config.yml` to the GitHub backend with `repo: xravitycapital/xravity-site`;
- confirming that every CMS user has GitHub push access to the repository;
- testing login, media upload, direct publish, and rollback before removing Git Gateway.

Do not put a GitHub OAuth client secret or personal access token in this repository.

## Local Development

Run from the project folder:

```powershell
cd C:\Users\xwxle\Desktop\xravity-v2
$env:ASTRO_TELEMETRY_DISABLED='1'
npm.cmd run dev -- --host 127.0.0.1 --port 4321
```

Open:

```text
http://127.0.0.1:4321/
http://127.0.0.1:4321/resources/
```

## Production Build

```powershell
$env:ASTRO_TELEMETRY_DISABLED='1'
npm.cmd run build
```

## Domain Checklist

Make sure these all use `https://xravity.xyz`:

- `astro.config.mjs`
- `src/data/site.json`
- `src/components/StructuredData.astro`
- `public/robots.txt`
- `public/admin/config.yml`
- Netlify primary domain settings

The sitemap URL is:

```text
https://xravity.xyz/sitemap-index.xml
```

## Google Search Console

1. Open Google Search Console.
2. Add a Domain property for `xravity.xyz`.
3. Verify ownership with the DNS TXT record Google provides.
4. Submit sitemap: `https://xravity.xyz/sitemap-index.xml`.
5. Check Performance weekly:
   - search queries
   - impressions
   - clicks
   - average position
   - indexed pages

If you use HTML tag verification instead of DNS, set this Netlify environment variable:

```text
PUBLIC_GOOGLE_SITE_VERIFICATION=your-google-search-console-token
```

## Google Analytics 4

1. Create a GA4 property.
2. Create a Web data stream for `https://xravity.xyz`.
3. Copy the Measurement ID, such as `G-XXXXXXXXXX`.
4. Add it in Netlify environment variables:

```text
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

5. Trigger a new Netlify deploy.
6. Open GA4 Realtime to confirm visits are being recorded.

## Core Metrics

Track these every week:

- total users
- page views
- top pages
- traffic sources
- Google Search queries
- indexed pages
- posts or resources published

## Content Growth Plan

Focus on four repeatable columns:

- Building logs: Astro, Netlify, CMS, independent site operations
- Design notes: UI, typography, colors, visual taste
- Resources: tools, websites, templates, inspiration
- Personal notes: reflections, project logs, creative process

Publish with a simple rhythm:

- 1 useful article per week
- 3-5 resources per week
- 1 monthly site progress review

## Ad Readiness

Before applying for ads, keep these live and easy to find:

- About content
- Contact form or email
- Privacy Policy
- consistent navigation
- original articles
- useful resource pages
