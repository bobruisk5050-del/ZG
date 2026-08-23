/* ===== ЛОГИКА ===== */

// Тарифы: будни / выходные
const PRICES = {
  vrGames: [
    { time: "5 минут", weekday: 5, weekend: 5 },
    { time: "10 минут", weekday: 7, weekend: 7 },
    { time: "30 минут", weekday: 14, weekend: 15 },
    { time: "60 минут", weekday: 20, weekend: 25, hit: true },
    { time: "120 минут", weekday: 35, weekend: 40 }
  ],
  arena: [
    { time: "2 часа", weekday: 200, weekend: 250 },
    { time: "3 часа", weekday: 290, weekend: 350 },
    { time: "4 часа", weekday: 370, weekend: 450 }
  ],
  vrVideo: [{ time: "15 минут", weekday: 5, weekend: 5 }],
  club: [
    { time: "2 часа", weekday: 250, weekend: 310 },
    { time: "4 часа", weekday: 400, weekend: 480 },
    { time: "6 часов", weekday: 500, weekend: 700 }
  ]
};

const PRICE_CATS = [
  { id: "vrGames", title: "VR Игры" },
  { id: "arena", title: "Арена" },
  { id: "vrVideo", title: "VR Видео" },
  { id: "club", title: "Аренда клуба" }
];

const FAQ_DATA = [
  {
    question: "С какого возраста можно играть?",
    answer: "Большинство игр рассчитаны на гостей от 8 лет. Для подростков мы подберём спокойный сценарий и объясним правила перед стартом."
  },
  {
    question: "Нужно ли записываться заранее?",
    answer: "Желательно, особенно для компаний и вечерних сеансов. Позвоните нам — зафиксируем удобное время и состав команды."
  },
  {
    question: "Сколько игроков может быть одновременно?",
    answer: "На арене комфортно играют до 10 человек. Для небольших компаний есть игры на одного, двух и четырёх участников."
  },
  {
    question: "Сколько длится один сеанс?",
    answer: "Можно выбрать от 5 минут до 2 часов. На первый визит обычно хватает 60 минут, чтобы освоиться и попробовать несколько игр."
  },
  {
    question: "Безопасно ли играть в VR?",
    answer: "Да. Перед игрой администратор проведёт инструктаж, настроит пространство и останется рядом. Оборудование дезинфицируется после каждого сеанса."
  },
  {
    question: "Что делать, если стало плохо?",
    answer: "Сразу скажите администратору — мы остановим игру, снимем шлем и поможем восстановиться. Вы также можете сделать паузу в любой момент."
  },
  {
    question: "Можно отметить у вас день рождения?",
    answer: "Конечно. Забронируем арену для вашей компании, поможем выбрать игры и подготовим пространство к празднику. Условия обсудим по телефону."
  },
  {
    question: "Как можно оплатить игру?",
    answer: "Оплатить визит можно на месте наличными или банковской картой. При бронировании администратор подтвердит актуальные условия."
  }
];

const GAMES = () => (window.ZAGA_GAMES && window.ZAGA_GAMES.length ? window.ZAGA_GAMES : []);
const CLUB = () => (Array.isArray(window.CLUB_IMAGES) ? window.CLUB_IMAGES : []);
const GAME_IMGS = () => (Array.isArray(window.GAME_IMAGES) ? window.GAME_IMAGES : []);
const REVIEWS = () => (window.ZAGA_REVIEWS && window.ZAGA_REVIEWS.length ? window.ZAGA_REVIEWS : []);

function normKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\.(jpe?g|png|webp)$/i, "")
    .replace(/[^a-z0-9а-яё]+/gi, "");
}

function encodeAssetPath(path) {
  if (!path) return "";
  return String(path)
    .split("/")
    .map((seg, i) => (i === 0 ? seg : encodeURIComponent(seg)))
    .join("/");
}

