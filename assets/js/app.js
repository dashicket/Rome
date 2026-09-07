(function () {
  "use strict";

  const site = window.ROME_TICKET || { config: {}, notices: [], faqs: [] };
  const config = site.config || {};
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) =>
    Array.from(context.querySelectorAll(selector));

  function buildMobileMenu() {
    const panel = $("[data-mobile-menu]");
    if (!panel) return;
    const items = [
      ["index.html", "홈", "layout-grid"],
      ["guide.html", "이용방법", "list-ordered"],
      ["faq.html", "고객센터", "messages-square"],
    ];
    panel.innerHTML = `<p class="mobile-menu__title">전체 메뉴</p><ul class="mobile-menu__links">${items.map(([href, title, icon]) => `<li><a href="${href}" data-nav-link><span class="mobile-menu__icon"><svg class="icon icon--line" aria-hidden="true"><use href="assets/icons/lucide-sprite.svg#icon-${icon}"></use></svg></span><span class="mobile-menu__copy"><span>${title}</span></span><svg class="icon icon--line mobile-menu__chevron" aria-hidden="true"><use href="assets/icons/lucide-sprite.svg#icon-chevron-right"></use></svg></a></li>`).join("")}</ul><div class="mobile-menu__contact"><p>상담이 필요하신가요?</p><div class="mobile-menu__channels"></div></div>`;
    const channels = $(".mobile-menu__channels", panel);
    $$(".header-actions [data-consult-channel]").forEach((link) => {
      channels.append(link.cloneNode(true));
    });
  }

  function setConsultationLinks() {
    function validUrl(value) {
      try {
        const url = new URL(value);
        if (url.protocol === "https:") return url.href;
      } catch {
        /* Never invent a destination for an unconfigured channel. */
      }
      return "";
    }
    const phone = String(config.phoneNumber || "").replace(/[\s()-]/g, "");
    const channels = {
      kakao: validUrl(config.kakaoUrl),
      phone: /^\+?\d{7,15}$/.test(phone) ? `tel:${phone}` : "",
    };
    const consultationLinks = $$("[data-consult-link]");
    if (consultationLinks.length) {
      const dialog = document.createElement("dialog");
      dialog.className = "consult-dialog";
      dialog.id = "consultation";
      dialog.setAttribute("aria-labelledby", "consult-title");
      dialog.setAttribute("aria-describedby", "consult-description");
      dialog.innerHTML = `<button class="consult-dialog__close" type="button" aria-label="상담 선택 닫기"><svg class="icon icon--line" aria-hidden="true"><use href="assets/icons/lucide-sprite.svg#icon-x"></use></svg></button>
        <p class="eyebrow">ROME TICKET</p>
        <h2 id="consult-title">편한 방법으로 문의하세요</h2>
        <p id="consult-description">원하시는 상담 방법을 선택해 주세요.</p>
        <div class="consult-dialog__channels">
          <a class="consult-channel consult-channel--kakao" data-channel-choice="kakao"><img src="assets/icons/kakaotalk-symbol.png" width="26" height="26" alt="">카톡문의<svg class="icon icon--line" aria-hidden="true"><use href="assets/icons/lucide-sprite.svg#icon-chevron-right"></use></svg></a>
          <a class="consult-channel consult-channel--phone" data-channel-choice="phone"><svg class="icon icon--line" aria-hidden="true"><use href="assets/icons/lucide-sprite.svg#icon-phone"></use></svg>전화문의<svg class="icon icon--line" aria-hidden="true"><use href="assets/icons/lucide-sprite.svg#icon-chevron-right"></use></svg></a>
        </div>
        <p class="consult-dialog__status" role="status" hidden></p>`;
      document.body.append(dialog);
      const channelNotice = document.createElement("p");
      channelNotice.className = "consult-channel-notice";
      channelNotice.setAttribute("role", "status");
      channelNotice.hidden = true;
      document.body.append(channelNotice);
      let noticeTimer;
      const status = $(".consult-dialog__status", dialog);
      const unavailable = (channel) => {
        status.textContent =
          channel === "phone"
            ? "지금은 전화 상담을 연결할 수 없습니다. 잠시 후 다시 이용해 주세요."
            : "지금은 카카오톡 상담을 연결할 수 없습니다. 잠시 후 다시 이용해 주세요.";
        status.hidden = false;
      };
      const configureDestination = (link, url) => {
        link.href = url;
        if (url.startsWith("https:")) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        } else {
          link.removeAttribute("target");
          link.removeAttribute("rel");
        }
      };
      $$("[data-channel-choice]", dialog).forEach((link) => {
        const channel = link.dataset.channelChoice;
        if (channels[channel]) configureDestination(link, channels[channel]);
        else {
          link.href = "#consultation";
          link.addEventListener("click", (event) => {
            event.preventDefault();
            unavailable(channel);
          });
        }
      });
      $(".consult-dialog__close", dialog).addEventListener("click", () =>
        dialog.close(),
      );
      dialog.addEventListener("click", (event) => {
        const bounds = dialog.getBoundingClientRect();
        if (
          event.target === dialog &&
          (event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom)
        )
          dialog.close();
      });
      consultationLinks.forEach((link) => {
        const channel = link.dataset.consultChannel;
        if (channels[channel]) {
          configureDestination(link, channels[channel]);
          return;
        }
        if (channel === "kakao" || channel === "phone") {
          link.removeAttribute("href");
          link.removeAttribute("target");
          link.removeAttribute("rel");
          link.removeAttribute("aria-haspopup");
          link.setAttribute("role", "button");
          link.setAttribute("tabindex", "0");
          const showNotice = (event) => {
            event.preventDefault();
            clearTimeout(noticeTimer);
            channelNotice.textContent =
              channel === "phone"
                ? "지금은 전화 상담을 연결할 수 없습니다. 잠시 후 다시 이용해 주세요."
                : "지금은 카카오톡 상담을 연결할 수 없습니다. 잠시 후 다시 이용해 주세요.";
            channelNotice.hidden = false;
            noticeTimer = setTimeout(() => {
              channelNotice.hidden = true;
            }, 3500);
          };
          link.addEventListener("click", showNotice);
          link.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") showNotice(event);
          });
          return;
        }
        link.href = "#consultation";
        link.removeAttribute("target");
        link.removeAttribute("rel");
        link.setAttribute("aria-haspopup", "dialog");
        link.addEventListener("click", (event) => {
          event.preventDefault();
          status.hidden = true;
          status.textContent = "";
          if (!dialog.open) dialog.showModal();
        });
      });
    }
    $$("[data-copyright-year]").forEach((node) => {
      node.textContent =
        config.copyrightYear || String(new Date().getFullYear());
    });
  }

  function setCurrentNavigation() {
    const file = (
      location.pathname.split("/").pop() || "index.html"
    ).toLowerCase();
    let current = file;
    if (file === "notice-detail.html" || file === "notice.html")
      current = "faq.html";
    $$("[data-nav-link]").forEach((link) => {
      const href = (link.getAttribute("href") || "")
        .split("#")[0]
        .toLowerCase();
      if (href === current) {
        link.classList.add("is-current");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function setupHeader() {
    const header = $("[data-site-header]");
    const button = $("[data-menu-toggle]");
    const panel = $("[data-mobile-menu]");
    const backdrop = $("[data-menu-backdrop]");
    if (!header || !button || !panel) return;

    const close = () => {
      const wasOpen = document.body.classList.contains("menu-open");
      document.body.classList.remove("menu-open");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "메뉴 열기");
      panel.setAttribute("aria-hidden", "true");
      panel.inert = true;
      if (wasOpen) button.focus();
    };
    const open = () => {
      document.documentElement.style.setProperty(
        "--menu-top",
        `${header.getBoundingClientRect().bottom}px`,
      );
      document.body.classList.add("menu-open");
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-label", "메뉴 닫기");
      panel.setAttribute("aria-hidden", "false");
      panel.inert = false;
      const firstLink = $("a", panel);
      if (firstLink) firstLink.focus();
    };

    button.addEventListener("click", () => {
      document.body.classList.contains("menu-open") ? close() : open();
    });
    if (backdrop) backdrop.addEventListener("click", close);
    $$("a", panel).forEach((link) => link.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (!document.body.classList.contains("menu-open") || $("dialog[open]"))
        return;
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const links = $$("a", panel);
        const focusable = [button, ...links];
        const index = focusable.indexOf(document.activeElement);
        if (event.shiftKey && index <= 0) {
          event.preventDefault();
          focusable[focusable.length - 1].focus();
        } else if (
          !event.shiftKey &&
          (index === focusable.length - 1 || index === -1)
        ) {
          event.preventDefault();
          button.focus();
        }
      }
    });
    panel.inert = true;
    window.matchMedia("(min-width: 1025px)").addEventListener("change", close);
    window.addEventListener("resize", () => {
      if (document.body.classList.contains("menu-open"))
        document.documentElement.style.setProperty(
          "--menu-top",
          `${header.getBoundingClientRect().bottom}px`,
        );
    });

    const updateHeader = () =>
      header.classList.toggle("is-scrolled", window.scrollY > 16);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  function setupSiteSearch() {
    const destinations = [
      { terms: ["소액", "휴대폰", "통신사"], url: "guide.html#small-payment" },
      {
        terms: ["정보이용료", "콘텐츠", "구글", "애플", "원스토어"],
        url: "guide.html#content-fee",
      },
      { terms: ["신용카드", "카드", "할부"], url: "guide.html#credit-card" },
      { terms: ["미납", "정책", "제한"], url: "guide.html#policy-help" },
      { terms: ["이용방법", "절차", "진행", "방법"], url: "guide.html" },
      { terms: ["공지", "운영", "소식"], url: "faq.html#notices" },
      { terms: ["faq", "질문", "궁금", "지급률", "입금"], url: "faq.html" },
    ];

    $$("[data-site-search]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = $('input[type="search"]', form);
        const query = (input ? input.value : "").trim().toLowerCase();
        if (!query) {
          if (input) {
            input.focus();
            input.setAttribute("aria-invalid", "true");
            setTimeout(() => input.removeAttribute("aria-invalid"), 1200);
          }
          return;
        }
        const matched = destinations.find((item) =>
          item.terms.some((term) => query.includes(term)),
        );
        location.href = matched
          ? matched.url
          : `guide.html?q=${encodeURIComponent(query)}#services`;
      });
    });
  }

  function setupServiceSearch() {
    const container = $("[data-service-list]");
    if (!container) return;
    const params = new URLSearchParams(location.search);
    const query = (params.get("q") || "").trim().toLowerCase();
    const status = $("[data-service-search-status]");
    if (!query) return;

    let found = 0;
    $$("[data-service-card]", container).forEach((card) => {
      const searchable =
        `${card.dataset.keywords || ""} ${card.textContent}`.toLowerCase();
      const matched = searchable.includes(query);
      card.classList.toggle("is-search-match", matched);
      card.classList.toggle("is-search-muted", !matched);
      if (matched) found += 1;
    });
    if (status) {
      status.hidden = false;
      status.innerHTML = found
        ? `<strong>“${escapeHtml(query)}”</strong> 관련 서비스 ${found}건을 표시했습니다.`
        : `<strong>“${escapeHtml(query)}”</strong>와 정확히 일치하는 항목은 없지만 전체 상담 서비스를 확인할 수 있습니다.`;
    }
  }

  function setupNoticeFilter() {
    const form = $("[data-notice-search]");
    const list = $("[data-notice-list]");
    if (!form || !list) return;
    const input = $('input[type="search"]', form);
    const rows = $$("[data-notice-row]", list);
    const empty = $("[data-notice-empty]");

    const filter = () => {
      const query = (input.value || "").trim().toLowerCase();
      let visible = 0;
      rows.forEach((row) => {
        const matched = !query || row.textContent.toLowerCase().includes(query);
        row.hidden = !matched;
        if (matched) visible += 1;
      });
      if (empty) empty.hidden = visible !== 0;
    };
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      filter();
    });
    input.addEventListener("input", filter);
  }

  function setupNoticeDetail() {
    const article = $("[data-notice-detail]");
    if (!article) return;
    const params = new URLSearchParams(location.search);
    const requested = params.get("id");
    const notice = requested
      ? site.notices.find((item) => item.id === requested)
      : site.notices[0];
    if (!notice) {
      article.innerHTML =
        '<div class="empty-state"><h1>공지사항을 찾을 수 없습니다</h1><p>주소를 확인하거나 공지사항 목록을 이용해 주세요.</p><a class="button button--outline" href="faq.html#notices">공지사항 목록</a></div>';
      document.title = "공지사항을 찾을 수 없습니다 | 로마티켓";
      $('meta[name="robots"]').setAttribute("content", "noindex,follow");
      $('script[type="application/ld+json"]')?.remove();
      return;
    }

    const title = $("[data-notice-title]", article);
    const category = $("[data-notice-category]", article);
    const date = $("[data-notice-date]", article);
    const body = $("[data-notice-body]", article);
    if (title) title.textContent = notice.title;
    if (category) category.textContent = notice.category;
    if (date) {
      date.textContent = notice.date;
      date.setAttribute("datetime", notice.date.replaceAll(".", "-"));
    }
    if (body) {
      body.innerHTML = notice.body
        .map(
          (section) => `
        <section class="notice-copy-section">
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </section>
      `,
        )
        .join("");
    }
    document.title = `${notice.title} | 로마티켓`;
    const description = $('meta[name="description"]');
    if (description) description.setAttribute("content", notice.excerpt);
    $('meta[property="og:title"]')?.setAttribute("content", document.title);
    $('meta[property="og:description"]')?.setAttribute(
      "content",
      notice.excerpt,
    );
    const schema = $('script[type="application/ld+json"]');
    if (schema)
      schema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: notice.title,
        description: notice.excerpt,
        datePublished: notice.date.replaceAll(".", "-"),
        inLanguage: "ko-KR",
        author: { "@type": "Organization", name: "로마티켓" },
      });

    const index = site.notices.findIndex((item) => item.id === notice.id);
    const prev = $("[data-notice-prev]");
    const next = $("[data-notice-next]");
    fillNoticeNavigation(prev, site.notices[index + 1], "이전 글");
    fillNoticeNavigation(next, site.notices[index - 1], "다음 글");
  }

  function fillNoticeNavigation(link, notice, label) {
    if (!link) return;
    if (!notice) {
      link.hidden = true;
      return;
    }
    link.href = `notice-detail.html?id=${encodeURIComponent(notice.id)}`;
    link.innerHTML = `<span class="notice-navigation__label"><svg class="icon icon--line" aria-hidden="true"><use href="assets/icons/lucide-sprite.svg#icon-chevron-right"></use></svg>${label}</span><strong>${escapeHtml(notice.title)}</strong>`;
  }

  function setupFaq() {
    const section = $("[data-faq-section]");
    if (!section) return;
    const input = $("[data-faq-search]", section);
    const items = $$("[data-faq-item]", section);
    const empty = $("[data-faq-empty]", section);

    const apply = () => {
      const query = (input ? input.value : "").trim().toLowerCase();
      let visible = 0;
      items.forEach((item) => {
        const queryMatch =
          !query || item.textContent.toLowerCase().includes(query);
        const show = queryMatch;
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (empty) empty.hidden = visible !== 0;
    };

    if (input) input.addEventListener("input", apply);
  }

  function setupDisclosures() {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const controls = new Map();
    $$("details").forEach((detail) => {
      const summary = $(":scope > summary", detail);
      if (!summary) return;
      let expanded = detail.open;
      let animation = null;
      const finish = () => {
        const previous = animation;
        animation = null;
        previous?.cancel();
        detail.open = expanded;
        detail.classList.remove("is-disclosure-animating");
        summary.setAttribute("aria-expanded", String(expanded));
      };
      const setOpen = (next) => {
        if (next === expanded && !animation) return;
        const start = detail.getBoundingClientRect().height;
        animation?.cancel();
        animation = null;
        expanded = next;
        summary.setAttribute("aria-expanded", String(next));
        if (
          preference.matches ||
          !detail.animate ||
          !detail.getClientRects().length
        ) {
          finish();
          return;
        }
        // Measure real heights, including wrapped mobile answers; no arbitrary max-height.
        detail.open = next;
        const end = detail.getBoundingClientRect().height;
        detail.open = true;
        detail.classList.add("is-disclosure-animating");
        animation = detail.animate(
          [{ height: start + "px" }, { height: end + "px" }],
          {
            duration: Math.min(
              380,
              Math.max(220, Math.abs(end - start) * 0.65),
            ),
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          },
        );
        animation.onfinish = finish;
      };
      controls.set(detail, { setOpen, finish });
      summary.setAttribute("aria-expanded", String(expanded));
      summary.addEventListener("click", (event) => {
        if (event.target.closest("a, button, input")) return;
        event.preventDefault();
        const next = !expanded;
        const group = detail.closest("[data-faq-section]");
        if (next && group)
          controls.forEach((control, other) => {
            if (other !== detail && group.contains(other))
              control.setOpen(false);
          });
        setOpen(next);
      });
      detail.addEventListener("toggle", () => {
        if (!animation) {
          expanded = detail.open;
          summary.setAttribute("aria-expanded", String(expanded));
        }
      });
    });
    const settle = () => controls.forEach((control) => control.finish());
    window.addEventListener("resize", settle);
    window.addEventListener("pagehide", settle);
    preference.addEventListener("change", settle);
  }

  function setupBackToTop() {
    const button = $("[data-back-to-top]");
    if (!button) return;
    const consultation = $(".quick-consult");
    const update = () => {
      const visible = window.scrollY > 300;
      button.classList.toggle("is-visible", visible);
      consultation?.classList.toggle("is-raised", visible);
    };
    button.addEventListener("click", () =>
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      }),
    );
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function setupTorchLight() {
    const hero = $(".landing-hero");
    if (!hero) return;
    const source = getComputedStyle(hero)
      .getPropertyValue("--hero-image")
      .trim();
    const path = source.match(/url\(["']?(.*?)["']?\)/)?.[1];
    if (!path) return;
    const photo = new Image();
    // CSS image URLs resolve against home.css, not the document URL.
    photo.src = new URL(
      path,
      new URL("assets/css/home.css", document.baseURI),
    ).href;
    photo
      .decode()
      .then(() => {
        const layer = document.createElement("div");
        layer.className = "hero-torch-lights";
        layer.setAttribute("aria-hidden", "true");
        layer.innerHTML =
          '<span class="hero-sunlight"></span><span class="hero-torch-light"></span><span class="hero-torch-light hero-torch-light--right"></span>';
        hero.prepend(layer);
        const lights = $$(".hero-torch-light", layer);
        const sunlight = $(".hero-sunlight", layer);
        const update = () => {
          const desktop = matchMedia("(min-width: 1025px)").matches;
          const style = getComputedStyle(hero, desktop ? "::before" : null);
          const boxWidth = desktop ? parseFloat(style.width) : hero.clientWidth;
          const boxHeight = hero.clientHeight;
          const size = style.backgroundSize.split(" ");
          const explicitHeight = size[0] === "auto" ? parseFloat(size[1]) : NaN;
          const scale = Number.isFinite(explicitHeight)
            ? explicitHeight / photo.naturalHeight
            : Math.max(
                boxWidth / photo.naturalWidth,
                boxHeight / photo.naturalHeight,
              );
          const shift = style.backgroundPositionX.match(
            /calc\(50% \+ ([\d.]+)px\)/,
          );
          const offsetX =
            (boxWidth - photo.naturalWidth * scale) / 2 +
            (shift ? Number(shift[1]) : 0);
          layer.style.left = (hero.clientWidth - boxWidth) / 2 + "px";
          layer.style.width = boxWidth + "px";
          sunlight.style.left =
            offsetX + photo.naturalWidth * scale * 0.5 + "px";
          sunlight.style.top = photo.naturalHeight * scale * 0.09 + "px";
          sunlight.style.width = photo.naturalWidth * scale * 0.52 + "px";
          sunlight.style.height = photo.naturalHeight * scale * 0.48 + "px";
          // Flame centres measured on the supplied photograph; never viewport percentages.
          [
            [0.092, 0.447],
            [0.908, 0.445],
          ].forEach(([x, y], index) => {
            const light = lights[index];
            light.style.left = offsetX + photo.naturalWidth * scale * x + "px";
            light.style.top = photo.naturalHeight * scale * y + "px";
            light.style.width = photo.naturalWidth * scale * 0.155 + "px";
            light.style.height = photo.naturalHeight * scale * 0.235 + "px";
            // Cropped-out flames must not introduce unrelated light on mobile.
            light.hidden =
              offsetX + photo.naturalWidth * scale * x < 0 ||
              offsetX + photo.naturalWidth * scale * x > boxWidth;
          });
        };
        update();
        new ResizeObserver(update).observe(hero);
        const visibility = new IntersectionObserver(([entry]) => {
          layer.classList.toggle("is-paused", !entry.isIntersecting);
        });
        visibility.observe(hero);
        document.addEventListener("visibilitychange", () =>
          layer.classList.toggle("is-document-hidden", document.hidden),
        );
      })
      .catch(() => {
        /* No light effect if the source image cannot be decoded. */
      });
  }

  function setupMotion() {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!("IntersectionObserver" in window) || !Element.prototype.animate)
      return;
    const active = new Set();
    const scenes = new Map();
    const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
    const frames = {
      marker: [
        { backgroundSize: "0% 0.24em" },
        { backgroundSize: "100% 0.24em" },
      ],
      tileFlip: [
        { opacity: 0, transform: "perspective(600px) rotateY(-90deg)" },
        { opacity: 1, transform: "perspective(600px) rotateY(0deg)" },
      ],
      heroText: [
        { opacity: 0, transform: "translateY(-6px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      heroLogo: [
        {
          opacity: 0,
          maskImage:
            "linear-gradient(to right, #000 33.333%, transparent 66.667%)",
          maskSize: "300% 100%",
          maskPosition: "100% 0%",
          maskRepeat: "no-repeat",
        },
        {
          opacity: 1,
          maskImage:
            "linear-gradient(to right, #000 33.333%, transparent 66.667%)",
          maskSize: "300% 100%",
          maskPosition: "0% 0%",
          maskRepeat: "no-repeat",
        },
      ],
      heroFade: [{ opacity: 0 }, { opacity: 1 }],
      fade: [{ opacity: 0.15 }, { opacity: 1 }],
      title: [
        {
          opacity: 0.15,
          clipPath: "inset(0 0 24% 0)",
          transform: "translateY(6px)",
        },
        { opacity: 1, clipPath: "inset(0 0 0 0)", transform: "translateY(0)" },
      ],
      image: [
        { opacity: 0.4, transform: "scale(1.035)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      icon: [
        { opacity: 0.2, transform: "scale(0.86)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      left: [
        { opacity: 0.25, transform: "translateX(-14px)" },
        { opacity: 1, transform: "translateX(0)" },
      ],
      right: [
        { opacity: 0.25, transform: "translateX(14px)" },
        { opacity: 1, transform: "translateX(0)" },
      ],
      line: [
        { opacity: 0.15, clipPath: "inset(0 100% 0 0)" },
        { opacity: 1, clipPath: "inset(0 0 0 0)" },
      ],
    };
    let fastScroll = false;
    let previousY = scrollY;
    let previousTime = performance.now();
    window.addEventListener(
      "scroll",
      () => {
        const now = performance.now();
        fastScroll =
          Math.abs(scrollY - previousY) / Math.max(now - previousTime, 16) >
          2.5;
        previousY = scrollY;
        previousTime = now;
      },
      { passive: true },
    );

    function play(node, effect = "fade", delay = 0, duration = 440) {
      if (!node || !node.getClientRects().length || preference.matches) return;
      const homeContent = node.closest(".home-featured, .home-content");
      let keyframes = frames[effect];
      if (homeContent) {
        duration = Math.min(duration * 1.65, 1100);
        delay *= 1.5;
        const emphasis = {
          fade: { opacity: 0 },
          title: {
            opacity: 0,
            clipPath: "inset(0 0 30% 0)",
            transform: "translateY(18px)",
          },
          image: { opacity: 0.15, transform: "scale(1.1)" },
          icon: { opacity: 0, transform: "scale(0.7)" },
          left: { opacity: 0, transform: "translateX(-38px)" },
          right: { opacity: 0, transform: "translateX(38px)" },
        };
        if (emphasis[effect])
          keyframes = [emphasis[effect], frames[effect].at(-1)];
      }
      const animation = node.animate(keyframes, {
        duration,
        delay,
        easing: effect === "heroLogo" ? "ease-in-out" : ease,
        fill: "backwards",
      });
      active.add(animation);
      animation.finished.then(() => active.delete(animation)).catch(() => {});
    }
    function parts(root, selector, effect, start = 0, interval = 45) {
      $$(selector, root).forEach((node, index) =>
        play(node, effect, start + Math.min(index * interval, 180)),
      );
    }
    // Stagger only neighbours in the same visual row; mobile never waits for an offscreen card.
    function rowDelay(node, step = 75) {
      const top = node.getBoundingClientRect().top;
      const row = [...node.parentElement.children].filter(
        (sibling) => Math.abs(sibling.getBoundingClientRect().top - top) < 8,
      );
      const homeContent = node.closest(".home-featured, .home-content");
      return Math.min(
        Math.max(row.indexOf(node), 0) * step * (homeContent ? 1.6 : 1),
        homeContent ? 360 : 180,
      );
    }
    function heading(root) {
      play($(".eyebrow", root), "line", 0, 380);
      play($("h1, h2", root), "title", 65, 520);
      parts(root, ".text-highlight", "marker", 260, 160);
      parts(
        root,
        ":scope > p:not(.eyebrow), :scope > .breadcrumbs",
        "fade",
        130,
      );
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          observer.unobserve(target);
          const scene = scenes.get(target);
          scenes.delete(target);
          if (
            preference.matches ||
            (fastScroll && !target.closest(".home-featured, .home-content")) ||
            target.contains(document.activeElement)
          )
            return;
          scene?.(target);
        });
      },
      { threshold: 0.15 },
    );
    function register(selector, scene, includeInitial = false) {
      $$(selector).forEach((node) => {
        // Initial content and deep links remain immediately readable. No CSS hides content.
        if (
          location.hash ||
          preference.matches ||
          (!includeInitial && node.getBoundingClientRect().top < innerHeight)
        )
          return;
        scenes.set(node, scene);
        observer.observe(node);
      });
    }

    register(
      ".landing-heading, .home-process__heading, .section-heading",
      heading,
    );
    register(
      ".home-categories",
      (node) => {
        $$(":scope > a", node).forEach((link, index) => {
          const delay = index * 110;
          play($(".home-categories__icon", link), "tileFlip", delay, 640);
          play($("strong", link), "heroFade", delay + 150, 350);
        });
      },
      true,
    );
    register(".featured-card", (node) => {
      const delay = rowDelay(node);
      // The card's hit area and centred badge never move; only their contents animate.
      play(node, "fade", delay, 380);
      play($(".featured-card__art img", node), "image", delay, 620);
      play($(".featured-card__icon .icon", node), "icon", delay + 90);
      play($(".featured-card__label", node), "line", delay + 110);
      play($("h3", node), "title", delay + 150);
      play($("p", node), "fade", delay + 190);
      play($(".landing-more", node), "fade", delay + 230);
    });
    register(".home-about__scene--consultation", (node) => {
      play($("img", node), "left", 0, 620);
      play($("figcaption", node), "fade", 150);
    });
    register(".home-about__scene--messages", (node) => {
      play($("img", node), "right", 70, 620);
      play($("figcaption", node), "line", 180);
    });
    register(".home-about__copy", (node) => {
      heading(node);
      play($(".home-about__link", node), "fade", 230);
    });
    register(".home-featured__signature", (node) => {
      play($(".eyebrow", node), "line", 0, 600);
      play($("p:last-child", node), "fade", 150);
    });
    register(".process-card, .home-process__steps > li", (node) => {
      const delay = rowDelay(node, 65);
      play(node, "fade", delay, 360);
      parts(
        node,
        ".process-card__icon .icon, .home-process__icon .icon",
        "icon",
        delay + 55,
      );
      play($("h2, h3", node), "title", delay + 105);
      play($("p", node), "fade", delay + 155);
      play($("small", node), "fade", delay + 210);
    });
    register(".guide-service", (node) => {
      const delay = rowDelay(node);
      play(node, "fade", delay);
      play($(".guide-service__icon .icon", node), "icon", delay + 40);
      parts(node, "h3, h2", "title", delay + 65);
      parts(node, "p, li", "fade", delay + 110, 35);
      play($(".guide-service__consult", node), "fade", delay + 230);
    });
    register(".guide-panel", (node) => {
      heading(node);
      parts(node, "li", "fade", 120, 60);
    });
    register(".home-support > section", (node) => {
      parts(node, ".support-heading > *", "fade", 0, 50);
      parts(node, "li, details", "fade", 90, 55);
    });
    register(".faq-item, .notice-row", (node) =>
      play(node, "fade", rowDelay(node, 35), 300),
    );
    register(".guide-consult, .cta-band", (node) => {
      parts(node, ".eyebrow, h2, p:not(.eyebrow)", "fade", 0, 55);
      parts(node, ".button", "fade", 120);
    });
    // Legal reading is intentionally quiet: no wipes or moving paragraphs.
    register(".legal-section", (node) => play(node, "fade", 0, 280));

    // First screen: editorial hierarchy, without changing hero geometry or image colour.
    if (!preference.matches && !location.hash && scrollY < 20) {
      const hero = $(".landing-hero__copy");
      if (hero) {
        play($(".landing-hero__tagline", hero), "heroText", 0, 460);
        play($(".landing-hero__intro", hero), "heroText", 180, 480);
        play($(".landing-hero__logo", hero), "heroLogo", 360, 1500);
        play($(".landing-hero__description", hero), "heroText", 580, 480);
        play($(".landing-button", hero), "heroFade", 780, 420);
        play($(".landing-hero__signature"), "heroFade", 940, 500);
      } else {
        const pageHeading = $(".page-copy");
        if (pageHeading) heading(pageHeading);
      }
    }
    const settle = () => {
      active.forEach((animation) => animation.cancel());
      active.clear();
    };
    // Interacting always wins over decoration, including a click during a stagger.
    document.addEventListener("pointerdown", settle, { passive: true });
    document.addEventListener("focusin", settle);
    window.addEventListener("hashchange", () => {
      observer.disconnect();
      scenes.clear();
      settle();
    });
    window.addEventListener("pagehide", settle);
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) settle();
    });
    preference.addEventListener("change", () => {
      if (preference.matches) {
        observer.disconnect();
        scenes.clear();
        settle();
      }
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  buildMobileMenu();
  setConsultationLinks();
  setCurrentNavigation();
  setupHeader();
  setupSiteSearch();
  setupServiceSearch();
  setupNoticeFilter();
  setupNoticeDetail();
  setupFaq();
  setupDisclosures();
  setupBackToTop();
  setupTorchLight();
  setupMotion();
})();
