(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const $ = (s) => document.querySelector(s);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const config = window.HOUSEWARMING_CONFIG || {};
  const nodes = Array.from(document.querySelectorAll(".reveal"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: .09, rootMargin: "0px 0px -40px 0px" });
    nodes.forEach((node) => observer.observe(node));
  }

  if (!reduceMotion) {
    const stage = $(".hero-art");
    if (stage) {
      const petals = ["✿", "❋", "✧", "❦"];
      const count = innerWidth < 640 ? 7 : 13;
      for (let i = 0; i < count; i++) {
        const el = document.createElement("span");
        el.className = "petal";
        el.textContent = petals[(i * 7 + 1) % petals.length];
        el.setAttribute("aria-hidden", "true");
        const dx = (i % 2 ? -1 : 1) * (28 + i * 7);
        const angle = (i % 2 ? 160 : -210) + "deg";
        el.style.cssText =
          "left:" + (17 + (i * 37) % 72) + "%;bottom:" + (7 + (i * 19) % 18) +
          "%;--size:" + (9 + i % 3 * 3) + "px;--dur:" + (12 + i % 6 * 2) +
          "s;--delay:" + (-i * 2.35) + "s;--dx:" + dx + "px;--rot:" + angle;
        stage.appendChild(el);
      }
    }
  }

  if (!reduceMotion && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const card = $("#art-card");
    card?.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - .5) * 4.6;
      const y = ((event.clientY - rect.top) / rect.height - .5) * -4.6;
      card.style.transform = "perspective(900px) rotateX(" + y +
        "deg) rotateY(" + x + "deg) rotate(.5deg) translateY(-3px)";
    });
    card?.addEventListener("pointerleave", () => { card.style.transform = ""; });
  }

  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.append(bar);
  const progress = () => {
    const range = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (range > 0 ? Math.min(100, Math.max(0, scrollY / range * 100)) : 0) + "%";
  };
  addEventListener("scroll", progress, { passive: true });
  addEventListener("resize", progress);
  progress();

  const date = new Date(config.eventDate || "2026-11-07T18:00:00-07:00");
  const countdown = $(".gentle-countdown");
  function countdownUpdate() {
    if (Number.isNaN(date.getTime())) return;
    const diff = date.getTime() - Date.now();
    if (diff <= 0) {
      if (countdown) countdown.innerHTML = '<span class="countdown-lead">THE DAY HAS ARRIVED</span><div class="celebration-today">Welcome home! ✿</div>';
      return;
    }
    const values = {
      "#count-days": Math.floor(diff / 86400000),
      "#count-hours": Math.floor(diff % 86400000 / 3600000),
      "#count-minutes": Math.floor(diff % 3600000 / 60000)
    };
    Object.entries(values).forEach(([id, value]) => {
      const el = $(id);
      if (el) el.textContent = String(value).padStart(2, "0");
    });
  }
  countdownUpdate();
  setInterval(countdownUpdate, 45000);

  $("#calendar-download")?.addEventListener("click", () => {
    const format = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const escape = (v) => String(v).replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(";", "\\;").replaceAll("\n", "\\n");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Housewarming Invitation//EN",
      "BEGIN:VEVENT", "UID:housewarming-20261107@invitation",
      "DTSTAMP:" + format(new Date()),
      "DTSTART:" + format(date), "DTEND:" + format(new Date(date.getTime() + 7200000)),
      "SUMMARY:" + escape(config.eventTitle || "Housewarming Celebration"),
      "LOCATION:" + escape(config.eventAddress || "1295 W Giantsbane Dr, Meridian, ID 83642"),
      "DESCRIPTION:Join us for a housewarming dinner starting at 6:00 PM.",
      "END:VEVENT", "END:VCALENDAR", ""
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "housewarming-nov-7-2026.ics";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