function resolveGameImage(game) {
  if (!game) return "";

  if (game.image && String(game.image).trim()) {
    return encodeAssetPath(String(game.image).trim());
  }

  const list = GAME_IMGS();
  if (!list.length) return "";

  const key = normKey(game.name);
  if (!key) return "";

  let hit = list.find((img) => normKey(img.base) === key);
  if (hit) return hit.src;

  let best = null;
  let bestScore = 0;
  for (const img of list) {
    const b = normKey(img.base);
    if (!b) continue;
    let score = 0;
    if (key.includes(b) || b.includes(key)) {
      score = 50 + Math.min(b.length, key.length);
    } else {
      const tokens = String(game.name)
        .toLowerCase()
        .split(/[^a-z0-9а-яё]+/)
        .filter((t) => t.length >= 3);
      const matched = tokens.filter((t) => b.includes(t));
      if (tokens.length && matched.length === tokens.length) score = 40;
      else if (matched.length) score = 10 * matched.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = img;
    }
  }
  return best && bestScore >= 10 ? best.src : "";
}

function getClubImages() {
  return CLUB();
}

function getHeroImage() {
  const list = getClubImages();
  let named = list.find((img) => img.isHero);
  if (!named) {
    named = list.find((img) => {
      const base = String(img.file || "").replace(/\.[^.]+$/, "").toLowerCase();
      return base === "hero";
    });
  }
  if (named) return named;
  if (list.length) return list[0];
  return null;
}

function getAtmosphereImages() {
  const list = getClubImages();
  const rest = list.filter((img) => !img.isHero);
  return rest.length ? rest : list;
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SoundManager = {
  enabled: false,
  ctx: null,
  init() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    if (!this.ctx) this.ctx = new AudioContextClass();
    if (this.ctx.state === "suspended") this.ctx.resume();
    return true;
  },
  playClick() {
    if (!this.enabled || !this.init() || !this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "square";
    o.frequency.value = 1000;
    g.gain.value = 0.02;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + 0.035);
  },
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem("zaga_sound", this.enabled ? "on" : "off");
    this.updateUI();
    if (this.enabled) this.playClick();
  },
  updateUI() {
    const btn = document.getElementById("sound-toggle");
    if (!btn) return;
    if (localStorage.getItem("zaga_sound") === "on") this.enabled = true;
    btn.classList.toggle("is-on", this.enabled);
    const label = btn.querySelector(".sound-label");
    if (label) label.textContent = this.enabled ? "Вкл" : "Выкл";
    btn.setAttribute("aria-pressed", this.enabled ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      this.enabled ? "Выключить звук интерфейса" : "Включить звук интерфейса"
    );
  }
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function stars(n) {
  const r = Math.max(0, Math.min(5, Math.round(n || 0)));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function runPreloader() {
  const after = () => {
    document.body.style.overflow = "";
    const hero = document.getElementById("hero");
    const logo = document.getElementById("hero-logo");
    if (hero) hero.classList.add("ready");
    if (logo) logo.classList.add("show");
    observeElements();
  };
  if (typeof PreloaderAnim === "undefined") {
    after();
    return;
  }
  PreloaderAnim.start(after);
}

function initNav() {
  const burger = document.getElementById("burger");
  const menu = document.getElementById("mobile-menu");
  const overlay = document.getElementById("menu-overlay");
  const header = document.querySelector(".header");
  if (!burger || !menu) return;

  let scrollY = 0;

  const setExpanded = (open) => {
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Меню");
  };

  const close = () => {
    burger.classList.remove("open");
    menu.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, scrollY);
    setExpanded(false);
  };

  const openMenu = () => {
    scrollY = window.scrollY;
    burger.classList.add("open");
    menu.classList.add("open");
    if (overlay) overlay.classList.add("open");
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    setExpanded(true);
  };

  burger.addEventListener("click", () => {
    if (burger.classList.contains("open")) close();
    else openMenu();
    SoundManager.playClick();
  });

  if (overlay) overlay.addEventListener("click", close);

  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      close();
      SoundManager.playClick();
    })
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && burger.classList.contains("open")) close();
  });

  if (header) {
    window.addEventListener(
      "scroll",
      () => header.classList.toggle("scrolled", window.scrollY > 40),
      { passive: true }
    );
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const t = document.querySelector(id);
      if (t) {
        e.preventDefault();
        t.scrollIntoView({
          behavior: reducedMotion() ? "auto" : "smooth",
          block: "start"
        });
      }
    });
  });
}

