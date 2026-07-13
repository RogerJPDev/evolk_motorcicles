# Deploying e-VOLK to GitHub Pages — rogerjpdev.github.io/evolk_motorcicles

This repo is set up so GitHub **builds the site automatically** on every push
(via `.github/workflows/deploy.yml`) — you commit the source (Jinja templates +
JSON content), not the generated HTML.

The site is configured for a **GitHub Pages project site** (no custom domain):
it will be served at `https://rogerjpdev.github.io/evolk_motorcicles/`. Every
internal path in the build (`/assets/...`, `/ca/...`, etc.) is prefixed with
`/evolk_motorcicles` for exactly this reason — if the repo is ever renamed, or
you switch to a custom domain later, update `BASE_PATH` and `BASE_URL` at the
top of `build.py` to match and re-push.

## 1. Push the repo

```bash
git init
git add .
git commit -m "Initial e-VOLK site"
git branch -M main
git remote add origin https://github.com/RogerJPDev/evolk_motorcicles.git
git push -u origin main
```

## 2. Turn on GitHub Pages

1. GitHub repo → **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
   (Not "Deploy from a branch" — the included workflow handles the build.)
3. Push to `main` (or re-run the workflow from the **Actions** tab). The
   `deploy.yml` workflow will:
   - install Python + Jinja2/Pillow
   - run `python3 build.py` (regenerates all 35 pages from `src/`)
   - publish the resulting `build/` folder to Pages
4. Once the workflow finishes, the site is live at:
   **https://rogerjpdev.github.io/evolk_motorcicles/**
   (that URL redirects to `/evolk_motorcicles/ca/index.html` automatically)

No DNS setup needed — this is the default `github.io` subdomain + project path.

## Comparing versions (previous vs. current)

There's a frozen static snapshot of the previous hero-image behavior committed
in `static-preview/`. The workflow copies it into `build/preview/` on every
deploy, so both versions are live simultaneously, side by side:

- **Current**: https://rogerjpdev.github.io/evolk_motorcicles/ca/index.html
- **Previous** (for comparison): https://rogerjpdev.github.io/evolk_motorcicles/preview/ca/index.html

The preview snapshot is fully self-contained (its own CSS/JS/assets under
`/preview/assets/...`), so it won't be affected by future changes to the main
site. When you no longer need the comparison, just delete the `static-preview/`
folder and remove the "Add previous-version preview snapshot" step from
`.github/workflows/deploy.yml`.

To freeze a *new* snapshot later (e.g. before another big change), run
`python3 build.py` with `BASE_PATH`/`BASE_URL` temporarily pointed at
`/evolk_motorcicles/preview` (see git history for the exact pattern used to
generate this one), copy the output into `static-preview/`, then rebuild
normally for the main site.

## If you switch to a custom domain later

1. Set `BASE_URL` to the new domain and `BASE_PATH = ""` (empty string) at the
   top of `build.py`.
2. Add back a `CNAME` file generation step (removed for the subpath setup):
   ```python
   with open(os.path.join(BUILD, "CNAME"), "w", encoding="utf-8") as f:
       f.write("yourdomain.com\n")
   ```
3. Add the DNS records at your registrar (4 `A` records for the apex domain
   pointing at GitHub Pages' IPs: 185.199.108.153, .109.153, .110.153, .111.153,
   or a `CNAME` record for a `www` subdomain pointing at `rogerjpdev.github.io`).
4. Set the custom domain in **Settings → Pages** and re-push.

## Notes

- Analytics: GA4 (`G-6ZL1WGB0QX`), GTM (`GTM-NBDXFLKF`) and Microsoft Clarity
  (`xk94nk934k`) are wired into `assets/js/main.js` with the real IDs, but all
  three stay **gated behind cookie consent** — nothing fires until the visitor
  accepts. This is intentional per GDPR; don't move these into raw `<script>`
  tags in the HTML `<head>`/`<body>` unless you also want to drop the consent
  gate.
- The contact form, honeypot, and hidden submission-timestamp are wired
  client-side; the real backend (AWS storage, confirmation/notification
  emails, spam verification) still needs to be built — see the main
  `README.md`.

## Local build/preview (optional, before pushing)

```bash
pip install jinja2 pillow
python3 build.py
# paths reference /evolk_motorcicles/... so for an accurate local preview,
# serve from a parent folder structured as ./evolk_motorcicles/<build contents>
mkdir -p /tmp/preview/evolk_motorcicles && cp -r build/* /tmp/preview/evolk_motorcicles/
cd /tmp/preview && python3 -m http.server 8080
# open http://localhost:8080/evolk_motorcicles/ca/index.html
```
