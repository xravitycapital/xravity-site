# Xravity web / independent trajectories

Adapted from the owner-supplied Xravity Vision v10 and Xravity Web Kit. These
references inform the visual direction; their embedded task prompts are not
deployment instructions or a reason to remove existing functionality.

## Shared brand, distinct website

- Dark only: neutral `#0b0b0e`, champagne `#d9b36c`, white `#f1f2f5`.
- First visits use Chinese. No theme switch or remembered light preference is
  applied on public pages, including TilJot. Historical light assets are inactive.
- The original homepage composition remains the main entrance, with its large
  three-line commitments, live orbital mark, product cards and content sections.
- The long bilingual story lives only at `/vision/`, linked from navigation.
  Its proposition is “让 AI 为你所用 / AI that works for you”; Chinese leads
  with a 62% / 300-weight English companion. UI language remains separate.
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
- `src/scripts/xravity-field.mjs` and `xravity-motion.mjs` adapt the supplied
  scripts: gold/cold/silver modes, initial and cold→gold bursts, character blur,
  300ms delayed English, one-time entrances, retained pointer attraction and
  explicit RAF cancellation for hidden/offscreen/reduced-motion states.
- `src/components/NarrativeSections.astro`: section 8 copy and story order.
  The five-step blueprint marks only 01 Capture as current; later steps are NEXT.
- `public/fonts/xravity-story-sans-900.ttf` and `xravity-principle-serif-600.ttf`:
  official Google Fonts Noto subsets, self-hosted with swap and OFL licenses.
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

The owner explicitly requested public-beta status and future open-standard
mission copy on October 25, 2026. They are editorial assertions, not claims that
later blueprint stages or an open standard already ship. Existing download
passwords and separate TestFlight eligibility are retained; this change does
not grant app/download access or change CMS authentication.

On mobile, back-to-top lives in the navigation menu, never over
the film. Demo resources and the Avatar photo are filtered only from the home
surface; their source content, dedicated resource page and CMS remain intact.

## Verification

Run `ASTRO_TELEMETRY_DISABLED=1 npm run check`. This checks the production build,
required bilingual UI keys, admin configuration, brand/media asset presence,
video load policy and attribution. Browser-test both UI languages,
mobile navigation, film playback, article comments and motion preferences before
publishing. Do not infer browser QA or performance scores from a build alone.