function initScrollProgress() {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return;
  const update = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}


function coverHTML(game) {
  const src = (resolveGameImage(game) || "").trim();
  if (!src) {
    return `<div class="game-cover"><div class="game-cover-fallback">${game.name}</div></div>`;
  }
  return `<div class="game-cover">
    <img src="${src}" alt="${game.name}" loading="lazy" decoding="async"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
    <div class="game-cover-fallback" style="display:none">${game.name}</div>
  </div>`;
}

// Пятна
function initAmbientBlobs() {
  if (reducedMotion()) return;
  const blobs = Array.from(document.querySelectorAll(".neon-orbit"));
  if (!blobs.length) return;

  const zones = [
    { t: [0, 22], l: [0, 28] },
    { t: [0, 22], l: [55, 88] },
    { t: [35, 58], l: [2, 32] },
    { t: [35, 58], l: [55, 88] },
    { t: [65, 92], l: [0, 32] },
    { t: [65, 92], l: [50, 88] },
    { t: [18, 42], l: [32, 62] },
    { t: [48, 72], l: [28, 58] }
  ];

  const rand = (a, b) => a + Math.random() * (b - a);

  const place = (el, zoneIndex) => {
    const z = zones[zoneIndex % zones.length];
    el.style.top = rand(z.t[0], z.t[1]).toFixed(1) + "%";
    el.style.left = rand(z.l[0], z.l[1]).toFixed(1) + "%";
  };

  blobs.forEach((el, i) => {
    let zone = i;
    place(el, zone);

    const cycle = () => {
      el.classList.add("is-off");
      setTimeout(() => {
        zone = (zone + 3 + Math.floor(Math.random() * 4)) % zones.length;
        place(el, zone);
        el.classList.remove("is-off");
        const hold = 2500 + Math.random() * 3000;
        setTimeout(() => {
          el.classList.add("is-off");
          setTimeout(cycle, 700 + Math.random() * 1500);
        }, hold);
      }, 1100);
    };

    setTimeout(cycle, 2000 + i * 700 + Math.random() * 800);
  });
}

function initGames() {
  const root = document.getElementById("games-accordion");
  const featured = document.getElementById("game-featured");
  if (!root || !featured) return;
  const games = GAMES();
  if (!games.length) return;

  let coverSlot = featured.querySelector(".game-cover-slot");
  if (!coverSlot) {
    coverSlot = document.createElement("div");
    coverSlot.className = "game-cover-slot";
    featured.appendChild(coverSlot);
  }

  let indexEl = featured.querySelector(".game-featured-index");
  if (!indexEl) {
    indexEl = document.createElement("div");
    indexEl.className = "game-featured-index";
    featured.appendChild(indexEl);
  }

  const showCover = (i) => {
    const g = games[i];
    if (!g) return;
    const total = games.length;
    const apply = () => {
      coverSlot.innerHTML = coverHTML(g);
      indexEl.innerHTML = `<span>${pad(i + 1)}</span> / ${pad(total)}`;
    };
    if (reducedMotion()) {
      apply();
      return;
    }
    featured.classList.add("is-swap");
    setTimeout(() => {
      apply();
      featured.classList.remove("is-swap");
    }, 180);
  };

  root.innerHTML = games
    .map((g, i) => {
      const cover = coverHTML(g);
      return `
      <div class="game-acc-item" data-game-index="${i}">
        <h3>
          <button class="game-acc-btn" type="button"
            aria-expanded="false" aria-controls="game-panel-${i + 1}" id="game-btn-${i + 1}">
            <span class="game-acc-num">${pad(i + 1)}</span>
            <span class="game-acc-name">${g.name}</span>
            <span class="game-acc-meta">${g.players}</span>
            <span class="game-acc-arrow" aria-hidden="true"></span>
          </button>
        </h3>
        <div class="game-acc-panel" id="game-panel-${i + 1}" role="region"
          aria-labelledby="game-btn-${i + 1}" aria-hidden="true">
          <div class="game-acc-panel-inner">
            <div class="game-acc-cover">${cover}</div>
            <p class="game-acc-desc">${g.desc}</p>
            <div class="game-acc-tags">
              <span>${g.genre}</span><span>${g.age}</span><span>${g.players}</span>
            </div>
          </div>
        </div>
      </div>`;
    })
    .join("");

  const items = Array.from(root.querySelectorAll(".game-acc-item"));

  const closeItem = (item) => {
    const button = item.querySelector(".game-acc-btn");
    const panel = item.querySelector(".game-acc-panel");
    item.classList.remove("open");
    button?.setAttribute("aria-expanded", "false");
    panel?.setAttribute("aria-hidden", "true");
  };

  const openItem = (item) => {
    const button = item.querySelector(".game-acc-btn");
    const panel = item.querySelector(".game-acc-panel");
    item.classList.add("open");
    button?.setAttribute("aria-expanded", "true");
    panel?.setAttribute("aria-hidden", "false");
    const idx = Number(item.dataset.gameIndex);
    if (!Number.isNaN(idx) && window.matchMedia("(min-width: 901px)").matches) {
      showCover(idx);
    }
  };

  items.forEach((item) => {
    const button = item.querySelector(".game-acc-btn");
    if (!button) return;
    button.addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      items.forEach((other) => closeItem(other));
      if (!wasOpen) openItem(item);
      SoundManager.playClick();
    });
  });

  if (items[0]) openItem(items[0]);
  else showCover(0);
}

