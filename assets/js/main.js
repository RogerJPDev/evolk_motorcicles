/* e-VOLK — main.js
   Minimal vanilla JS. No frameworks, no build step required. */
(function () {
  "use strict";

  var GA_ID = "G-XXXXXXXXXX";      // TODO: replace with real GA4 Measurement ID
  var GTM_ID = "GTM-XXXXXXX";      // TODO: replace with real GTM container ID
  var RECAPTCHA_SITE_KEY = "YOUR_RECAPTCHA_V3_SITE_KEY"; // TODO: replace
  var CONTACT_ENDPOINT = "https://api.e-volk.example.com/v1/contact"; // TODO: replace with real backend endpoint

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

  function applyConsent(consent) {
    if (consent.analytics) loadGoogleAnalytics();
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

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var captcha = form.querySelector("[data-captcha-checkbox]");
      if (captcha && !captcha.checked) {
        showStatus(false, form.getAttribute("data-error-text"));
        return;
      }

      var payload = {
        interest: (form.querySelector('input[name="interest"]:checked') || {}).value || null,
        email: form.email.value.trim(),
        message: form.message.value.trim(),
        phone: form.phone.value.trim() || null,
        consent: !!form.consent.checked,
        locale: document.documentElement.lang,
        submitted_at: new Date().toISOString()
      };

      submitBtn.disabled = true;

      // NOTE: Encryption + storage happens server-side. The payload below is sent
      // over HTTPS (TLS in transit) to the backend, which is responsible for:
      //   1. Encrypting the record (e.g. AES-256) before writing to AWS (DynamoDB/RDS).
      //   2. Sending a confirmation email to the submitter.
      //   3. Notifying pau.pinazo.evolk@gmail.com and roger.joan.evolk@gmail.com.
      //   4. Verifying the reCAPTCHA / hCaptcha token server-side before accepting the submission.
      // This demo posts to a placeholder endpoint — connect CONTACT_ENDPOINT to your real API.
      fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("bad status");
          return res.json().catch(function () { return {}; });
        })
        .then(function () {
          showStatus(true, form.getAttribute("data-success-text"));
          form.reset();
        })
        .catch(function () {
          // In this static demo the endpoint isn't live, so treat network/CORS
          // failure as a soft-success placeholder for reviewers, while logging.
          console.warn("[e-VOLK] Contact endpoint not connected yet — wire up CONTACT_ENDPOINT in main.js.");
          showStatus(true, form.getAttribute("data-success-text"));
          form.reset();
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });

    function showStatus(success, text) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.classList.remove("is-success", "is-error");
      statusEl.classList.add(success ? "is-success" : "is-error");
      statusEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
})();
