# Deploying e-VOLK to www.evolkmotorcycles.com (Hostinger)

The site is a fully static build (plain HTML/CSS/JS, no server-side code) —
Hostinger's shared hosting can serve it as-is. There's no GitHub Actions
auto-deploy anymore (that was specific to the previous GitHub Pages setup);
instead you build once locally and upload the result.

## 1. Build the site

```bash
pip install jinja2 pillow
python3 build.py
```

This regenerates the `build/` folder from `src/` — 5 locales × 7 pages, all
images optimised, plus `robots.txt`, `sitemap.xml`, `404.html`, `favicon.png`,
and `.htaccess`.

## 2. Upload to Hostinger

Hostinger serves whatever is in your domain's **public_html** folder. Two ways
to get the build there:

**Option A — hPanel File Manager (simplest, no extra tools)**
1. Zip the *contents* of `build/` (not the `build` folder itself — the files
   need to sit directly inside `public_html`, not inside a `build` subfolder).
2. hPanel → **Files → File Manager** → open `public_html` → **Upload** → select
   the zip → once uploaded, right-click it → **Extract**.
3. Delete the zip file afterwards (housekeeping).

**Option B — FTP/SFTP (better for repeat deploys)**
1. hPanel → **Files → FTP Accounts** to get your host/username/password (or use
   the existing hosting account credentials).
2. Use an FTP client (FileZilla, Cyberduck, etc.) to connect, then upload the
   *contents* of `build/` into `public_html`, overwriting existing files.

Either way: **the contents of `build/`, not the folder itself**, must land
directly inside `public_html`. If you end up with `public_html/build/ca/...`
instead of `public_html/ca/...`, the site will 404 on every page.

## 3. Point the domain at Hostinger (if not already done)

If `evolkmotorcycles.com` isn't already pointed at this Hostinger account:
- In Hostinger hPanel, the domain's DNS should already be preconfigured if you
  bought/added it through Hostinger. If it's registered elsewhere, point its
  nameservers or A record at Hostinger's IP (hPanel → **Domains** shows the
  exact records needed).
- Make sure both `evolkmotorcycles.com` and `www.evolkmotorcycles.com` resolve
  — the site is built to treat `https://www.evolkmotorcycles.com` as the one
  canonical address (see `.htaccess`, below).

## 4. SSL certificate

hPanel → **Security → SSL** → issue a free Let's Encrypt certificate for the
domain (usually automatic once DNS is pointed correctly). The included
`.htaccess` forces every request to `https://www.` regardless of how a visitor
arrives, but that redirect only works correctly once SSL is active.

## 5. `.htaccess` — what it's doing and why it matters

Already included in the build output, no setup needed, but worth understanding:

- **Forces `https://www.evolkmotorcycles.com`** on every request (redirects
  `http://`, and redirects the bare `evolkmotorcycles.com` apex to the `www`
  version). This isn't just cosmetic — **the contact-form backend's CORS is
  locked to exactly `https://www.evolkmotorcycles.com`**. If a visitor lands on
  the apex domain or over `http://`, the form would otherwise fail silently
  with a CORS error in their browser console.
- Sets a custom 404 page (`/404.html`).
- Turns on gzip compression and long cache lifetimes for images/CSS/JS (short
  cache for HTML, so content updates show up immediately on redeploy).

## 6. Re-deploying after future changes

Every time `src/` changes: re-run `python3 build.py` locally, then re-upload
the *changed* files in `build/` (or just re-upload everything — Hostinger will
overwrite in place). There's no build step happening on the server itself.

*(Skip this if you're using the GitHub-based deployment described below —
that handles rebuilding and re-deploying automatically.)*

## Alternative: deploying via GitHub + Hostinger's Git integration

If you'd rather push to GitHub and have Hostinger pull the site automatically,
instead of manually uploading files each time, this repo includes a workflow
(`.github/workflows/deploy.yml`) that builds the site and pushes the *finished*
HTML to a dedicated branch called `hostinger-deploy` — Hostinger then pulls
from that branch.

This exists because Hostinger's Git feature just clones whatever's in the
repo/branch as-is — it doesn't run `build.py` for you. So `main` holds the
source (templates + content), and `hostinger-deploy` holds only the generated
site, kept in sync automatically.

**One-time setup:**

1. Push this repo to GitHub (`git init`, `git add .`, `git commit`, `git push`)
   if you haven't already.
2. Push once, then check the **Actions** tab — the workflow should run and
   create a new `hostinger-deploy` branch automatically.
3. In Hostinger hPanel, find **Git** (usually under **Advanced** or
   **Website** in the sidebar — the exact label can vary by plan).
4. Add a new repository:
   - **Repository URL**: your GitHub repo's HTTPS or SSH URL
   - **Branch**: `hostinger-deploy`
   - **Directory**: `public_html` (or wherever your domain is rooted)
5. Save. Hostinger will do an initial pull. Confirm the site loads at
   `https://www.evolkmotorcycles.com`.

**From then on:**

- Edit `src/` → commit → push to `main`.
- GitHub Actions rebuilds the site and updates `hostinger-deploy` automatically
  (check the **Actions** tab for a green checkmark).
- In hPanel's Git section, click **Deploy** (or **Pull**) to sync Hostinger
  with the latest `hostinger-deploy` branch. Some Hostinger plans support
  auto-deploy on a schedule or via webhook — check the Git panel's settings;
  if not available on your plan, this manual click is the only extra step.

## Notes

- Analytics: GA4 (`G-6ZL1WGB0QX`), GTM (`GTM-NBDXFLKF`), and Microsoft Clarity
  (`xk94nk934k`) are wired into `assets/js/main.js`, gated behind cookie
  consent — nothing fires until a visitor accepts.
- Contact form: posts to the real Lambda endpoint in `assets/js/main.js`
  (`CONTACT_ENDPOINT`). This will only work once the site is actually being
  served from `https://www.evolkmotorcycles.com` — the CORS restriction on
  that endpoint is what makes step 3–5 above matter for more than just SEO.
