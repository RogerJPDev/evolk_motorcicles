# e-VOLK — Website

Static, multi-language marketing site for e-VOLK, an electric motorcycle
company focused on practical urban mobility and fast public charging.

Live at **https://www.evolkmotorcycles.com**, hosted on Hostinger. See
`DEPLOY.md` for how to build and deploy (including the GitHub → Hostinger
automated pipeline).

## What's in this package

```
src/templates/   Jinja2 page templates (shared across all 5 locales)
src/i18n/*.json  All copy, one file per locale + one legal-text file per locale
src/css/         Single stylesheet, design tokens in :root
src/js/          Single vanilla JS file — nav, consent, form, hero animation
assets/img/      Source images (optimised into WebP + JPG on build)
build.py         Generates the static site into /build
```

Run `python3 build.py` (needs `pip install jinja2 pillow`) to generate the
site into `/build` — 5 locales × 7 pages, all images optimised, plus
`robots.txt`, `sitemap.xml`, `404.html`, `favicon.png`, and `.htaccess`.

**Locales**: Catalan (`ca`, default), Spanish (`es`), Italian (`it`), French
(`fr`), Portuguese (`pt`). Every page, image, and behavior is identical across
all 5 — only the JSON content differs per language.

## Current status

- **Contact form**: wired to a real backend (`CONTACT_ENDPOINT` in `main.js`)
  — POSTs `{ interest, email, message, phone, consent, locale, submitted_at }`
  as JSON. On success shows an inline success message in place of the form; on
  failure shows a generic translated error and leaves the form visible to
  retry (the backend's raw error text is never shown to the visitor). Spam
  protection is a honeypot field (no CAPTCHA) plus a hidden submission
  timestamp.
  - **Important**: the backend's CORS is locked to `https://www.evolkmotorcycles.com`
    specifically. The form will fail with a CORS error from any other origin
    (localhost, a preview URL, a bare non-www domain, etc.) — see `DEPLOY.md`
    for why the `.htaccess` redirect matters here.
- **Analytics**: GA4, Google Tag Manager, and Microsoft Clarity are wired in
  `assets/js/main.js` with real IDs, but all three stay gated behind the
  cookie consent banner — nothing loads until a visitor explicitly accepts.
- **404 page**: custom-styled, matches the site (`src/templates/404.html`),
  served via `.htaccess`.
- **Legal pages**: Privacy Policy and Cookie Policy in all 5 locales,
  referencing AWS (data storage), Google (Analytics/Tag Manager), and
  Microsoft (Clarity) as processors — **have this reviewed by legal counsel
  before relying on it**, since it's a template and should be adapted to your
  actual data-processing setup and any DPAs in place.
- **Hero image**: a scroll-linked pan effect (the image reveals top-to-bottom
  as the page scrolls past it, smoothed with a short transition) — shared
  behavior across Home and Product pages.
- **Performance/SEO**: images served as WebP with JPG fallback and explicit
  dimensions (no layout shift), lazy-loaded below the fold, `hreflang`
  alternates across all 5 locales, canonical tags, JSON-LD (`Organization`
  sitewide, `Product` on the Product page, `FAQPage` on the FAQ page).

## What isn't covered here

This repo is the front end only. Anything on the backend side — how the
Lambda endpoint stores submissions, sends confirmation/notification emails,
or verifies the honeypot server-side — lives outside this project and isn't
something this codebase controls or can verify.

## Local preview

```bash
cd build
python3 -m http.server 8080
# open http://localhost:8080/ca/index.html
```

Note: the contact form's fetch call will hit a CORS error when previewed
locally like this — that's expected, not a bug (see "Current status" above).
