import json, os, re, shutil
from jinja2 import Environment, FileSystemLoader

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
BUILD = os.path.join(ROOT, "build")
BASE_URL = "https://www.evolkmotorcycles.com"
BASE_PATH = ""

LOCALES = ["ca", "es", "it", "fr", "pt"]

env = Environment(loader=FileSystemLoader(os.path.join(SRC, "templates")), autoescape=False)

# ---- load content ----
content = {}
legal = {}
for loc in LOCALES:
    with open(os.path.join(SRC, "i18n", f"{loc}.json"), encoding="utf-8") as f:
        content[loc] = json.load(f)
    with open(os.path.join(SRC, "i18n", f"legal_{loc}.json"), encoding="utf-8") as f:
        legal[loc] = json.load(f)

locales_meta = [
    {"code": loc, "hreflang": content[loc]["hreflang"],
     "lang_label": content[loc]["lang_label"], "country_label": content[loc]["country_label"]}
    for loc in LOCALES
]

PAGES = [
    ("home",    "home.html",    "index.html",   "meta.home"),
    ("product", "product.html", "product.html", "meta.product"),
    ("vision",  "vision.html",  "vision.html",  "meta.vision"),
    ("faq",     "faq.html",     "faq.html",      "meta.faq"),
    ("contact", "contact.html", "contact.html", "meta.contact"),
]

def get_path(d, dotted):
    cur = d
    for part in dotted.split("."):
        cur = cur[part]
    return cur

def strip_html(s):
    return re.sub(r"<[^>]+>", " ", s).replace("  ", " ").strip()

def json_ld_for(page, loc, t):
    org = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "e-VOLK",
        "url": f"{BASE_URL}/{loc}/index.html",
        "logo": f"{BASE_URL}/assets/img/logo-v-mark.png",
        "description": t["meta"]["home"]["description"]
    }
    if page == "home":
        return json.dumps(org, ensure_ascii=False)
    if page == "product":
        prod = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "e-VOLK E-01",
            "brand": {"@type": "Brand", "name": "e-VOLK"},
            "description": t["meta"]["product"]["description"],
            "additionalProperty": [{"@type": "PropertyValue", "name": "spec", "value": s} for s in t["product"]["specs"]]
        }
        return json.dumps(prod, ensure_ascii=False)
    if page == "faq":
        faq = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": item["q"],
                 "acceptedAnswer": {"@type": "Answer", "text": strip_html(item["a"])}}
                for item in t["faq"]["questions"]
            ]
        }
        return json.dumps(faq, ensure_ascii=False)
    return json.dumps(org, ensure_ascii=False)

def render_page(page_key, template_name, out_name, meta_key, loc):
    t = content[loc]
    tpl = env.get_template(template_name)
    html = tpl.render(
        locale=loc,
        t=t,
        meta=get_path(t, meta_key),
        page=page_key,
        page_path=out_name,
        locales=locales_meta,
        base_url=BASE_URL,
        base_path=BASE_PATH,
        json_ld=json_ld_for(page_key, loc, t),
    )
    out_dir = os.path.join(BUILD, loc)
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, out_name), "w", encoding="utf-8") as f:
        f.write(html)

def render_legal(kind, out_name, loc):
    t = content[loc]
    tpl = env.get_template("legal.html")
    meta_key = f"meta.{'privacy' if kind=='privacy' else 'cookies'}"
    html = tpl.render(
        locale=loc,
        t=t,
        meta=get_path(t, meta_key),
        page=kind,
        page_path=out_name,
        locales=locales_meta,
        base_url=BASE_URL,
        base_path=BASE_PATH,
        json_ld=json_ld_for("legal", loc, t),
        legal=legal[loc][kind],
    )
    out_dir = os.path.join(BUILD, loc)
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, out_name), "w", encoding="utf-8") as f:
        f.write(html)

# ---- clean + render ----
if os.path.exists(BUILD):
    shutil.rmtree(BUILD)
os.makedirs(BUILD, exist_ok=True)

for loc in LOCALES:
    for page_key, template_name, out_name, meta_key in PAGES:
        render_page(page_key, template_name, out_name, meta_key, loc)
    render_legal("privacy", "privacy.html", loc)
    render_legal("cookies", "cookies.html", loc)

