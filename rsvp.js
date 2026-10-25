(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const cfg = window.HOUSEWARMING_CONFIG || {};
  const endpoint = String(cfg.formEndpoint || "").trim();
  const enabled = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9_-]+\/?$/.test(endpoint);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const form = $("#rsvp-form");
  const yes = $("#attend-yes");
  const no = $("#attend-no");
  const extras = $("#attendance-extra");
  const submit = $("#rsvp-submit");
  const feedback = $("#form-feedback");
  const success = $("#success-state");
  if (!form || !submit) return;

  function showError(message, scroll = true) {
    feedback.textContent = message;
    feedback.hidden = false;
    if (scroll) feedback.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }
  function clearError() {
    feedback.textContent = "";
    feedback.hidden = true;
  }
  function syncAttendance() {
    const attending = Boolean(yes?.checked);
    extras.hidden = !attending;
    extras.querySelectorAll("input, select, textarea").forEach((field) => { field.disabled = !attending; });
    clearError();
  }
  yes?.addEventListener("change", syncAttendance);
  no?.addEventListener("change", syncAttendance);
  syncAttendance();

  if (!enabled) {
    submit.disabled = true;
    submit.innerHTML = '<span>RSVP opens soon</span><span aria-hidden="true">✿</span>';
    showError("The hosts are finishing RSVP setup. Please check back soon to reply.", false);
  }

  function celebrate() {
    if (reduceMotion || !success) return;
    const colors = ["#98282d", "#1d344d", "#bf984c", "#426145"];
    for (let i = 0; i < 17; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-bit";
      piece.setAttribute("aria-hidden", "true");
      piece.style.backgroundColor = colors[i % colors.length];
      piece.style.left = (30 + i * 37 % 44) + "%";
      piece.style.top = "16%";
      piece.style.setProperty("--confetti-x", (i % 2 ? -1 : 1) * (35 + i * 17 % 145) + "px");
      piece.style.setProperty("--confetti-y", (105 + i * 23 % 120) + "px");
      piece.style.setProperty("--confetti-rotate", (150 + i * 33) + "deg");
      piece.style.animationDelay = i * 37 + "ms";
      success.append(piece);
      setTimeout(() => piece.remove(), 1900);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();
    if (!enabled) return showError("RSVP submissions have not been set up yet.");
    if ($("#contact-website")?.value) return;
    const nameField = $("#guest-name");
    const emailField = $("#guest-email");
    const name = nameField?.value.trim() || "";
    if (name.length < 2) { nameField?.focus(); return showError("Please enter your full name."); }
    if (emailField?.value.trim() && !emailField.checkValidity()) {
      emailField.focus(); return showError("Please enter a valid email or leave it blank.");
    }
    if (!yes?.checked && !no?.checked) {
      yes?.focus(); return showError("Please select whether you can attend.");
    }
    const data = new FormData(form);
    if (no?.checked) {
      data.set("party_size", "0");
      data.delete("additional_guest_names");
      data.delete("food_preference");
    }
    const originalLabel = submit.innerHTML;
    submit.disabled = true;
    submit.textContent = "Sending your RSVP…";
    try {
      const response = await fetch(endpoint, {
        method: "POST", body: data,
        headers: { Accept: "application/json" }, credentials: "omit"
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const message = result.errors?.map((e) => String(e.message)).join("; ") ||
          "We couldn't submit your RSVP. Please try again.";
        throw new Error(message);
      }
      form.hidden = true;
      success.hidden = false;
      const firstName = name.split(/\s+/)[0];
      $("#success-title").textContent = yes.checked ? "See you there!" : "We'll miss you!";
      $("#success-message").textContent = yes.checked ?
        "Thank you, " + firstName + "! We can't wait to celebrate with you." :
        "Thank you for letting us know, " + firstName + ". We hope to see you soon.";
      celebrate();
      success.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    } catch (error) {
      showError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      submit.disabled = !enabled;
      submit.innerHTML = originalLabel;
    }
  });

  $("#another-rsvp")?.addEventListener("click", () => {
    success.hidden = true;
    form.hidden = false;
    form.reset();
    syncAttendance();
    $("#guest-name")?.focus();
  });
})();
