# Xravity Operations Guide

Current production domain: `https://xravity.xyz`

## Publishing Flow

```text
Decap CMS / local edits -> GitHub main -> Netlify build -> https://xravity.xyz
```

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
