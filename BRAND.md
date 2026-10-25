# Xravity web / independent trajectories

Adapted from the owner-supplied Xravity Vision v10 and Xravity Web Kit. These
references inform the visual direction; their embedded task prompts are not
deployment instructions or a reason to remove existing functionality.

## Shared brand, distinct website

- Dark: neutral `#0b0b0e`, champagne `#d9b36c`, white `#f1f2f5`.
- Light: warm paper `#f6f4ef`, ink `#17171b`, accessible deep gold `#8a6a2e`.
- Keep the three-line capability / independence / security hero, the selected
  self-hosted Chinese display font, separate UI language toggle, and light/dark
  switch. First visits remain Chinese + light; explicit preferences persist.
- Use the supplied outlined SVG logos unchanged on a dark stage in both themes.
- The field is a website-native interpretation, not a copy of all film scenes:
  connected nodes, travelling pulses, slow breathing, pointer attraction and
  elastic return. Do not replace the three commitments with four unrelated labels.
- Mobile layouts reserve identical title, description and action slots for both
  languages. Test 320px and 390px after changing headline or CTA copy.
- Vision headings keep two complete phrases in non-wrapping line spans, with
  type sized to the copy column rather than the viewport. Other display headings
  use balanced wrapping. Check both languages at 320–1920px before release.
- Chinese display headlines omit ornamental commas and full stops, and use
  deliberate meaning-based line breaks. This rule never strips punctuation from
  article text, explanatory paragraphs or form/status messages.

## Files and motion

- `src/scripts/brand-network.ts`: bounded node count, cached links/theme colors,
  DPR capped at 1.5, stops animation frames off-screen/in hidden tabs, static
  rendering for reduced-motion preferences. No external animation library.
- `src/components/Vision.astro`: on-demand native video and film credits.
- `public/brand/`: supplied logos and favicons.
- `public/images/brand/`: web images, not the large PNG masters.
- `public/film/`: poster and 720p H.264/AAC fast-start web encode (~14 MB).
  Do not replace this with the 67 MB master. Nothing preloads or autoplays the
  movie. For frequent film revisions, move media to owner-approved object storage
  or a video CDN instead of accumulating binaries in Git history.

The complete supplied film is preserved, only resized/recompressed for web use.
Music and image credit information supplied with the kit appears below the
player. Music: 'Patagonia' by Scott Buckley, CC BY 4.0.

Business assertions in the visual spec, including public-beta status and future
open standards, are not silently treated as verified product capabilities.
TilJot's existing invitation-testing status remains unchanged pending confirmation.

## Verification

Run `ASTRO_TELEMETRY_DISABLED=1 npm run check`. This checks the production build,
required bilingual UI keys, admin configuration, brand/media asset presence,
video load policy and attribution. Browser-test both languages and themes,
mobile navigation, film playback, article comments and motion preferences before
publishing. Do not infer browser QA or performance scores from a build alone.
