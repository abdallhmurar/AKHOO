import { icon } from './icons.js';
import { animate, inView, scroll } from "motion";
import { experienceCopy } from "./experience-copy.js";
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const kinds = ["battery", "fuel", "tire", "other"];
const tick = icon("check");
const arrow = icon("arrow", "directional");
export function upgradeExperience(t, lang, art) {
  const c = experienceCopy[lang];
  document.body.dataset.experience = "v2";
  document.querySelector(".header").insertAdjacentHTML("beforeend", '<div class="reading-progress" aria-hidden="true"></div>');
  const how = document.querySelector("#how");
  how.querySelector(".section-heading").innerHTML = `<span class="eyebrow">${escape(c.howEyebrow)}</span><h2>${escape(c.howTitle)}</h2><p>${escape(c.howText)}</p>`;
  how.querySelector(".how-visual").innerHTML = `<span class="demo-orbit orbit-a" aria-hidden="true"></span><span class="demo-orbit orbit-b" aria-hidden="true"></span><div class="demo-phone"><div class="phone-island" aria-hidden="true"></div><div class="demo-topbar"><img src="./assets/brand.webp" alt="" width="35" height="35"><span>${escape(c.demoLabel)}</span><i aria-hidden="true"></i></div><div class="demo-progress" aria-hidden="true"><i></i><i></i><i></i></div><div id="phone-screen" aria-live="polite"></div><div class="demo-controls"><button class="demo-back" type="button" aria-label="${escape(c.back)}">${arrow}</button><button class="demo-next button" type="button"></button></div><div class="phone-home-indicator" aria-hidden="true"></div></div><p class="demo-disclaimer">${escape(c.demoNote)}</p>`;
  document.querySelector("#perks").innerHTML = `<div class="container"><div class="section-heading"><span class="eyebrow">${escape(t.perksEyebrow)}</span><h2>${escape(t.perksTitle)}</h2><p>${escape(t.perksText)}</p></div><div class="rewards-grid"><div class="rewards-story"><div class="rewards-story-copy"><h3>${escape(c.peopleTitle)}</h3><p>${escape(c.peopleText)}</p></div>${art("perks", t.perksAlt, "cropped-art")}</div><div class="rewards-play"><span class="reward-tag">${escape(c.giftTag)}</span><div class="gift-wrap"><button class="gift" aria-label="${escape(t.giftLabel)}" data-ready="false"><img class="gift-fallback" src="./assets/gift.webp" alt="" width="160" height="160"><canvas aria-hidden="true"></canvas></button><span class="gift-hint" aria-live="polite">${escape(t.giftHint)}</span></div><h3>${escape(c.giftTitle)}</h3><p>${escape(c.giftText)}</p></div></div><div class="rewards-action"><a class="text-link" href="#download">${escape(t.perksAction)} ${arrow}</a></div></div>`;
}
export function setupWalkthrough(t, lang, initialMode, onModeChange) {
  const c = experienceCopy[lang], modeButtons = [...document.querySelectorAll("[data-mode]")], panel = document.querySelector("#step-panel"), screen = document.querySelector("#phone-screen"), phone = document.querySelector(".demo-phone"), next = document.querySelector(".demo-next"), back = document.querySelector(".demo-back");
  let mode = initialMode, step = 0, selected = 0, note = "", transition;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const map = () => `<div class="illustration-map" aria-hidden="true"><div class="map-park park-one"></div><div class="map-park park-two"></div><div class="map-river"></div><div class="map-road road-one"></div><div class="map-road road-two"></div><div class="map-road road-three"></div><span class="map-route"></span><span class="map-dot map-dot-origin"></span><span class="map-pin">${tick}</span></div><small class="map-label">${escape(c.mapNote)}</small>`;
  function showPhone() {
    const selectedName = t.services[selected][0];
    let title, body;
    if (mode === "need") {
      title = [c.choose, c.details, c.location][step];
      if (step === 0) body = `<div class="demo-issues">${t.services.map(([name], i) => `<button type="button" data-issue="${i}" aria-pressed="${selected === i}"><img src="./assets/${kinds[i]}.webp" alt="" width="90" height="60"><span>${escape(name)}</span><i aria-hidden="true">${selected === i ? tick : ""}</i></button>`).join("")}</div>`;
      if (step === 1) body = `<div class="demo-selected"><img src="./assets/${kinds[selected]}.webp" alt="" width="100" height="65"><strong>${escape(selectedName)}</strong><span>${tick}</span></div><label class="demo-note-label" for="demo-note">${escape(c.optional)}</label><textarea id="demo-note" rows="4" maxlength="250" placeholder="${escape(c.placeholder)}">${escape(note)}</textarea><div class="demo-photo"><img src="./assets/camera.webp" alt="" width="85" height="65"><span>${escape(t.needSteps[0][1])}</span></div>`;
      if (step === 2) body = map() + `<div class="demo-selected compact"><span class="demo-check">${tick}</span><strong>${escape(selectedName)}</strong></div><p class="demo-screen-note">${escape(c.requestReady)}</p>`;
    } else {
      title = c.helpTitles[step];
      if (step === 0) body = map() + `<div class="demo-request"><img src="./assets/${kinds[selected]}.webp" alt="" width="90" height="65"><div><strong>${escape(selectedName)}</strong><p>${escape(c.helpNotes[step])}</p></div></div>`;
      if (step === 1) body = `<img class="demo-helper-art" src="./assets/helpers.webp" alt="" width="300" height="210"><div class="demo-selected"><strong>${escape(selectedName)}</strong><span>${tick}</span></div><p class="demo-screen-note">${escape(c.helpNotes[step])}</p>`;
      if (step === 2) body = `<img class="demo-helper-art" src="./assets/accepted.webp" alt="" width="300" height="210"><div class="demo-chat"><span>${tick}</span><div><strong>${escape(c.chat)}</strong><p>${escape(c.chatLine)}</p></div></div><p class="demo-screen-note">${escape(c.ready)}</p>`;
    }
    screen.innerHTML = `<div class="demo-screen-heading"><span>0${step + 1}<i>/ 03</i></span><h3>${escape(title)}</h3></div>${body}`;
    screen.querySelectorAll("[data-issue]").forEach((b) => b.addEventListener("click", () => {
      selected = Number(b.dataset.issue);
      showPhone();
      screen.querySelector(`[data-issue="${selected}"]`).focus({ preventScroll: true });
    }));
    screen.querySelector("#demo-note")?.addEventListener("input", (event) => {
      note = event.target.value;
    });
    phone.dataset.step = String(step);
    document.querySelectorAll(".demo-progress i").forEach((el, i) => el.classList.toggle("complete", i <= step));
    back.disabled = step === 0;
    next.innerHTML = `${escape(step === 2 ? c.restart : c.next)}${arrow}`;
  }
  function update(animateChange = false) {
    modeButtons.forEach((b) => {
      const active = b.dataset.mode === mode;
      b.setAttribute("aria-selected", String(active));
      b.tabIndex = active ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", `tab-${mode}`);
    const steps = mode === "need" ? c.needSteps : t.helpSteps;
    panel.innerHTML = `<ol class="steps interactive-steps">${steps.map(([title, body], i) => `<li><button type="button" data-step="${i}" aria-pressed="${step === i}" aria-controls="phone-screen"><span class="step-number">0${i + 1}</span><span class="step-copy"><strong>${escape(title)}</strong><span>${escape(body)}</span></span><span class="step-arrow" aria-hidden="true">${arrow}</span></button></li>`).join("")}</ol>`;
    panel.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => {
      step = Number(b.dataset.step);
      update(true);
      panel.querySelector(`[data-step="${step}"]`).focus({ preventScroll: true });
    }));
    showPhone();
    transition?.stop();
    if (animateChange && !preference.matches) transition = animate(screen, { opacity: [0.25, 1], y: [8, 0] }, { duration: 0.25, ease: "easeOut" });
  }
  modeButtons.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.mode;
      step = 0;
      onModeChange(mode);
      update(true);
    });
    b.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      mode = event.key === "Home" ? "need" : event.key === "End" ? "help" : mode === "need" ? "help" : "need";
      step = 0;
      onModeChange(mode);
      update(true);
      modeButtons.find((x) => x.dataset.mode === mode).focus();
    });
  });
  next.addEventListener("click", () => {
    step = (step + 1) % 3;
    update(true);
  });
  back.addEventListener("click", () => {
    step = Math.max(0, step - 1);
    update(true);
  });
  document.querySelectorAll("[data-service]").forEach((button) => button.addEventListener("click", () => {
    selected = Number(button.dataset.service);
    mode = "need";
    step = 0;
    onModeChange(mode);
    update(true);
    document.querySelector("#how").scrollIntoView({ behavior: preference.matches ? "instant" : "smooth", block: "start" });
    modeButtons[0].focus({ preventScroll: true });
  }));
  const reduce = () => {
    if (preference.matches) {
      transition?.stop();
      screen.style.opacity = "1";
      screen.style.transform = "none";
    }
  };
  preference.addEventListener("change", reduce);
  update();
  return () => {
    transition?.stop();
    preference.removeEventListener("change", reduce);
  };
}
export function setupEditorialMotion() {
  const preference = matchMedia("(prefers-reduced-motion: reduce)"), fine = matchMedia("(hover: hover) and (pointer: fine)");
  let animations = [], observers = [], frame = 0, disposed = false;
  const progress = document.querySelector(".reading-progress");
  const stopScroll = scroll((value) => {
    progress.style.transform = `scaleX(${value})`;
  });
  const elements = [...document.querySelectorAll(".hero-copy,.hero-art,.service,.section-heading,.community-copy,.community-art,.rewards-story,.rewards-play,.partner-copy,.partner-form,.faq-grid,.download-panel")];
  const tilt = document.querySelector("[data-tilt]");
  function stopAnimations() {
    animations.forEach((a) => a.stop());
    animations = [];
    observers.forEach((stop) => stop());
    observers = [];
    elements.forEach((el) => {
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
    });
    tilt?.style.removeProperty("transform");
  }
  function start() {
    stopAnimations();
    if (preference.matches || disposed) return;
    elements.forEach((el, index) => {
      observers.push(inView(el, () => {
        animations.push(animate(el, { opacity: [0, 1], y: [24, 0] }, { duration: 0.65, delay: el.classList.contains("service") ? index % 4 * 0.045 : 0, ease: [0.22, 1, 0.36, 1] }));
      }, { amount: 0.12 }));
    });
  }
  const pointer = (event) => {
    if (preference.matches || !fine.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const b = tilt.getBoundingClientRect(), x = (event.clientX - b.left) / b.width - 0.5, y = (event.clientY - b.top) / b.height - 0.5;
      tilt.style.transform = `perspective(1200px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
    });
  };
  const reset = () => {
    cancelAnimationFrame(frame);
    tilt?.style.removeProperty("transform");
  };
  tilt?.addEventListener("pointermove", pointer);
  tilt?.addEventListener("pointerleave", reset);
  preference.addEventListener("change", start);
  start();
  const navLinks = [...document.querySelectorAll("#main-nav a")];
  const sectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach((link) => {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle("nav-current", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
  }, { rootMargin: "-15% 0px -65% 0px" });
  document.querySelectorAll("#how,#community,#perks,#partners").forEach((el) => sectionObserver.observe(el));
  return () => {
    disposed = true;
    stopAnimations();
    stopScroll();
    sectionObserver.disconnect();
    cancelAnimationFrame(frame);
    tilt?.removeEventListener("pointermove", pointer);
    tilt?.removeEventListener("pointerleave", reset);
    preference.removeEventListener("change", start);
  };
}
