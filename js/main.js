/* ============================================================
   光與影 LUMIÈRE — 互動邏輯
   燈箱 · 篩選 · 捲動動效 · 導覽
   ============================================================ */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- 載入畫面 ---------- */
  function hideLoader() {
    document.body.classList.add("is-loaded");
  }
  if (document.readyState === "complete") {
    setTimeout(hideLoader, 350);
  } else {
    window.addEventListener("load", function () { setTimeout(hideLoader, 350); });
    /* 保險:超過 2.8 秒仍未載入完,直接進站 */
    setTimeout(hideLoader, 2800);
  }

  /* ---------- 頁首捲動狀態 ---------- */
  var header = $("#siteHeader");
  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 手機版導覽 ---------- */
  var navToggle = $("#navToggle");
  var siteNav = $("#siteNav");
  navToggle.addEventListener("click", function () {
    var open = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "關閉選單" : "開啟選單");
  });
  $$(".nav-link", siteNav).forEach(function (link) {
    link.addEventListener("click", function () {
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- 導覽高亮(捲動偵測) ---------- */
  var sections = ["home", "featured", "gallery", "contact"];
  var navLinks = {};
  $$(".nav-link").forEach(function (link) {
    var id = (link.getAttribute("href") || "").replace("#", "");
    if (id) navLinks[id] = link;
  });
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          $$(".nav-link").forEach(function (l) { l.classList.remove("is-active"); });
          var link = navLinks[entry.target.id];
          if (link) link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-42% 0px -52% 0px", threshold: 0 });
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- 進場動畫 ---------- */
  var revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 作品集篩選 ---------- */
  var filterBtns = $$(".filter-btn");
  var subFilterBar = $("#subFilterBar");
  var subBtns = $$(".subfilter-btn");
  var items = $$(".g-item");
  var galleryNote = $("#galleryNote");
  var total = items.length;
  var activeFilter = "all";
  var activeSub = "all";

  function setActive(btns, btn) {
    btns.forEach(function (b) {
      var active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function findBtn(btns, attr, value) {
    var found = null;
    btns.forEach(function (b) {
      if (b.getAttribute(attr) === value) found = b;
    });
    return found;
  }

  function applyFilters() {
    var shown = 0;
    items.forEach(function (item, i) {
      var cat = item.getAttribute("data-cat");
      var sub = item.getAttribute("data-sub");
      var match;
      if (activeFilter === "all") {
        match = true;
      } else if (activeFilter === "event") {
        match = cat === "event" && (activeSub === "all" || sub === activeSub);
      } else {
        match = cat === activeFilter;
      }
      item.classList.toggle("is-hidden", !match);
      if (match) {
        shown++;
        /* 重新觸發磁磚進場動畫 */
        var link = $(".g-link", item);
        if (link) {
          link.style.animation = "none";
          void link.offsetWidth; /* reflow */
          link.style.animation = "";
          link.style.animationDelay = Math.min(i % 12, 8) * 0.045 + "s";
        }
      }
    });
    if (subFilterBar) subFilterBar.hidden = activeFilter !== "event";
    if (galleryNote) {
      galleryNote.textContent = activeFilter === "all"
        ? "共 " + total + " 件作品 · 點擊可放大檢視"
        : "顯示 " + shown + " 件作品 · 共 " + total + " 件";
    }
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setActive(filterBtns, btn);
      activeFilter = btn.getAttribute("data-filter") || "all";
      activeSub = "all";
      var allSub = findBtn(subBtns, "data-subfilter", "all");
      if (allSub) setActive(subBtns, allSub);
      applyFilters();
    });
  });

  subBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setActive(subBtns, btn);
      activeSub = btn.getAttribute("data-subfilter") || "all";
      applyFilters();
    });
  });

  /* ---------- 燈箱 ---------- */
  var lightbox = $("#lightbox");
  var lbImg = $("#lbImg");
  var lbNum = $("#lbNum");
  var lbTitle = $("#lbTitle");
  var lbDesc = $("#lbDesc");
  var lbCount = $("#lbCount");
  var lbClose = $("#lbClose");
  var lbPrev = $("#lbPrev");
  var lbNext = $("#lbNext");

  var visibleItems = [];   /* 目前可瀏覽的作品(依篩選狀態) */
  var current = 0;
  var lastFocus = null;

  function buildVisibleList() {
    visibleItems = items.filter(function (item) {
      return !item.classList.contains("is-hidden");
    });
  }

  function renderLb() {
    var item = visibleItems[current];
    if (!item) return;
    var link = $(".g-link", item);
    var full = link ? link.getAttribute("href") : "";
    var imgEl = $("img", item);

    lbImg.classList.remove("is-ready");
    lbImg.onload = function () { lbImg.classList.add("is-ready"); };
    lbImg.src = full;
    lbImg.alt = imgEl ? imgEl.getAttribute("alt") : "";

    var numEl = $(".g-num", item);
    var titleEl = $(".g-title", item);
    var catEl = $(".g-cat", item);
    lbNum.textContent = numEl ? numEl.textContent : "";
    lbTitle.textContent = titleEl ? titleEl.textContent : "";
    lbDesc.textContent = catEl ? catEl.textContent : "";
    lbCount.textContent = (current + 1) + " / " + visibleItems.length;

    var many = visibleItems.length > 1;
    lbPrev.hidden = !many;
    lbNext.hidden = !many;

    /* 預載前後一張 */
    [current + 1, current - 1].forEach(function (idx) {
      if (!many) return;
      var wrapped = (idx + visibleItems.length) % visibleItems.length;
      var it = visibleItems[wrapped];
      if (!it) return;
      var l = $(".g-link", it);
      if (l) { var im = new Image(); im.src = l.getAttribute("href"); }
    });
  }

  function openLb(item) {
    buildVisibleList();
    var idx = visibleItems.indexOf(item);
    if (idx < 0) return;
    current = idx;
    lastFocus = document.activeElement;
    document.body.classList.add("lb-open");
    lightbox.classList.add("is-open");
    renderLb();
    lbClose.focus({ preventScroll: true });
  }

  function closeLb() {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("lb-open");
    lbImg.removeAttribute("src");
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus({ preventScroll: true });
    }
  }

  function step(delta) {
    if (visibleItems.length < 2) return;
    current = (current + delta + visibleItems.length) % visibleItems.length;
    renderLb();
  }

  items.forEach(function (item) {
    var link = $(".g-link", item);
    if (!link) return;
    link.addEventListener("click", function (e) {
      e.preventDefault();
      openLb(item);
    });
  });
  /* 精選區塊亦可開啟燈箱 */
  $$(".ft-item").forEach(function (ft) {
    ft.addEventListener("click", function (e) {
      e.preventDefault();
      var id = ft.getAttribute("data-id");
      var target = items.filter(function (item) {
        return item.getAttribute("data-id") === id;
      })[0];
      if (target) {
        var wasHidden = target.classList.contains("is-hidden");
        if (wasHidden) {
          /* 若目前篩選隱藏了它,先回復為全部 */
          activeFilter = "all";
          activeSub = "all";
          var allBtn = findBtn(filterBtns, "data-filter", "all");
          if (allBtn) setActive(filterBtns, allBtn);
          var allSubBtn = findBtn(subBtns, "data-subfilter", "all");
          if (allSubBtn) setActive(subBtns, allSubBtn);
          applyFilters();
        }
        openLb(target);
      }
    });
  });

  lbClose.addEventListener("click", closeLb);
  lbPrev.addEventListener("click", function () { step(-1); });
  lbNext.addEventListener("click", function () { step(1); });
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLb();
  });
  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });
  /* 觸控滑動切換 */
  var touchX = null;
  lightbox.addEventListener("touchstart", function (e) {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 56) step(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });

  /* ---------- 複製微信號 ---------- */
  var copyBtn = $("#copyWechat");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var idEl = $("#wechatId");
      var text = idEl ? idEl.textContent.trim() : "";
      function done() {
        copyBtn.classList.add("copied");
        copyBtn.textContent = "已複製";
        clearTimeout(copyBtn._t);
        copyBtn._t = setTimeout(function () {
          copyBtn.classList.remove("copied");
          copyBtn.textContent = "複製";
        }, 1600);
      }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (err) {}
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallback(); done(); });
      } else {
        fallback();
        done();
      }
    });
  }

  /* ---------- 年份 ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