function initHeroBg() {
  const visual = document.getElementById("hero-visual");
  const hero = document.getElementById("hero");
  if (!visual || !hero) return;

  const candidates = [];
  const imgData = getHeroImage();
  if (imgData && imgData.src) candidates.push(imgData.src);
  [
    "assets/club/hero.jpg",
    "assets/club/hero.jpeg",
    "assets/club/hero.png",
    "assets/club/hero.webp",
    "assets/club/hero.JPG",
    "assets/club/hero.JPEG",
    "assets/club/hero.PNG",
    "assets/club/hero.WEBP"
  ].forEach((p) => {
    if (!candidates.includes(p)) candidates.push(p);
  });

  let photo = visual.querySelector("img.hero-photo");
  if (!photo) {
    photo = document.createElement("img");
    photo.className = "hero-photo";
    photo.fetchPriority = "high";
    photo.decoding = "async";
    photo.alt = (imgData && imgData.alt) || "ZAGA GAME";
    visual.insertBefore(photo, visual.firstChild);
  }

  let i = 0;
  const fail = () => {
    photo.remove();
    hero.classList.remove("has-photo");
  };
  const tryNext = () => {
    if (i >= candidates.length) {
      fail();
      return;
    }
    const src = candidates[i++];
    photo.onerror = tryNext;
    photo.onload = () => {
      hero.classList.add("has-photo");
      photo.onerror = null;
    };
    photo.src = src;
  };
  tryNext();
}

function initAtmosphere() {
  const section = document.getElementById("atmosphere");
  const grid = document.getElementById("atmosphere-grid");
  if (!section || !grid) return;

  const pick = getAtmosphereImages();
  if (!pick.length) {
    section.hidden = true;
    grid.innerHTML = "";
    return;
  }

  const n = pick.length;
  const mod = n === 1 ? "1" : n === 2 ? "2" : "many";
  grid.className = "atmosphere-grid atmosphere-grid--" + mod;

  grid.innerHTML = pick
    .map(
      (img, i) => `
    <button type="button" class="atm-item" data-atm-index="${i}" aria-label="Открыть фото ${i + 1}">
      <img src="${img.src}" alt="${img.alt || "ZAGA GAME — фото клуба"}"
        loading="lazy" decoding="async"
        onerror="this.closest('.atm-item')?.remove()">
    </button>`
    )
    .join("");

  section.hidden = false;
  initLightbox(pick);
}

