import { journeyCopy } from "./journey-copy.js";
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const kinds = ["battery", "fuel", "tire", "other"];
const arrow = '<svg class="icon directional" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
export function createJourney(t, lang, art) {
  const c = journeyCopy[lang], hero = document.querySelector(".hero");
  document.body.dataset.experience = "journey";
  hero.innerHTML = `<div class="container hero-grid"><div class="hero-copy"><span class="journey-eyebrow"><i></i>${escape(c.eyebrow)}</span><h1>${escape(c.title)}<br><span>${escape(c.accent)}</span></h1><p class="hero-description">${escape(c.intro)}</p><div class="scenario-picker"><p id="scenario-label">${escape(c.select)}</p><div class="scenario-options" role="group" aria-labelledby="scenario-label">${t.services.map(([name], i) => `<button type="button" data-scene="${i}" aria-pressed="${i === 0}" aria-controls="journey-scene"><img src="./assets/${kinds[i]}.png" alt="" width="42" height="32"><span>${escape(name)}</span></button>`).join("")}</div></div><div class="actions"><button type="button" class="button journey-try" data-service="0">${escape(c.demo)}${arrow}</button><a class="text-link" href="#download">${escape(t.download)}${arrow}</a></div></div><div class="hero-art journey-art"><div class="journey-watermark" aria-hidden="true">AKHOO</div><div class="journey-halo" aria-hidden="true"></div><div class="journey-stage" data-tilt><span class="scene-corner" aria-hidden="true">✦</span><div class="journey-scene" id="journey-scene">${kinds.map((kind, i) => `<div class="journey-slide" data-slide="${i}" ${i ? "hidden" : ""}>${i === 0 ? art("help", t.heroAlt) : `<img class="journey-still" src="./assets/${kind}.png" alt="${escape(t.services[i][0])}" width="640" height="430">`}</div>`).join("")}<span class="scene-caption">${escape(c.sceneLabel)}</span></div><div class="journey-caption" aria-live="polite"><span class="scene-count" dir="ltr">01 <small>/ 04</small></span><div><h2>${escape(c.questions[0])}</h2><p>${escape(c.descriptions[0])}</p></div><span class="scene-check" aria-hidden="true">✓</span></div></div><svg class="connection-path" viewBox="0 0 600 480" aria-hidden="true"><path d="M480 330C600 420 420 490 330 415S120 350 90 270"/><path class="connection-beam" d="M480 330C600 420 420 490 330 415S120 350 90 270"/></svg><div class="helper-token"><img src="./assets/hands.png" alt="" width="48" height="48"><span>${escape(c.helper)}</span><i></i></div><span class="journey-note">${escape(c.sceneNote)}</span></div></div><div class="journey-bottom"><span>${escape(c.connection)}</span><i></i><a href="#services">${escape(t.scroll)}<span>↓</span></a></div>`;
  const services = document.querySelector("#services");
  services.className = "services route-section";
  services.innerHTML = `<div class="container"><div class="route-intro"><span class="eyebrow">${escape(c.roadEyebrow)}</span><h2>${escape(c.roadTitle)}</h2><p>${escape(c.roadText)}</p></div><div class="route-moments">${c.moments.map(([title, body], i) => `<article class="route-moment"><div class="route-symbol"><img src="./assets/${["person", "hands", "accepted"][i]}.png" alt="" width="64" height="64"><span>0${i + 1}</span></div><h3>${escape(title)}</h3><p>${escape(body)}</p></article>`).join("")}</div><div class="route-actions"><button type="button" data-journey-mode="need">${escape(c.need)}${arrow}</button><button type="button" data-journey-mode="help">${escape(c.help)}${arrow}</button></div></div>`;
  document.querySelector(".community-copy .section-number").textContent = c.communityLabel;
  document.querySelector(".partner-copy .section-number").textContent = c.smallLabel;
  document.querySelector(".community").classList.add("journey-community");
  document.querySelector(".rewards-action").insertAdjacentHTML("afterend", `<span class="perks-watermark" aria-hidden="true">${escape(c.perksLabel)}</span>`);
}
export function setupJourney(t, lang) {
  const c = journeyCopy[lang], buttons = [...document.querySelectorAll("[data-scene]")];
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  buttons.forEach((button) => button.addEventListener("click", () => {
    const selected = Number(button.dataset.scene);
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    document.querySelectorAll("[data-slide]").forEach((slide) => {
      slide.hidden = Number(slide.dataset.slide) !== selected;
    });
    document.querySelector(".journey-caption h2").textContent = c.questions[selected];
    document.querySelector(".journey-caption p").textContent = c.descriptions[selected];
    document.querySelector(".scene-count").innerHTML = `0${selected + 1} <small>/ 04</small>`;
    document.querySelector(".journey-try").dataset.service = String(selected);
    document.querySelector(".journey-stage").dataset.scene = kinds[selected];
    if (selected !== 0) document.querySelector(".journey-slide video")?.pause();
  }));
  document.querySelectorAll("[data-journey-mode]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector(`#tab-${button.dataset.journeyMode}`).click();
    document.querySelector("#how").scrollIntoView({ behavior: preference.matches ? "instant" : "smooth", block: "start" });
    document.querySelector(`#tab-${button.dataset.journeyMode}`).focus({ preventScroll: true });
  }));
}
