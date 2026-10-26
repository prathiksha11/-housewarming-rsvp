(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Interactive paper invitation, optional and never a gate to the real RSVP.
  const openButton = $("#open-letter");
  const letter = $("#invitation-letter");
  const closeButton = $("#close-letter");
  let navClosing = false;
  if (openButton && letter && typeof letter.showModal === "function") {
    openButton.addEventListener("click", () => {
      navClosing = false;
      if (!letter.open) letter.showModal();
      document.body.classList.add("dialog-open");
    });
    closeButton?.addEventListener("click", () => letter.close());
    letter.addEventListener("click", (event) => {
      if (event.target === letter) letter.close();
    });
    letter.querySelectorAll("a[href^='#']").forEach((link) => {
      link.addEventListener("click", () => { navClosing = true; letter.close(); });
    });
    letter.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      if (!navClosing) openButton.focus({ preventScroll: true });
    });
  }

  // Bring the illustration to life with touch. It never replaces the real art.
  const artCard = $("#art-card");
  const lightButton = $("#light-home");
  const lightMessage = $("#house-light-message");
  let messageTimeout = 0;
  lightButton?.addEventListener("click", () => {
    const lit = artCard?.classList.toggle("is-lit") || false;
    lightButton.setAttribute("aria-pressed", String(lit));
    lightButton.querySelector("span")?.replaceChildren(document.createTextNode(lit ? "Lights are glowing ✦" : "Tap to light up our home"));
    if (lightMessage) {
      lightMessage.textContent = lit ? "The lights are on. Come celebrate!" : "Our doors are always open.";
      lightMessage.classList.add("show");
      clearTimeout(messageTimeout);
      messageTimeout = window.setTimeout(() => lightMessage.classList.remove("show"), 2600);
    }
    if (!reduced && lit) {
      const stage = $(".hero-art");
      if (stage) {
        for (let i = 0; i < 9; i++) {
          const spark = document.createElement("span");
          spark.className = "house-light-spark";
          spark.textContent = i % 2 ? "✧" : "✦";
          spark.setAttribute("aria-hidden", "true");
          spark.style.cssText = "left:" + (22 + (i * 13) % 58) + "%;top:" +
            (22 + (i * 17) % 50) + "%;--sx:" + ((i % 3 - 1) * 40) +
            "px;--sy:" + (-28 - (i % 4) * 19) + "px;animation-delay:" + (i * 35) + "ms";
          stage.appendChild(spark);
          window.setTimeout(() => spark.remove(), 1300);
        }
      }
    }
  });

  // Native swipeable itinerary with a tap-friendly alternative.
  const rail = $("#peek-window");
  const cards = [...document.querySelectorAll(".peek-card")];
  const dots = [...document.querySelectorAll("[data-peek-index]")];
  const currentLabel = $("#peek-position");
  const prev = $("#peek-prev");
  const next = $("#peek-next");
  let activeIndex = 0;
  let scrollFrame = 0;
  function showPosition(index) {
    activeIndex = Math.min(Math.max(0, index), cards.length - 1);
    if (currentLabel) currentLabel.textContent = (activeIndex + 1).toString().padStart(2, "0") + " / " + cards.length.toString().padStart(2, "0");
    dots.forEach((dot, idx) => dot.setAttribute("aria-current", String(idx === activeIndex)));
    if (prev) prev.disabled = activeIndex === 0;
    if (next) next.disabled = activeIndex === cards.length - 1;
  }
  function goTo(index) {
    if (!rail || !cards.length) return;
    const item = cards[Math.min(Math.max(0, index), cards.length - 1)];
    const left = item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2;
    rail.scrollTo({ left, behavior: reduced ? "instant" : "smooth" });
    showPosition(cards.indexOf(item));
  }
  if (rail && cards.length) {
    dots.forEach((dot, index) => dot.addEventListener("click", () => goTo(index)));
    prev?.addEventListener("click", () => goTo(activeIndex - 1));
    next?.addEventListener("click", () => goTo(activeIndex + 1));
    rail.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") { event.preventDefault(); goTo(activeIndex + 1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); goTo(activeIndex - 1); }
    });
    rail.addEventListener("scroll", () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const midpoint = rail.scrollLeft + rail.clientWidth / 2;
        let closest = 0;
        let distance = Infinity;
        cards.forEach((card, index) => {
          const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - midpoint);
          if (d < distance) { closest = index; distance = d; }
        });
        showPosition(closest);
      });
    }, { passive: true });
    showPosition(0);
  }
  document.querySelectorAll("[data-add-to-calendar]").forEach((button) => {
    button.addEventListener("click", () => $("#calendar-download")?.click());
  });

  // Visually mirror the chosen party size without collecting or storing any data.
  const partySize = $("#party-size");
  const partyField = partySize?.closest(".form-field");
  const attendeeYes = $("#attend-yes");
  const attendeeNo = $("#attend-no");
  if (partySize && partyField) {
    const preview = document.createElement("div");
    preview.className = "party-preview";
    preview.hidden = true;
    preview.setAttribute("aria-live", "polite");
    partyField.insertAdjacentElement("afterend", preview);
    function updatePeople() {
      const count = Math.min(8, Math.max(1, Number(partySize.value) || 1));
      preview.hidden = !attendeeYes?.checked;
      if (preview.hidden) return;
      const sentence = document.createElement("span");
      sentence.textContent = count === 1 ? "Just you. Lovely!" : "A party of " + count + ". Wonderful!";
      const dots = document.createElement("span");
      dots.className = "party-dots";
      dots.setAttribute("aria-hidden", "true");
      for (let i = 0; i < count; i++) dots.appendChild(document.createElement("i"));
      preview.replaceChildren(sentence, dots);
    }
    partySize.addEventListener("change", updatePeople);
    attendeeYes?.addEventListener("change", updatePeople);
    attendeeNo?.addEventListener("change", updatePeople);
    updatePeople();
  }

  // One-thumb RSVP shortcut for guests reading on their phones.
  const dock = $("#mobile-rsvp-dock");
  const rsvp = $("#rsvp");
  let pendingFrame = false;
  function updateDock() {
    pendingFrame = false;
    if (!dock || !rsvp) return;
    const focus = document.activeElement;
    const editing = focus instanceof HTMLElement && !!focus.closest("input, textarea, select, [contenteditable='true']");
    const rect = rsvp.getBoundingClientRect();
    const outOfHero = window.scrollY > 370;
    const farFromRsvp = rect.top > window.innerHeight - 120 || rect.bottom < 0;
    const show = window.innerWidth <= 930 && outOfHero && farFromRsvp && !editing && !letter?.open;
    dock.classList.toggle("is-visible", !!show);
    dock.setAttribute("aria-hidden", String(!show));
    if (show) dock.removeAttribute("inert"); else dock.setAttribute("inert", "");
  }
  function scheduleDock() {
    if (!pendingFrame) { pendingFrame = true; requestAnimationFrame(updateDock); }
  }
  document.addEventListener("scroll", scheduleDock, { passive: true });
  window.addEventListener("resize", scheduleDock);
  document.addEventListener("focusin", scheduleDock);
  document.addEventListener("focusout", () => window.setTimeout(scheduleDock, 30));
  letter?.addEventListener("close", scheduleDock);
  letter?.addEventListener("cancel", scheduleDock);
  dock?.querySelector("a")?.addEventListener("click", () => { dock.classList.remove("is-visible"); });
  scheduleDock();
})();