// Галерея
function initLightbox(images) {
  if (!images || !images.length) return;

  let box = document.getElementById("lightbox");
  if (!box) {
    box = document.createElement("div");
    box.id = "lightbox";
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Просмотр фото");
    box.innerHTML = `
      <button type="button" class="lightbox-close" aria-label="Закрыть">×</button>
      <button type="button" class="lightbox-prev" aria-label="Предыдущее">‹</button>
      <div class="lightbox-img-wrap"><img src="" alt=""></div>
      <button type="button" class="lightbox-next" aria-label="Следующее">›</button>
      <div class="lightbox-counter"></div>`;
    document.body.appendChild(box);
  }

  const imgEl = box.querySelector(".lightbox-img-wrap img");
  const counter = box.querySelector(".lightbox-counter");
  let index = 0;

  const show = (i) => {
    index = (i + images.length) % images.length;
    const item = images[index];
    imgEl.src = item.src;
    imgEl.alt = item.alt || "ZAGA GAME";
    counter.textContent = `${index + 1} / ${images.length}`;
  };

  const open = (i) => {
    show(i);
    box.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    box.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  document.querySelectorAll(".atm-item[data-atm-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      open(Number(btn.dataset.atmIndex) || 0);
      SoundManager.playClick();
    });
  });

  box.querySelector(".lightbox-close").addEventListener("click", close);
  box.querySelector(".lightbox-prev").addEventListener("click", () => {
    show(index - 1);
    SoundManager.playClick();
  });
  box.querySelector(".lightbox-next").addEventListener("click", () => {
    show(index + 1);
    SoundManager.playClick();
  });
  box.addEventListener("click", (e) => {
    if (e.target === box) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!box.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  let touchX = null;
  box.addEventListener(
    "touchstart",
    (e) => {
      touchX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  box.addEventListener(
    "touchend",
    (e) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].screenX - touchX;
      touchX = null;
      if (Math.abs(dx) < 40) return;
      if (dx > 0) show(index - 1);
      else show(index + 1);
    },
    { passive: true }
  );
}

function initReviews() {
  const list = document.getElementById("reviews-list");
  const ratingEl = document.getElementById("reviews-rating");
  if (!list) return;
  const items = REVIEWS();
  if (!items.length) {
    const sec = document.getElementById("reviews");
    if (sec) sec.hidden = true;
    return;
  }

  if (ratingEl && window.ZAGA_RATING && window.ZAGA_RATING.value) {
    const r = window.ZAGA_RATING;
    ratingEl.hidden = false;
    ratingEl.innerHTML = `<strong>${r.value}</strong> / 5 · ${r.source || "Яндекс Карты"}${
      r.count ? ` · ${r.count} оценок` : ""
    }`;
  }

  list.innerHTML = items
    .map(
      (r, i) => `
    <article class="review-item fade-up">
      <div class="review-num">${pad(i + 1)}</div>
      <div>
        <p class="review-text">«${r.text}»</p>
        <div class="review-meta">
          <span>${r.name || ""}</span>
          <span class="stars" aria-label="${r.rating} из 5">${stars(r.rating)}</span>
          <span>${r.source || ""}</span>
        </div>
      </div>
    </article>`
    )
    .join("");
}

function initFAQ() {
  const list = document.getElementById("faq-list");
  if (!list) return;
  list.innerHTML = FAQ_DATA.map(
    (item, index) => `
      <div class="faq-item fade-up">
        <h3>
          <button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-answer-${index + 1}" id="faq-question-${index + 1}">
            <span>${item.question}</span><span class="faq-arrow" aria-hidden="true"></span>
          </button>
        </h3>
        <div class="faq-answer" id="faq-answer-${index + 1}" role="region" aria-labelledby="faq-question-${index + 1}" aria-hidden="true">
          <div class="faq-answer-inner">${item.answer}</div>
        </div>
      </div>`
  ).join("");

  const items = Array.from(list.querySelectorAll(".faq-item"));

  const closeItem = (item) => {
    const button = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    item.classList.remove("open");
    button?.setAttribute("aria-expanded", "false");
    answer?.setAttribute("aria-hidden", "true");
  };

  const openItem = (item) => {
    const button = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    item.classList.add("open");
    button?.setAttribute("aria-expanded", "true");
    answer?.setAttribute("aria-hidden", "false");
  };

  items.forEach((item) => {
    const button = item.querySelector(".faq-question");
    if (!button) return;
    button.addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      items.forEach((other) => {
        if (other !== item) closeItem(other);
      });
      if (wasOpen) closeItem(item);
      else openItem(item);
      SoundManager.playClick();
    });
  });
}

