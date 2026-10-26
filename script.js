/* A story that begins at the front door. Lightweight and touch-first. */
(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const config = window.HOUSEWARMING_CONFIG || {};

  // The main moment: two folk-art doors open to reveal the actual illustrated home.
  const theatre = $("#theatre");
  const doorButton = $("#door-button");
  const caption = $("#stage-caption");
  const petals = $("#petal-layer");
  let doorOpen = false;
  const makePetals = (parent, amount = 20) => {
    if (!parent || reduced) return;
    const shapes = ["✿", "❀", "✧", "✺", "✦"];
    for (let i = 0; i < amount; i++) {
      const dot = document.createElement("span");
      dot.className = "petal";
      dot.textContent = shapes[i % shapes.length];
      dot.style.setProperty("--dx", `${Math.round(Math.cos(i * 2.399) * (66 + i * 5))}px`);
      dot.style.setProperty("--dy", `${Math.round(Math.sin(i * 2.399) * (46 + i * 4) - 38)}px`);
      dot.style.setProperty("--spin", `${i * 73}deg`);
      dot.style.fontSize = `${12 + (i % 4) * 4}px`;
      dot.style.animationDelay = `${(i % 5) * 55}ms`;
      dot.setAttribute("aria-hidden", "true");
      parent.append(dot);
      setTimeout(() => dot.remove(), 2300);
    }
  };
  if (theatre && doorButton) {
    doorButton.addEventListener("click", () => {
      doorOpen = !doorOpen;
      theatre.classList.toggle("is-open", doorOpen);
      doorButton.setAttribute("aria-pressed", String(doorOpen));
      $("#door-button-copy").textContent = doorOpen ? "Our doors are open!" : "Tap to open our doors";
      caption.textContent = doorOpen ? "Come in! We've been waiting for you. ✿" : "A little magic is waiting on the other side.";
      if (doorOpen) {
        makePetals(petals, 24);
        if (navigator.vibrate) navigator.vibrate(12);
      }
    });
  }

  // Swipeable Pattachitra postcards. Native scroll snap handles swipe physics.
  const viewport = $("#postcard-viewport");
  const slides = $$(".postcard");
  const dots = $$(".card-dot");
  const prev = $("#previous-card");
  const next = $("#next-card");
  let current = 0;
  function drawNav(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === current);
      if (i === current) dot.setAttribute("aria-current", "true"); else dot.removeAttribute("aria-current");
    });
    if (prev) prev.disabled = current === 0;
    if (next) next.disabled = current === slides.length - 1;
  }
  function scrollCard(index) {
    if (!viewport || !slides[index] || !slides[0]) return;
    const target = slides[index].offsetLeft - slides[0].offsetLeft;
    viewport.scrollTo({ left: target, behavior: reduced ? "instant" : "smooth" });
    drawNav(index);
  }
  prev?.addEventListener("click", () => scrollCard(Math.max(0, current - 1)));
  next?.addEventListener("click", () => scrollCard(Math.min(slides.length - 1, current + 1)));
  dots.forEach((dot, i) => dot.addEventListener("click", () => scrollCard(i)));
  if (viewport && slides.length > 0) {
    let scrollScheduled = false;
    viewport.addEventListener("scroll", () => {
      if (scrollScheduled) return;
      scrollScheduled = true;
      requestAnimationFrame(() => {
        scrollScheduled = false;
        let closest = 0;
        let distance = Infinity;
        for (let i = 0; i < slides.length; i++) {
          const d = Math.abs((slides[i].offsetLeft - slides[0].offsetLeft) - viewport.scrollLeft);
          if (d < distance) { closest = i; distance = d; }
        }
        drawNav(closest);
      });
    }, { passive: true });
    viewport.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
        ev.preventDefault();
        scrollCard(current + (ev.key === "ArrowRight" ? 1 : -1));
      }
    });
  }

  // Three small blessings. All changes are client-side, no data collection.
  const wishes = {
    joy: "May these rooms always echo with laughter. ✿",
    light: "May every new morning bring a little sunshine. ✺",
    love: "May there always be room for one more at the table. ♡"
  };
  $$(".blessing-choice").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".blessing-choice").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      const display = $("#blessing-message");
      if (display) {
        display.textContent = wishes[button.dataset.wish] || "May the home be full of joy.";
        display.classList.remove("flower-bloom");
        void display.offsetWidth;
        display.classList.add("flower-bloom");
      }
      makePetals(button, 5);
    });
  });

  // Event time in Meridian, Idaho, after US daylight saving ends in November.
  const eventTime = new Date(config.eventDate || "2026-11-07T18:00:00-07:00");
  $("#calendar-download")?.addEventListener("click", () => {
    if (Number.isNaN(eventTime.getTime())) return;
    const iso = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const icsEscape = (text) => String(text).replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(";", "\\;").replaceAll("\n", "\\n");
    const content = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Home Celebration//Housewarming//EN", "BEGIN:VEVENT",
      "UID:housewarming-20261107@invitation", "DTSTAMP:" + iso(new Date()),
      "DTSTART:" + iso(eventTime), "DTEND:" + iso(new Date(eventTime.getTime() + 2.5 * 60 * 60 * 1000)),
      "SUMMARY:" + icsEscape(config.eventTitle || "Housewarming Celebration"),
      "LOCATION:" + icsEscape(config.eventAddress || "1295 W Giantsbane Dr, Meridian, ID 83642"),
      "DESCRIPTION:Please join us for dinner from 6 PM.", "END:VEVENT", "END:VCALENDAR", ""
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "housewarming-invitation.ics";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  // The protected provider is enabled after a live preview has been verified.
  const workerRsvp = config.rsvpProvider === "cloudflare" || new URLSearchParams(location.search).get("rsvp-preview") === "1";
  const api = String(config.rsvpApi || "").replace(/\/$/, "");
  const endpoint = String(config.formEndpoint || "").trim();
  const enabled = workerRsvp ? api === "https://housewarming-rsvp.prathiksha11.workers.dev" && Boolean(config.turnstileSitekey) : /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9_-]+\/?$/.test(endpoint);
  const form = $("#rsvp-form");
  const yes = $("#attend-yes");
  const no = $("#attend-no");
  const extras = $("#attendance-extra");
  const submit = $("#rsvp-submit");
  const feedback = $("#form-feedback");
  const success = $("#success-state");
  const initialSubmit = submit?.innerHTML || "Send my RSVP";
  let verificationToken = "";
  let widgetId = null;
  let sending = false;
  let pendingRequest = null;
  const verification = $("#rsvp-verification");
  const verificationStatus = $("#verification-status");
  function syncSubmit() {
    if (submit) submit.disabled = !enabled || sending || (workerRsvp && !verificationToken);
  }
  function resetVerification() {
    verificationToken = "";
    if (verificationStatus) verificationStatus.textContent = "Checking you're ready to send…";
    if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
    syncSubmit();
  }
  if (verification) verification.hidden = !workerRsvp;
  if (workerRsvp && form) {
    window.onRsvpVerificationReady = () => {
      if (widgetId !== null) return;
      widgetId = window.turnstile.render("#turnstile-widget", {
        sitekey: config.turnstileSitekey,
        size: "flexible",
        theme: "light",
        callback: (token) => {
          verificationToken = token;
          verificationStatus.textContent = "Ready to send your RSVP.";
          syncSubmit();
        },
        "expired-callback": resetVerification,
        "error-callback": () => {
          verificationToken = "";
          verificationStatus.textContent = "Verification couldn't finish. Tap Retry verification below.";
          syncSubmit();
        }
      });
    };
    if (window.turnstile) window.onRsvpVerificationReady();
    else {
      const verificationScript = document.createElement("script");
      verificationScript.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onRsvpVerificationReady";
      verificationScript.async = true;
      verificationScript.addEventListener("error", () => {
        verificationStatus.textContent = "Verification couldn't load. Check your connection and reload this page.";
      });
      document.head.append(verificationScript);
    }
    $("#retry-verification")?.addEventListener("click", resetVerification);
  }
  syncSubmit();
  function showError(message) {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.hidden = false;
    feedback.scrollIntoView({ block: "nearest", behavior: reduced ? "instant" : "smooth" });
  }
  function clearError() {
    if (!feedback) return;
    feedback.textContent = "";
    feedback.hidden = true;
  }
  function updateGuestPreview() {
    const count = Math.max(1, Math.min(8, Number($("#party-size")?.value || 1)));
    const icons = $("#little-people-icons");
    const label = $("#guest-preview");
    if (icons) icons.innerHTML = drawTruck(count);
    if (label) label.textContent = count === 1 ? "A place just for you" : `We're saving ${count} places for your party`;
  }
  // Only anonymous aggregate numbers are read from the public endpoint.
  function drawTruck(count) {
    let passengers = "";
    for (let i = 0; i < count; i++) {
      const x = 42 + i * 28;
      const skin = ["#bc7b4c", "#e6a36a", "#8a583f", "#d1915b"][i % 4];
      const shirt = ["#b73542", "#e6ba62", "#557b69", "#315170"][i % 4];
      passengers += '<g transform="translate(' + x + ',0)"><circle cy="65" r="11" fill="' + skin + '" stroke="#1d3042" stroke-width="2"/><path d="M-10 63 Q0 45 10 63" fill="#23384a"/><path d="M-13 99 Q-12 75 0 77 Q12 75 13 99" fill="' + shirt + '" stroke="#1d3042" stroke-width="2"/><circle cx="-3" cy="65" r="1"/><circle cx="3" cy="65" r="1"/></g>';
    }
    return '<svg class="folk-truck" viewBox="0 0 340 175" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="12" width="324" height="151" rx="5" fill="#fff2d7" stroke="#b4874f" stroke-width="2"/><path d="M15 21 H325 M15 155 H325" stroke="#b03439" stroke-width="3" stroke-dasharray="4 5"/><text x="170" y="43" text-anchor="middle" fill="#9e2c38" font-size="13" letter-spacing="2">✿ ON OUR WAY HOME ✿</text>' + passengers + '<path d="M20 100 H260 V137 H20 Z" fill="#a82f3b" stroke="#203348" stroke-width="4"/><path d="M260 112 H290 L310 126 V137 H260 Z" fill="#d6a652" stroke="#203348" stroke-width="4"/><path d="M273 115 H286 L296 124 H273 Z" fill="#b8d7cf"/><path d="M28 107 H252 M28 130 H252" stroke="#f3c778" stroke-width="2" stroke-dasharray="5 4"/><text x="138" y="124" text-anchor="middle" font-size="15" fill="#ffe4a6">✿ ❋ ✿ ❋ ✿ ❋ ✿</text><circle cx="68" cy="140" r="15" fill="#23384a" stroke="#e6bb71" stroke-width="4"/><circle cx="68" cy="140" r="4" fill="#f9e1ad"/><circle cx="270" cy="140" r="15" fill="#23384a" stroke="#e6bb71" stroke-width="4"/><circle cx="270" cy="140" r="4" fill="#f9e1ad"/></svg>';
  }
  let countRequestRunning = false;
  async function updateSharedTotal() {
    const section = $("#attendance-parade");
    if (!section || !workerRsvp || countRequestRunning) return;
    section.hidden = false;
    countRequestRunning = true;
    try {
      const response = await fetch(api + "/count", { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error("Count unavailable");
      const data = await response.json();
      const total = Number(data.total);
      if (!Number.isSafeInteger(total) || total < 0) throw new Error("Invalid count");
      $("#attendance-total").textContent = total === 1 ? "1 guest is coming!" : total + " guests are coming!";
      $("#attendance-count-note").textContent = "Live total from this RSVP form · names stay private";
      const shown = Math.min(total, 80);
      let trucks = "";
      for (let i = 0; i < Math.max(shown, 1); i += 8) trucks += drawTruck(Math.min(8, Math.max(0, shown - i)));
      $("#attendance-trucks").innerHTML = trucks;
      $("#attendance-overflow").textContent = total > shown ? "And " + (total - shown) + " more guests!" : "";
      $("#attendance-trucks").setAttribute("aria-label", total + " confirmed guests on their way to the celebration");
    } catch {
      $("#attendance-count-note").textContent = "Live count is temporarily unavailable. Please check back shortly.";
      if ($("#attendance-total").textContent === "Loading the guest count…") $("#attendance-total").textContent = "A place for everyone";
    } finally {
      countRequestRunning = false;
    }
  }
  updateSharedTotal();
  setInterval(() => { if (!document.hidden) updateSharedTotal(); }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) updateSharedTotal(); });
  function syncAttendance() {
    if (!extras) return;
    const accepted = !!yes?.checked;
    extras.hidden = !accepted;
    extras.querySelectorAll("input,select,textarea").forEach((field) => { field.disabled = !accepted; });
    updateGuestPreview();
    clearError();
  }
  yes?.addEventListener("change", syncAttendance);
  no?.addEventListener("change", syncAttendance);
  $("#party-size")?.addEventListener("change", updateGuestPreview);
  $("#party-size")?.addEventListener("input", updateGuestPreview);
  syncAttendance();
  if (form && submit && !enabled) {
    submit.disabled = true;
    submit.textContent = "RSVP opens soon";
    showError("The hosts are finishing RSVP setup. Please check back shortly.");
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();
    if (!enabled) { showError("RSVP isn't available yet."); return; }
    if (sending) return;
    if ($("#contact-website")?.value) return;
    const fullName = $("#guest-name");
    const name = fullName?.value.trim() || "";
    if (name.length < 2) { fullName?.focus(); showError("Please enter your name."); return; }
    if (!yes?.checked && !no?.checked) { yes?.focus(); showError("Please choose whether you can attend."); return; }
    const data = new FormData(form);
    if (no?.checked) {
      data.set("party_size", "0");
      data.delete("additional_guest_names");
      data.delete("food_preference");
    }
    if (workerRsvp && !verificationToken) { showError("Please wait for verification to finish, then send your RSVP."); return; }
    const attending = Boolean(yes.checked);
    const partySize = attending ? Number($("#party-size").value) : 0;
    const fields = {
      full_name: name,
      attending: attending ? "yes" : "no",
      party_size: partySize,
      additional_guest_names: String(data.get("additional_guest_names") || ""),
      food_preference: String(data.get("food_preference") || ""),
      message: String(data.get("message") || "")
    };
    if (workerRsvp) {
      const fingerprint = JSON.stringify(fields);
      if (!pendingRequest || pendingRequest.fingerprint !== fingerprint) pendingRequest = { id: crypto.randomUUID(), fingerprint };
    }
    sending = true;
    syncSubmit();
    submit.textContent = "Sending your RSVP…";
    try {
      const response = workerRsvp ? await fetch(api + "/rsvp", {
        method: "POST", credentials: "omit",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...fields, id: pendingRequest.id, turnstile_token: verificationToken }),
        signal: AbortSignal.timeout(20000)
      }) : await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" }, credentials: "omit" });
      const details = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(details.errors) ? details.errors.map((item) => String(item.message || "")).filter(Boolean).join("; ") : "";
        throw new Error(details.error || message || "We couldn't save your response. Please try again.");
      }
      if (workerRsvp && details.success !== true) throw new Error("We couldn't confirm your response. Please try again.");
      pendingRequest = null;
      updateSharedTotal();
      form.hidden = true;
      success.hidden = false;
      const first = name.split(/\s+/)[0];
      $("#success-title").textContent = yes.checked ? "We'll see you there!" : "We'll miss you!";
      $("#success-message").textContent = yes.checked ? `Thank you, ${first}! We're so glad you'll celebrate with us.` : `Thank you for letting us know, ${first}. Sending you love!`;
      success.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "center" });
      makePetals(success, 14);
      const party = $("#success-party");
      party.hidden = !attending;
      party.innerHTML = attending ? drawTruck(partySize) + '<p>Your party is on the way! ✿</p>' : "";
      dockUpdate();
    } catch (error) {
      if (workerRsvp) resetVerification();
      showError(error instanceof Error ? error.message : "We couldn't save your response. Please try again.");
    } finally {
      sending = false;
      syncSubmit();
      submit.innerHTML = initialSubmit;
    }
  });
  $("#another-rsvp")?.addEventListener("click", () => {
    if (!form || !success) return;
    success.hidden = true;
    form.hidden = false;
    form.reset();
    pendingRequest = null;
    if (workerRsvp) resetVerification();
    syncAttendance();
    $("#guest-name")?.focus();
  });

  // Single sticky thumb-sized RSVP affordance; not shown over the form or keyboard.
  const dock = $("#floating-rsvp");
  let dockPending = false;
  function dockUpdate() {
    dockPending = false;
    if (!dock) return;
    const rsvpRect = $("#rsvp")?.getBoundingClientRect();
    const focus = document.activeElement;
    const keyboard = focus && /^(INPUT|TEXTAREA|SELECT)$/.test(focus.tagName);
    const onRsvp = !!rsvpRect && rsvpRect.top < window.innerHeight * .82 && rsvpRect.bottom > 0;
    const show = window.innerWidth < 720 && window.scrollY > window.innerHeight * .78 && !onRsvp && !keyboard && success?.hidden !== false;
    dock.classList.toggle("show", show);
    dock.setAttribute("aria-hidden", String(!show));
    if (show) dock.removeAttribute("inert"); else dock.setAttribute("inert", "");
  }
  function scheduleDock() {
    if (dockPending) return;
    dockPending = true;
    requestAnimationFrame(dockUpdate);
  }
  window.addEventListener("scroll", scheduleDock, { passive: true });
  window.addEventListener("resize", scheduleDock);
  document.addEventListener("focusin", scheduleDock);
  document.addEventListener("focusout", () => setTimeout(scheduleDock, 50));
  dock?.querySelector("a")?.addEventListener("click", () => { dock.classList.remove("show"); });
  scheduleDock();

  // Native share sheet is much nicer on mobile than a plain copied URL.
  const shareButton = $("#share-button");
  shareButton?.addEventListener("click", async () => {
    const details = { title: "A New Chapter Begins", text: "Join us for our housewarming on November 7 at 6 PM!", url: location.origin + location.pathname };
    try {
      if (navigator.share) await navigator.share(details);
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(details.url);
        shareButton.textContent = "Link copied ✓";
        setTimeout(() => { shareButton.textContent = "Share invitation ↗"; }, 2500);
      } else {
        window.prompt("Copy the invitation link", details.url);
      }
    } catch (error) {
      if (error && error.name !== "AbortError") console.warn("Share not available");
    }
  });
})();

