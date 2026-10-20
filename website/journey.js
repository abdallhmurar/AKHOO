import { journeyCopy } from "./journey-copy.js";
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const kinds = ["battery", "fuel", "tire", "other"];
// One icon family; functional symbols always have an adjacent visible label.
const paths = {
  battery: '<rect x="3" y="6" width="16" height="12" rx="2"/><path d="M22 10v4M7 12h4m-2-2v4m5-2h2"/>',
  fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M2 21h14M4 10h10m0 3h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V8l-4-4m1 1v4h3"/>',
  tire: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="m6 6 4 4m4 4 4 4m0-12-4 4m-4 4-4 4"/>',
  other: '<path d="M14 4a6 6 0 0 0-7 7l-4 4a3 3 0 0 0 4 4l4-4a6 6 0 0 0 7-7l-4 4-3-3 3-4Z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  chat: '<path d="M21 11a8 8 0 0 1-8 8H6l-4 3V11a9 9 0 0 1 9-9h2a8 8 0 0 1 8 9Z M7 8h9M7 12h6"/>',
  progress: '<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>'
};
const icon = (kind, extra = "") => `<svg class="story-icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind]}</svg>`;
const arrow = icon("arrow", "directional");

function benefitPreviews(c) {
  return [
    `<div class="benefit-map"><svg class="benefit-streets" viewBox="0 0 340 200" preserveAspectRatio="none" aria-hidden="true"><path class="map-green" d="M0 0h85l40 62-55 42H0Z M260 135l80-30v95h-85Z"/><path class="map-street-edge" d="M-20 120 370 20M60-20 125 220M245-20 190 220"/><path class="map-street" d="M-20 120 370 20M60-20 125 220M245-20 190 220"/><path class="map-trip" d="M64 167 106 155 82 94 183 68"/></svg><span class="benefit-origin"></span><span class="benefit-pin">${icon("pin")}</span><span class="benefit-location">${escape(c.location)}</span><span class="benefit-issue">${icon("battery")}${escape(c.issue)}</span></div>`,
    `<div class="benefit-chat"><div class="chat-example chat-in"><span class="chat-avatar">${icon("chat")}</span><span>${escape(c.chat[0])}</span></div><div class="chat-example chat-out"><span>${escape(c.chat[1])}</span><svg viewBox="0 0 24 16" aria-hidden="true"><path d="m2 8 4 4 8-8m-3 8 8-8"/></svg></div><span class="chat-typing" aria-hidden="true"><i></i><i></i><i></i></span></div>`,
    `<div class="benefit-status"><div class="status-example">${c.status.map((label,i)=>`<div class="status-line ${i === 2 ? "status-current" : ""}"><span class="status-dot">${i < 2 ? icon("progress") : '<i></i>'}</span><span>${escape(label)}</span></div>`).join("")}</div></div>`
  ];
}

export function createJourney(t, lang, art) {
  const c = journeyCopy[lang], hero = document.querySelector(".hero");
  document.body.dataset.experience = "journey";
  hero.innerHTML = `<div class="container hero-grid">
    <div class="hero-copy">
      <span class="journey-eyebrow">${escape(c.eyebrow)}</span>
      <h1>${escape(c.title)}<br><span>${escape(c.accent)}</span></h1>
      <p class="hero-description">${escape(c.intro)}</p>
      <div class="actions"><a class="button" href="#download">${escape(t.download)}${arrow}</a><button class="text-link journey-try" type="button" data-service="0">${escape(c.demo)}${arrow}</button></div>
      <p class="hero-availability">${escape(c.availability)}</p>
    </div>
    <div class="hero-art journey-art">
      <div class="journey-stage" data-tilt>
        <div class="scenario-picker"><p id="scenario-label">${escape(c.select)}</p><div class="scenario-options" role="group" aria-labelledby="scenario-label">${t.services.map(([name], i) => `<button type="button" data-scene="${i}" aria-pressed="${i === 0}" aria-controls="journey-scene">${icon(kinds[i])}<span>${escape(name)}</span></button>`).join("")}</div></div>
        <div class="journey-scene" id="journey-scene">${kinds.map((kind, i) => `<div class="journey-slide" data-slide="${i}" ${i ? "hidden" : ""}>${art(kind, t.services[i][0])}</div>`).join("")}<span class="scene-caption">${escape(c.sceneLabel)}</span></div>
        <div class="journey-caption" aria-live="polite"><div><h2>${escape(c.questions[0])}</h2><p>${escape(c.descriptions[0])}</p></div><span class="scene-count" dir="ltr" aria-hidden="true">01 <small>/ 04</small></span></div>
      </div>
    </div>
  </div>`;
  const services = document.querySelector("#services");
  services.className = "services route-section";
  const previews = benefitPreviews(c.previews);
  services.innerHTML = `<div class="container"><div class="route-intro"><span class="eyebrow">${escape(c.roadEyebrow)}</span><h2>${escape(c.roadTitle)}</h2><p>${escape(c.roadText)}</p></div><div class="route-moments">${c.moments.map(([title, body], i) => `<article class="route-moment"><div class="benefit-visual" aria-hidden="true">${previews[i]}</div><div class="benefit-copy"><h3>${escape(title)}</h3><p>${escape(body)}</p></div></article>`).join("")}</div><p class="benefits-note">${escape(c.previews.note)}</p></div>`;
  document.querySelectorAll(".section-number,.community-sticker,.partner-symbol").forEach(element => element.remove());
  document.querySelector(".community").classList.add("journey-community");
}

export function setupJourney(t, lang) {
  const c = journeyCopy[lang], buttons = [...document.querySelectorAll("[data-scene]")];
  buttons.forEach((button) => button.addEventListener("click", () => {
    const selected = Number(button.dataset.scene);
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    document.querySelectorAll("[data-slide]").forEach((slide) => {
      slide.hidden = Number(slide.dataset.slide) !== selected;
      if (slide.hidden) slide.querySelector("video")?.pause();
    });
    document.querySelector(".journey-caption h2").textContent = c.questions[selected];
    document.querySelector(".journey-caption p").textContent = c.descriptions[selected];
    document.querySelector(".scene-count").innerHTML = `0${selected + 1} <small>/ 04</small>`;
    document.querySelector(".journey-try").dataset.service = String(selected);
    document.querySelector(".journey-stage").dataset.scene = kinds[selected];
  }));
}