const BYN_SIGN = `<svg class="byn-sign" viewBox="0 0 360.67 446.4" aria-hidden="true" focusable="false"><path fill="currentColor" d="M475.61,528.84c0-72.5-62.75-131.27-140.16-131.27H227.58V263.37H426v-49.6H178v290h-63.1v49.7H178V660.17h49.54l107.92-.07c77.36,0,140.11-58.77,140.11-131.26Zm-248-25.1V447.1c35.89,0,72.35.07,107.87.07,50,0,90.56,36.57,90.56,81.67s-40.54,81.67-90.56,81.7l-107.87,0V553.44h112.7v-49.7Z" transform="translate(-114.94 -213.77)"/></svg>`;

function initPrices() {
  let day = "weekday";
  let cat = "vrGames";
  const daySwitch = document.getElementById("day-switch");
  const catsEl = document.getElementById("price-cats");
  const blocksEl = document.getElementById("price-blocks");
  if (!daySwitch || !catsEl || !blocksEl) return;

  PRICE_CATS.forEach((c, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = c.title;
    if (i === 0) b.classList.add("active");
    b.addEventListener("click", () => {
      cat = c.id;
      catsEl.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      render(true);
      SoundManager.playClick();
    });
    catsEl.appendChild(b);
  });

  daySwitch.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      day = btn.dataset.day;
      daySwitch.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      render(true);
      SoundManager.playClick();
    });
  });

  function render(animate) {
    const rows = PRICES[cat] || [];
    const html = rows
      .map((r) => {
        const price = day === "weekend" ? r.weekend : r.weekday;
        return `
        <div class="price-block${r.hit ? " hit" : ""}">
          <div class="pb-time">${r.time}</div>
          <div class="pb-price">${price}${BYN_SIGN}</div>
        </div>`;
      })
      .join("");
    if (animate && !reducedMotion()) {
      blocksEl.classList.add("is-updating");
      setTimeout(() => {
        blocksEl.innerHTML = html;
        blocksEl.classList.remove("is-updating");
      }, 160);
    } else {
      blocksEl.innerHTML = html;
    }
  }
  render(false);
}

// Анимация блоков при скролле
function observeElements() {
  if (reducedMotion()) {
    document.querySelectorAll(".fade-up, .reveal-title, .reveal-scale").forEach((el) =>
      el.classList.add("visible")
    );
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("visible");
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -24px 0px" }
  );
  document.querySelectorAll(".fade-up, .reveal-title, .reveal-scale").forEach((el) =>
    obs.observe(el)
  );
}


function initBackToTop() {
  const button = document.getElementById("back-to-top");
  if (!button) return;

  const update = () => {
    const visible = window.scrollY > 500;
    button.classList.toggle("is-visible", visible);
    button.setAttribute("aria-hidden", visible ? "false" : "true");
    button.tabIndex = visible ? 0 : -1;
  };

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
    SoundManager.playClick();
  });
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initFabHide() {
  const book = document.getElementById("book");
  if (!book || !window.IntersectionObserver) return;
  const obs = new IntersectionObserver(
    ([e]) => document.body.classList.toggle("near-cta", e.isIntersecting),
    { threshold: 0.2 }
  );
  obs.observe(book);
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.style.overflow = "hidden";
  SoundManager.updateUI();
  document.getElementById("sound-toggle")?.addEventListener("click", () => SoundManager.toggle());

  // Разблокировка AudioContext после первого клика/тача
  const unlock = () => {
    SoundManager.init();
    document.removeEventListener("click", unlock);
    document.removeEventListener("touchstart", unlock);
  };
  document.addEventListener("click", unlock);
  document.addEventListener("touchstart", unlock);

  initNav();
  initAmbientBlobs();
  initGames();
  initHeroBg();
  initAtmosphere();
  initReviews();
  initFAQ();
  initPrices();
  initScrollProgress();
  initFabHide();
  runPreloader();
});
