const header = document.querySelector(".site-header");
const nav = document.querySelector("#site-nav");
const toggle = document.querySelector(".nav-toggle");
const page = document.body.dataset.page;
const navLinks = document.querySelectorAll("[data-nav]");
const sectionMap = [
  { id: "services", key: "services" },
  { id: "about", key: "about" },
  { id: "contact", key: "contact" },
];

function setActiveNav(key) {
  navLinks.forEach((link) => {
    if (link.dataset.nav === key) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function syncNavFromLocation() {
  const hash = (window.location.hash || "").replace("#", "");
  if (!hash || hash === "main") {
    setActiveNav(page === "home" || !page ? "home" : page);
    return;
  }
  if (sectionMap.some((item) => item.id === hash)) {
    setActiveNav(hash);
    return;
  }
  setActiveNav(page === "home" || !page ? "home" : page);
}

function getHeaderOffset() {
  return header ? Math.ceil(header.getBoundingClientRect().height) : 0;
}

function updateHeaderOffset() {
  const offset = `${getHeaderOffset()}px`;
  document.documentElement.style.setProperty("--header-offset", offset);
}

let navLockKey = "";
let navLockTimer = 0;

function lockActiveNav(key, ms = 900) {
  navLockKey = key;
  setActiveNav(key);
  window.clearTimeout(navLockTimer);
  navLockTimer = window.setTimeout(() => {
    navLockKey = "";
  }, ms);
}

function scrollToTop(behavior = "smooth") {
  lockActiveNav("home");
  window.scrollTo({ top: 0, behavior });
}

function scrollToHash(hash, behavior = "smooth") {
  const id = (hash || "").replace(/^#/, "");
  if (!id || id === "main") {
    scrollToTop(behavior);
    return;
  }

  const target = document.getElementById(id);
  if (!target) return;

  updateHeaderOffset();
  // Align section top under the sticky header so section padding
  // creates the same breathing room Contact Us already has.
  const top = window.scrollY + target.getBoundingClientRect().top - getHeaderOffset();
  const key = sectionMap.some((item) => item.id === id) ? id : "home";
  lockActiveNav(key);
  window.scrollTo({ top: Math.max(0, top), behavior });
}

syncNavFromLocation();
updateHeaderOffset();
window.addEventListener("resize", updateHeaderOffset);

function samePagePath(pathname) {
  return (pathname || "/").replace(/index\.html$/i, "").replace(/\/$/, "") || "/";
}

document.querySelectorAll('a[href]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const url = new URL(link.href, window.location.href);
    if (samePagePath(url.pathname) !== samePagePath(window.location.pathname)) return;

    // Home / logo: clear hash and return to top without #top in the URL
    if (!url.hash || url.hash === "#") {
      if (link.dataset.nav === "home" || link.classList.contains("brand")) {
        event.preventDefault();
        history.pushState(null, "", window.location.pathname + window.location.search);
        scrollToTop("smooth");
        setMenu(false);
      }
      return;
    }

    event.preventDefault();
    history.pushState(null, "", url.hash);
    scrollToHash(url.hash, "smooth");
    setMenu(false);
  });
});

window.addEventListener("hashchange", () => {
  syncNavFromLocation();
  scrollToHash(window.location.hash, "smooth");
});

window.addEventListener("load", () => {
  updateHeaderOffset();
  if (window.location.hash) {
    scrollToHash(window.location.hash, "auto");
  }
});

function setMenu(open) {
  if (!nav || !toggle) return;
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
  document.body.classList.toggle("nav-open", open);
}

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    setMenu(!nav.classList.contains("is-open"));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("is-open")) return;
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    setMenu(false);
  });
}

function updateActiveNavFromScroll() {
  if (navLockKey) {
    setActiveNav(navLockKey);
    return;
  }

  // Near the top of the page, Home should stay highlighted
  if (window.scrollY < Math.max(120, getHeaderOffset())) {
    setActiveNav("home");
    return;
  }

  let current = "home";
  const marker = getHeaderOffset() + 24;

  sectionMap.forEach((item) => {
    const section = document.getElementById(item.id);
    if (!section) return;
    if (section.getBoundingClientRect().top <= marker) {
      current = item.key;
    }
  });

  setActiveNav(current);
}

function onScroll() {
  if (header) {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  if (page === "home") updateActiveNavFromScroll();
}

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const formDialog = document.querySelector("#form-modal");
const formOpen = document.querySelector("[data-form-open]");
const formClose = document.querySelector("[data-form-close]");

if (formDialog && formOpen) {
  formOpen.addEventListener("click", () => {
    formDialog.showModal();
  });

  if (formClose) {
    formClose.addEventListener("click", () => formDialog.close());
  }

  formDialog.addEventListener("click", (event) => {
    if (event.target === formDialog) formDialog.close();
  });
}

const serviceField = document.querySelector("#service");
if (serviceField) {
  const requested = new URLSearchParams(window.location.search).get("service");
  const allowed = ["tax", "bookkeeping", "payroll", "general"];
  if (requested && allowed.includes(requested)) {
    serviceField.value = requested;
  }
}

const form = document.querySelector("[data-contact-form]");
if (form) {
  const success = document.querySelector("[data-form-success]");

  const rules = {
    name: (value) => (value ? "" : "Enter your full name."),
    email: (value) => {
      if (!value) return "Enter your email address.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address.";
    },
    phone: (value) => {
      if (!value) return "";
      const digits = value.replace(/\D/g, "");
      return digits.length >= 7 ? "" : "Enter a phone number with at least 7 digits, or leave it blank.";
    },
    service: (value) => (value ? "" : "Choose a service."),
    message: (value) => (value ? "" : "Enter a message."),
  };

  function setFieldError(field, message) {
    const input = form.querySelector(`#${field}`);
    const error = form.querySelector(`#${field}-error`);
    if (!input || !error) return;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let firstInvalid = null;

    Object.keys(rules).forEach((field) => {
      const input = form.querySelector(`#${field}`);
      const value = input ? input.value.trim() : "";
      const message = rules[field](value);
      setFieldError(field, message);
      if (message && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    form.hidden = true;
    if (success) {
      success.hidden = false;
      const heading = success.querySelector("h2, h3");
      if (heading) heading.focus();
    }
  });
}
