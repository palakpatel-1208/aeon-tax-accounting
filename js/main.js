const header = document.querySelector(".site-header");
const nav = document.querySelector("#site-nav");
const toggle = document.querySelector(".nav-toggle");
const page = document.body.dataset.page;

document.querySelectorAll("[data-nav]").forEach((link) => {
  if (link.dataset.nav === page) {
    link.setAttribute("aria-current", "page");
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

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
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
