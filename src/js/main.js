/* e-VOLK — main.js
   Minimal vanilla JS. No frameworks, no build step required. */
(function () {
  "use strict";

  var GA_ID = "G-6ZL1WGB0QX";      // Real GA4 Measurement ID
  var GTM_ID = "GTM-NBDXFLKF";     // Real GTM container ID
  var CLARITY_ID = "xk94nk934k";   // Real Microsoft Clarity project ID
  var CONTACT_ENDPOINT = "https://ati2yzuclzrbmwr5q2j6scz2wy0cbwey.lambda-url.eu-north-1.on.aws/"; // Real registration backend (CORS-locked to https://www.evolkmotorcycles.com)

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Language switcher: close on outside click ---------- */
  document.querySelectorAll("[data-lang-switch]").forEach(function (details) {
    document.addEventListener("click", function (e) {
      if (details.open && !details.contains(e.target)) {
        details.open = false;
      }
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Pinned scroll-reveal images ----------
     Structure expected:
     <div class="pinned-image-wrap" data-pinned-image>
       <div class="pinned-image-sticky">
         <div class="pinned-image-track"><img ...></div>
       </div>
     </div>
     The wrap is taller than the viewport; while it scrolls past, the image
     pans from its top portion to its bottom portion inside the pinned frame.
     (Promoted from the preview build.) */
  var pinnedWraps = document.querySelectorAll("[data-pinned-image]");
  if (pinnedWraps.length) {
    var pinnedItems = Array.prototype.map.call(pinnedWraps, function (wrap) {
      return {
        wrap: wrap,
        sticky: wrap.querySelector(".pinned-image-sticky"),
        img: wrap.querySelector(".pinned-image-track img")
      };
    }).filter(function (it) { return it.sticky && it.img; });

    var pinTicking = false;
    function updatePinned() {
      pinnedItems.forEach(function (it) {
        var rect = it.wrap.getBoundingClientRect();
        var scrollable = it.wrap.offsetHeight - it.sticky.offsetHeight;
        if (scrollable <= 0) return;
        var progress = (-rect.top) / scrollable;
        progress = Math.max(0, Math.min(1, progress));
        var maxTranslate = it.img.offsetHeight - it.sticky.offsetHeight;
        if (maxTranslate <= 0) return;
        it.img.style.transform = "translateY(-" + (progress * maxTranslate) + "px)";
      });
      pinTicking = false;
    }
    window.addEventListener("scroll", function () {
      if (!pinTicking) { window.requestAnimationFrame(updatePinned); pinTicking = true; }
    }, { passive: true });
    window.addEventListener("resize", updatePinned);
    updatePinned();
  }

  /* ---------- Cookie consent (GDPR) ---------- */
  var CONSENT_KEY = "evolk_consent";

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch (e) { return null; }
  }
  function setConsent(consent) {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(consent)); } catch (e) {}
  }

  function loadGoogleTagManager() {
    if (window.__gtmLoaded) return;
    window.__gtmLoaded = true;
    (function (w, d, s, l, i) {
      w[l] = w[l] || []; w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != "dataLayer" ? "&l=" + l : "";
      j.async = true; j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", GTM_ID);
  }

  function loadGoogleAnalytics() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });
  }

  function loadClarity() {
    if (window.__clarityLoaded) return;
    window.__clarityLoaded = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  function applyConsent(consent) {
    if (consent.analytics) { loadGoogleAnalytics(); loadClarity(); }
    if (consent.marketing) loadGoogleTagManager();
  }

  var banner = document.querySelector("[data-cookie-banner]");
  var existing = getConsent();
  if (existing) {
    applyConsent(existing);
  } else if (banner) {
    banner.classList.add("is-visible");
  }

  if (banner) {
    var acceptBtn = banner.querySelector("[data-cookie-accept]");
    var rejectBtn = banner.querySelector("[data-cookie-reject]");
    var customizeBtn = banner.querySelector("[data-cookie-customize]");
    var saveBtn = banner.querySelector("[data-cookie-save]");
    var prefsPanel = banner.querySelector("[data-cookie-prefs]");
    var analyticsCheckbox = banner.querySelector("[data-cookie-analytics]");
    var marketingCheckbox = banner.querySelector("[data-cookie-marketing]");

    function closeBanner() { banner.classList.remove("is-visible"); }

    if (acceptBtn) acceptBtn.addEventListener("click", function () {
      var consent = { necessary: true, analytics: true, marketing: true, ts: Date.now() };
      setConsent(consent); applyConsent(consent); closeBanner();
    });
    if (rejectBtn) rejectBtn.addEventListener("click", function () {
      var consent = { necessary: true, analytics: false, marketing: false, ts: Date.now() };
      setConsent(consent); closeBanner();
    });
    if (customizeBtn && prefsPanel) customizeBtn.addEventListener("click", function () {
      prefsPanel.classList.toggle("is-visible");
    });
    if (saveBtn) saveBtn.addEventListener("click", function () {
      var consent = {
        necessary: true,
        analytics: !!(analyticsCheckbox && analyticsCheckbox.checked),
        marketing: !!(marketingCheckbox && marketingCheckbox.checked),
        ts: Date.now()
      };
      setConsent(consent); applyConsent(consent); closeBanner();
    });
  }

  /* ---------- FAQ: only one open at a time (progressive enhancement, works without JS too) ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) {
        document.querySelectorAll(".faq-item[open]").forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  /* ---------- Contact form ---------- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var statusEl = form.querySelector("[data-form-status]");
    var submitBtn = form.querySelector("[data-form-submit]");
    var submittedAtField = form.querySelector("[data-submitted-at]");
    var fieldsEl = form.querySelector("[data-form-fields]");
    var successEl = form.querySelector("[data-form-success]");

    function showSuccess() {
      if (statusEl) { statusEl.classList.remove("is-error"); statusEl.textContent = ""; }
      if (fieldsEl) fieldsEl.hidden = true;
      if (successEl) {
        successEl.hidden = false;
        successEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    // Shown on a real failure (network error, or the API returning a 4xx/5xx).
    // Never exposes the API's raw error message — always a friendly, generic
    // one — and leaves the form visible so the visitor can fix and retry.
    function showError() {
      if (!statusEl) return;
      statusEl.textContent = form.getAttribute("data-error-text");
      statusEl.classList.add("is-error");
      statusEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Honeypot: a real visitor never sees or fills this field. If it has a
      // value, this was filled by a bot — silently show success without
      // sending anywhere, so the bot gets no signal that it was caught.
      var honeypot = form.querySelector("[data-honeypot]");
      if (honeypot && honeypot.value) {
        showSuccess();
        return;
      }

      if (statusEl) { statusEl.classList.remove("is-error"); statusEl.textContent = ""; }
      if (submittedAtField) submittedAtField.value = new Date().toISOString();

      var interestField = form.querySelector('input[name="interest"]:checked');

      var payload = {
        interest: interestField ? interestField.value : null,  // "invest" | "keep_informed" — same values across all 5 locales
        email: form.email.value.trim(),
        message: form.message.value.trim(),
        phone: form.phone.value.trim(),  // "" when not provided
        consent: !!form.consent.checked,
        locale: document.documentElement.lang,  // "ca" | "es" | "it" | "fr" | "pt"
        submitted_at: submittedAtField ? submittedAtField.value : new Date().toISOString()
      };

      submitBtn.disabled = true;

      // Registration backend. Expects the exact JSON shape above; returns
      // { customer_id, inserted } on success. CORS on the Lambda is locked to
      // https://www.evolkmotorcycles.com, so this call only succeeds when the
      // site is actually served from that origin (not localhost, not a
      // preview URL, not the GitHub Pages fallback URL).
      fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) {
            // Read the API's error body for our own logging only — never
            // shown to the visitor, per the "don't expose raw error" rule.
            return res.json().catch(function () { return {}; }).then(function (body) {
              throw new Error((body && body.error) || ("Request failed with status " + res.status));
            });
          }
          return res.json().catch(function () { return {}; });
        })
        .then(function (data) {
          // data: { customer_id, inserted } — show success either way.
          showSuccess();
        })
        .catch(function (err) {
          console.error("[e-VOLK] Contact form submission failed:", err);
          showError();
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });

  }
})();
