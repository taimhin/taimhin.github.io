(function () {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (selector, context) => (context || document).querySelector(selector);
  const $$ = (selector, context) => Array.from((context || document).querySelectorAll(selector));

  /* ---------------------------------------------------------
     Language
     --------------------------------------------------------- */
  const langButtons = $$("[data-lang]");
  const metaDescription = $('meta[name="description"]');
  const ogTitle = $('meta[property="og:title"]');
  const ogDescription = $('meta[property="og:description"]');
  const ogLocale = $('meta[property="og:locale"]');
  const twitterTitle = $('meta[name="twitter:title"]');
  const twitterDescription = $('meta[name="twitter:description"]');

  // The page-specific title/description lives on <body data-title-zh ...>.
  // This keeps each page independently editable while sharing one script.
  function getPageMeta(lang) {
    const suffix = lang === "en" ? "En" : "Zh";
    const title = body.dataset["title" + suffix] || document.title;
    const description =
      body.dataset["desc" + suffix] ||
      (metaDescription ? metaDescription.getAttribute("content") : "");
    return { title, description };
  }

  function currentLang() {
    return root.lang === "en" ? "en" : "zh";
  }

  // Lightbox elements are null on the home/about/contact pages.
  const lightbox = $("#lightbox");
  const lightboxImage = $("#lightbox-image");
  const lightboxTitle = $("#lightbox-title");
  const lightboxLocation = $("#lightbox-location");
  const lightboxNote = $("#lightbox-note");
  const lightboxCategory = $("#lightbox-category");
  const lightboxYear = $("#lightbox-year");
  const lightboxCounter = $("#lightbox-counter");
  const lightboxQuality = $("#lightbox-quality");
  const lightboxSize = $("#lightbox-size");
  const lightboxDownload = $("#lightbox-download");
  const lightboxClose = $(".lightbox-close");
  const lightboxPrev = $(".lightbox-nav.prev");
  const lightboxNext = $(".lightbox-nav.next");

  let currentIndex = -1;
  let lightboxTrigger = null;
  let fullResToken = 0;
  let visibleCards = [];

  function setLanguage(lang) {
    const normalized = lang === "en" ? "en" : "zh";
    root.lang = normalized === "en" ? "en" : "zh-Hant";

    $$("[data-zh]").forEach((element) => {
      const value = element.dataset[normalized];
      if (value !== undefined) element.textContent = value;
    });

    $$("[data-aria-zh]").forEach((element) => {
      const value = normalized === "en" ? element.dataset.ariaEn : element.dataset.ariaZh;
      if (value) element.setAttribute("aria-label", value);
    });

    $$("img[data-alt-zh]").forEach((image) => {
      const value = normalized === "en" ? image.dataset.altEn : image.dataset.altZh;
      if (value) image.alt = value;
    });

    langButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.lang === normalized));
    });

    const meta = getPageMeta(normalized);
    document.title = meta.title;
    if (metaDescription) metaDescription.setAttribute("content", meta.description);
    if (ogTitle) ogTitle.setAttribute("content", meta.title);
    if (ogDescription) ogDescription.setAttribute("content", meta.description);
    if (ogLocale) ogLocale.setAttribute("content", normalized === "en" ? "en_US" : "zh_TW");
    if (twitterTitle) twitterTitle.setAttribute("content", meta.title);
    if (twitterDescription) twitterDescription.setAttribute("content", meta.description);

    try {
      localStorage.setItem("tmh-lang", normalized);
    } catch (error) {
      /* localStorage can be blocked in private mode or on file:// */
    }

    if (lightbox && lightbox.open && currentIndex >= 0) {
      renderLightbox(currentIndex, { keepMedia: true });
    }
  }

  langButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });

  const savedLang = (() => {
    try {
      return localStorage.getItem("tmh-lang");
    } catch (error) {
      return null;
    }
  })();

  /* ---------------------------------------------------------
     Theme
     --------------------------------------------------------- */
  const themeToggle = $("[data-theme-toggle]");
  const themeMeta = $('meta[name="theme-color"]');

  function currentTheme() {
    return root.dataset.theme === "light" ? "light" : "dark";
  }

  function themeLabel(theme) {
    return theme === "light"
      ? "切換深色模式 / Switch to dark mode"
      : "切換淺色模式 / Switch to light mode";
  }

  function setTheme(theme, options) {
    const normalized = theme === "light" ? "light" : "dark";
    root.dataset.theme = normalized;

    if (themeMeta) {
      themeMeta.setAttribute("content", normalized === "light" ? "#f4efe5" : "#080706");
    }

    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(normalized === "light"));
      themeToggle.setAttribute("aria-label", themeLabel(normalized));
      themeToggle.setAttribute("title", themeLabel(normalized));
    }

    if (!options || options.save !== false) {
      try {
        localStorage.setItem("tmh-theme", normalized);
      } catch (error) {
        /* localStorage can be blocked in private mode or on file:// */
      }
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      setTheme(currentTheme() === "light" ? "dark" : "light");
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === "tmh-theme" && (event.newValue === "light" || event.newValue === "dark")) {
      setTheme(event.newValue, { save: false });
    }
  });

  /* ---------------------------------------------------------
     Header scroll progress
     --------------------------------------------------------- */
  const header = $(".site-header");
  const progressBar = $(".scroll-progress span");
  let scrollTicking = false;

  function updateOnScroll() {
    const y = window.scrollY || window.pageYOffset || 0;
    const max = root.scrollHeight - window.innerHeight;

    if (progressBar) {
      progressBar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    }

    if (header) header.classList.toggle("is-scrolled", y > 24);
    scrollTicking = false;
  }

  function requestScrollUpdate() {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateOnScroll);
    }
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  updateOnScroll();

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */
  const mobileMenu = $("#mobile-menu");
  const menuToggle = $(".menu-toggle");
  const mainContent = $("#main");
  const siteFooter = $(".site-footer");
  let menuIsOpen = false;

  function setMenu(open, options) {
    if (!mobileMenu || !menuToggle) return;
    const shouldFocus = !options || options.focus !== false;
    menuIsOpen = open;
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.inert = !open;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "關閉選單 / Close menu" : "開啟選單 / Open menu");
    root.classList.toggle("menu-open", open);

    if (mainContent) mainContent.inert = open;
    if (siteFooter) siteFooter.inert = open;

    if (open) {
      const firstLink = mobileMenu.querySelector("a");
      if (firstLink) firstLink.focus({ preventScroll: true });
    } else if (shouldFocus) {
      menuToggle.focus({ preventScroll: true });
    }
  }

  if (menuToggle) {
    menuToggle.setAttribute("aria-label", "開啟選單 / Open menu");
    menuToggle.addEventListener("click", () => setMenu(!menuIsOpen));
  }

  if (mobileMenu) {
    $$("a", mobileMenu).forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuIsOpen) setMenu(false);
  });

  const desktopQuery = window.matchMedia("(min-width: 901px)");
  function handleDesktopChange(event) {
    if (event.matches && menuIsOpen) setMenu(false, { focus: false });
  }
  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener("change", handleDesktopChange);
  } else if (desktopQuery.addListener) {
    desktopQuery.addListener(handleDesktopChange);
  }

  /* ---------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------- */
  const revealItems = $$(".reveal");

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  $$(".hero .reveal").forEach((item, index) => {
    item.style.transitionDelay = 120 + index * 90 + "ms";
  });

  /* ---------------------------------------------------------
     Work filters (works.html only)
     --------------------------------------------------------- */
  const worksGrid = $("#works-grid");
  const cards = worksGrid ? $$(".work-card", worksGrid) : [];
  const filterButtons = $$(".filter");
  visibleCards = cards.slice();

  function cardMatchesFilter(card, filter) {
    if (filter === "all") return true;
    if (filter === "featured") return card.dataset.featured === "true";
    return card.dataset.category === filter;
  }

  function applyFilter(filter) {
    if (lightbox && lightbox.open) closeLightbox();

    filterButtons.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    cards.forEach((card) => {
      card.hidden = !cardMatchesFilter(card, filter);
    });

    visibleCards = cards.filter((card) => !card.hidden);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.dataset.filter));
  });

  /* ---------------------------------------------------------
     Lightbox (works.html only)
     --------------------------------------------------------- */
  function updateLightboxText(card) {
    if (!lightbox || !card) return;

    const lang = currentLang();
    const img = card.querySelector(".work-media img");
    const title = lang === "en" ? card.dataset.titleEn : card.dataset.titleZh;
    const location = lang === "en" ? card.dataset.locationEn : card.dataset.locationZh;
    const note = lang === "en" ? card.dataset.noteEn : card.dataset.noteZh;
    const category = lang === "en" ? card.dataset.categoryEn : card.dataset.categoryZh;

    if (img && lightboxImage) lightboxImage.alt = img.alt;
    if (lightboxTitle) lightboxTitle.textContent = title || "";
    if (lightboxLocation) lightboxLocation.textContent = location || "";
    if (lightboxNote) lightboxNote.textContent = note || "";
    if (lightboxCategory) lightboxCategory.textContent = category || "";
    if (lightboxYear) lightboxYear.textContent = card.dataset.year || "";
    if (lightboxCounter) {
      lightboxCounter.textContent =
        String(currentIndex + 1).padStart(2, "0") + " / " + String(visibleCards.length).padStart(2, "0");
    }

    if (lightboxDownload) {
      lightboxDownload.href = card.dataset.original;
      lightboxDownload.setAttribute("download", "tai-man-hin-work-" + card.dataset.id + ".jpg");
    }

    if (lightboxPrev) lightboxPrev.disabled = visibleCards.length < 2;
    if (lightboxNext) lightboxNext.disabled = visibleCards.length < 2;
  }

  function renderLightbox(index, options) {
    if (!lightbox || !lightboxImage) return;
    const settings = options || {};
    const card = visibleCards[index];
    if (!card) return;

    currentIndex = index;
    updateLightboxText(card);

    if (settings.keepMedia) return;

    fullResToken += 1;
    const token = fullResToken;

    lightboxImage.classList.add("is-loading");
    lightboxImage.removeAttribute("srcset");
    lightboxImage.src = card.dataset.preview || card.dataset.original;
    lightboxImage.width = 1800;
    lightboxImage.height = 1200;
    if (lightboxQuality) {
      lightboxQuality.textContent = "FULL RES…";
      lightboxQuality.classList.add("is-loading");
      lightboxQuality.classList.remove("is-full");
    }
    if (lightboxSize) lightboxSize.textContent = "6048 × 4032";

    const fullImage = new Image();
    fullImage.decoding = "async";

    fullImage.onload = () => {
      if (token !== fullResToken) return;
      lightboxImage.src = fullImage.src;
      lightboxImage.classList.remove("is-loading");
      if (lightboxQuality) {
        lightboxQuality.textContent = "FULL RES";
        lightboxQuality.classList.remove("is-loading");
        lightboxQuality.classList.add("is-full");
      }
      if (lightboxSize) {
        lightboxSize.textContent = fullImage.naturalWidth + " × " + fullImage.naturalHeight;
      }
    };

    fullImage.onerror = () => {
      if (token !== fullResToken) return;
      lightboxImage.classList.remove("is-loading");
      if (lightboxQuality) {
        lightboxQuality.textContent = "PREVIEW";
        lightboxQuality.classList.remove("is-loading", "is-full");
      }
    };

    fullImage.src = card.dataset.original;
  }

  function openLightbox(card) {
    if (!lightbox || !lightboxImage) return;
    const index = visibleCards.indexOf(card);
    if (index === -1) return;

    lightboxTrigger = card.querySelector(".work-media");
    renderLightbox(index);

    if (!lightbox.open) {
      lightbox.showModal();
      root.classList.add("lightbox-open");
    }

    if (lightboxClose) lightboxClose.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.open) return;
    lightbox.close();
  }

  function navigateLightbox(direction) {
    if (!lightbox || visibleCards.length < 2) return;
    const nextIndex = (currentIndex + direction + visibleCards.length) % visibleCards.length;
    renderLightbox(nextIndex);
  }

  cards.forEach((card) => {
    const trigger = card.querySelector("[data-open-work]");
    if (trigger) {
      trigger.addEventListener("click", () => openLightbox(card));
    }
  });

  if (lightbox) {
    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener("click", () => navigateLightbox(-1));
    if (lightboxNext) lightboxNext.addEventListener("click", () => navigateLightbox(1));

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateLightbox(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateLightbox(1);
      }
    });

    lightbox.addEventListener("close", () => {
      root.classList.remove("lightbox-open");
      fullResToken += 1;
      if (lightboxTrigger) {
        lightboxTrigger.focus({ preventScroll: true });
        lightboxTrigger = null;
      }
    });

    let touchStartX = null;
    let touchStartY = null;

    lightbox.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.changedTouches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      },
      { passive: true }
    );

    lightbox.addEventListener(
      "touchend",
      (event) => {
        if (touchStartX === null) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        touchStartX = null;
        touchStartY = null;
        if (Math.abs(dx) > 54 && Math.abs(dx) > Math.abs(dy)) {
          navigateLightbox(dx > 0 ? -1 : 1);
        }
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------
     Copy email (contact.html only)
     --------------------------------------------------------- */
  const copyButton = $(".copy-email");

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      /* fall through to the legacy method */
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      textarea.remove();
      return ok;
    } catch (error) {
      return false;
    }
  }

  if (copyButton) {
    const copyLabel = $(".copy-label", copyButton);
    const originalZh = copyLabel ? copyLabel.dataset.zh : "複製 Email";
    const originalEn = copyLabel ? copyLabel.dataset.en : "Copy email";
    let copyTimer = null;

    copyButton.addEventListener("click", async () => {
      const ok = await copyText(copyButton.dataset.copy || "");
      if (!ok || !copyLabel) return;

      copyLabel.dataset.zh = "已複製";
      copyLabel.dataset.en = "Copied";
      copyLabel.textContent = currentLang() === "en" ? "Copied" : "已複製";
      copyButton.classList.add("is-copied");

      window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(() => {
        copyLabel.dataset.zh = originalZh;
        copyLabel.dataset.en = originalEn;
        copyLabel.textContent = currentLang() === "en" ? originalEn : originalZh;
        copyButton.classList.remove("is-copied");
      }, 2200);
    });
  }

  /* ---------------------------------------------------------
     Apply the saved language once every element exists.
     --------------------------------------------------------- */
  setTheme(currentTheme(), { save: false });
  setLanguage(savedLang === "en" ? "en" : "zh");
})();
