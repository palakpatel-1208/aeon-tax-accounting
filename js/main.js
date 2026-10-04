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
  if (!hash || hash === "top" || hash === "main") {
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

function scrollToHash(hash, behavior = "smooth") {
  const id = (hash || "").replace(/^#/, "");
  if (!id || id === "top" || id === "main") {
    window.scrollTo({ top: 0, behavior });
    setActiveNav("home");
    return;
  }

  const target = document.getElementById(id);
  if (!target) return;

  updateHeaderOffset();
  // Align section top under the sticky header so section padding
  // creates the same breathing room Contact Us already has.
  const top = window.scrollY + target.getBoundingClientRect().top - getHeaderOffset();
  window.scrollTo({ top: Math.max(0, top), behavior });
  setActiveNav(sectionMap.some((item) => item.id === id) ? id : "home");
}

syncNavFromLocation();
updateHeaderOffset();
window.addEventListener("resize", updateHeaderOffset);

function samePagePath(pathname) {
  return (pathname || "/").replace(/index\.html$/i, "").replace(/\/$/, "") || "/";
}

document.querySelectorAll('a[href*="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const url = new URL(link.href, window.location.href);
    if (samePagePath(url.pathname) !== samePagePath(window.location.pathname)) return;
    if (!url.hash) return;
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

if (page === "home") {
  const observed = sectionMap
    .map((item) => document.getElementById(item.id))
    .filter(Boolean);

  if (observed.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const match = sectionMap.find((item) => item.id === visible.target.id);
        if (match) setActiveNav(match.key);
      },
      {
        rootMargin: "-40% 0px -50% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );
    observed.forEach((section) => observer.observe(section));
  }
}

function onScroll() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 8);
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