# ---- copy assets ----
shutil.copytree(os.path.join(ROOT, "assets", "img"), os.path.join(BUILD, "assets", "img"))
os.makedirs(os.path.join(BUILD, "assets", "css"), exist_ok=True)
os.makedirs(os.path.join(BUILD, "assets", "js"), exist_ok=True)
shutil.copy(os.path.join(SRC, "css", "style.css"), os.path.join(BUILD, "assets", "css", "style.css"))
shutil.copy(os.path.join(SRC, "js", "main.js"), os.path.join(BUILD, "assets", "js", "main.js"))

# ---- favicons ----
from PIL import Image
_logo = Image.open(os.path.join(ROOT, "favicon_source.png"))
_logo.save(os.path.join(BUILD, "favicon.png"))
_logo.resize((32, 32)).save(os.path.join(BUILD, "favicon-32.png"))

# ---- root index.html (language redirect / chooser) ----
root_index = """<!doctype html>
<html lang="ca">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>e-VOLK</title>
<meta http-equiv="refresh" content="0; url={base_path}/ca/index.html">
<link rel="canonical" href="{base}/ca/index.html">
<style>
body{{font-family:-apple-system,'Segoe UI',system-ui,sans-serif;background:#050505;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}}
a{{color:#D7F54A;}}
.wrap{{text-align:center;}}
ul{{list-style:none;padding:0;display:flex;gap:16px;justify-content:center;margin-top:20px;}}
</style>
<script>
(function(){{
  var supported = {locales};
  var nav = (navigator.language || "ca").slice(0,2).toLowerCase();
  var target = supported.indexOf(nav) !== -1 ? nav : "ca";
  window.location.replace("{base_path}/" + target + "/index.html");
}})();
</script>
</head>
<body>
<div class="wrap">
  <p>e-VOLK</p>
  <ul>
    {links}
  </ul>
</div>
</body>
</html>
"""
links = "\n    ".join(f'<li><a href="{BASE_PATH}/{loc}/index.html">{content[loc]["lang_label"]}</a></li>' for loc in LOCALES)
with open(os.path.join(BUILD, "index.html"), "w", encoding="utf-8") as f:
    f.write(root_index.format(base=BASE_URL, base_path=BASE_PATH, locales=json.dumps(LOCALES), links=links))

# ---- 404 page (root-level, served for any unmatched path under the site) ----
tpl_404 = env.get_template("404.html")
with open(os.path.join(BUILD, "404.html"), "w", encoding="utf-8") as f:
    f.write(tpl_404.render(base_path=BASE_PATH, base_url=BASE_URL))

# ---- robots.txt + sitemap.xml ----
robots = f"User-agent: *\nAllow: /\nSitemap: {BASE_URL}/sitemap.xml\n"
with open(os.path.join(BUILD, "robots.txt"), "w", encoding="utf-8") as f:
    f.write(robots)

# ---- .htaccess (Apache — this is what Hostinger's shared hosting runs) ----
htaccess = """# e-VOLK — Apache config for Hostinger shared hosting

# Force https:// and the canonical www subdomain (matches the CORS allowlist
# on the contact-form backend, which only accepts requests from
# https://www.evolkmotorcycles.com).
RewriteEngine On
RewriteCond %{HTTPS} off [OR]
RewriteCond %{HTTP_HOST} ^evolkmotorcycles\\.com$ [NC]
RewriteRule ^(.*)$ https://www.evolkmotorcycles.com/$1 [L,R=301]

# Custom 404 page
ErrorDocument 404 /404.html

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>

# Caching for static assets (images/CSS/JS change filenames rarely; HTML doesn't get cached)
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
"""
with open(os.path.join(BUILD, ".htaccess"), "w", encoding="utf-8") as f:
    f.write(htaccess)

url_entries = []
for loc in LOCALES:
    for _, _, out_name, _ in PAGES:
        url_entries.append(f"{BASE_URL}/{loc}/{out_name}")
    url_entries.append(f"{BASE_URL}/{loc}/privacy.html")
    url_entries.append(f"{BASE_URL}/{loc}/cookies.html")

sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in url_entries:
    sitemap.append(f"  <url><loc>{u}</loc></url>")
sitemap.append("</urlset>")
with open(os.path.join(BUILD, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write("\n".join(sitemap))

print("BUILD COMPLETE")
print("Pages generated:", sum(len(PAGES)+2 for _ in LOCALES) + 1)
