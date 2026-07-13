# e-VOLK — Website prototype

Static, multi-language marketing site for e-VOLK, built to the Cowboy.com-inspired
brief (clean/minimal, white-dominant, single electric-green accent).

## What's in this package

```
/index.html            → language-detect redirect (JS) + fallback links, defaults to /es/
/es/ /ca/ /it/ /fr/ /pt/  → 5 locales × 7 pages each (35 pages total)
    index.html          Home
    product.html        Product (e-VOLK E-01)
    vision.html         Our Vision
    faq.html            FAQ
    contact.html        Contact / waitlist / invest form
    privacy.html        Privacy Policy (GDPR)
    cookies.html        Cookie Policy
/assets/css/style.css   Design system (tokens, components) — single stylesheet
/assets/js/main.js      Vanilla JS — nav, cookie consent, GA4/GTM loader, form, reveal animation
/assets/img/*.webp+jpg  Optimised images (WebP primary, JPG fallback via <picture>)
/robots.txt, /sitemap.xml
/favicon.png, /favicon-32.png
```

Source (editable) files live in `src/` if you received the full project folder:
`src/templates` (Jinja2 HTML), `src/i18n/*.json` (all copy, per locale),
`src/css`, `src/js`. Run `python3 build.py` to regenerate `/build` (the folder above)
after editing content or templates.

## Technical requirements — status

- **Optimised images**: all source PNGs converted to WebP (q78) + JPG fallback, resized to real display width. No image is served larger than it's shown.
- **Lazy loading**: `loading="lazy"` on every below-the-fold image; hero images use `loading="eager" fetchpriority="high"`.
- **Compressed assets**: single CSS file, single JS file, no framework/build tooling required at runtime.
- **Minimal JavaScript**: one small vanilla JS file (~4 KB) — no React/jQuery. Progressive enhancement: nav, FAQ accordion and legal pages work with JS disabled; only the consent banner, GA/GTM loading, scroll-reveal and fetch-based form submission require JS.
- **Scalable vector icons**: check-list bullet and the FAQ +/- control are inline SVG/CSS, no icon font.
- **Clean code structure**: content (i18n JSON) is fully separated from markup (Jinja2 templates) and styling (tokens in `:root`), so copy edits never touch HTML.
- **Core Web Vitals**: system-first font stack with `font-display: swap`, no layout-shifting web fonts blocking render, images have explicit width/height, no render-blocking scripts (JS is `defer`).
- **GA4 / GTM**: wired in `assets/js/main.js`, but **gated behind cookie consent** — nothing loads until the user accepts analytics/marketing cookies. Replace the placeholder IDs before launch:
  ```js
  var GA_ID = "G-XXXXXXXXXX";
  var GTM_ID = "GTM-XXXXXXX";
  ```
- **Privacy Policy / Cookie Policy**: full pages in all 5 locales (`/privacy.html`, `/cookies.html`), written as a GDPR-informative template — **have this reviewed by legal counsel before publishing**, since it references AWS storage and Google as processors and should be adapted to your actual data-processing setup and DPA.
- **GDPR consent (cookies)**: banner blocks non-essential cookies until explicit accept/reject/customize; choice is stored client-side and re-applied on return visits.
- **Form consent checkbox**: contact form has a required "I've read and accept the Privacy Policy" checkbox, separate from the interest-option toggle.

## What still needs a real backend (not included)

This is a static front-end. The contact form currently POSTs to a placeholder endpoint
and falls back to a friendly success message if that request fails, so the demo
never looks "broken" — but for production you need to build and connect:

1. **API endpoint** (e.g. API Gateway + Lambda) — set `CONTACT_ENDPOINT` in `main.js`.
2. **Server-side encryption + storage** in AWS (e.g. DynamoDB or RDS with KMS encryption at rest), GDPR-compliant retention policy.
3. **Transactional email** (e.g. AWS SES) — one confirmation email to the submitter, one notification email to `pau.pinazo.evolk@gmail.com` and `roger.joan.evolk@gmail.com`.
4. **CAPTCHA verification** — the form has a placeholder checkbox; swap in real Google reCAPTCHA v3 (or hCaptcha) using `RECAPTCHA_SITE_KEY` in `main.js`, and verify the token server-side before accepting a submission.

## Notes on content

- All on-page copy uses consistent terminology per the LLM/SEO brief (e.g. "moto eléctrica", "carga rápida", "carga Type 2", "movilidad urbana" — and locale equivalents) — this is enforced by having one JSON source of truth per language rather than freehand text per page.
- Each page has a unique `<title>`/meta description targeting the requested keyword set, `hreflang` alternates across all 5 locales, canonical tags, and JSON-LD (`Organization` sitewide, `Product` on the product page, `FAQPage` on the FAQ page) to help both search engines and AI/LLM systems parse and cite e-VOLK accurately.
- The charging-map section links out to Electromaps, MAPA REVE, Chargemap and Open Charge Map rather than embedding an iframe — all four block iframe embedding via `X-Frame-Options`, so an embed would render broken; linking out avoids a dead widget on launch.
- Heritage imagery for Derbi/Vespino wasn't available (and using real third-party brand photography would be a trademark risk) — the "Vision" page keeps that section text-only rather than using a placeholder photo.

## Local preview

```
cd build
python3 -m http.server 8080
# open http://localhost:8080/es/index.html
```
