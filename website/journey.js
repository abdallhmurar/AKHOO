import { icon as sharedIcon } from './icons.js';
import { journeyCopy } from "./journey-copy.js";
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const kinds = ["battery", "fuel", "tire", "other"];
const icon = (name, extra = "") => sharedIcon(name, `story-icon ${extra}`);
const arrow = icon("arrow", "directional");

function benefitPreviews(c) {
  return [
    `<div class="benefit-map"><div class="benefit-map-board"><svg class="benefit-streets" viewBox="0 0 500 300" preserveAspectRatio="none" aria-hidden="true"><path class="map-blocks" d="M28 24h82v50H28Z M150 12h52v65h-52Z M330 18h85v46h-85Z M342 144h110v68H342Z M20 190h48v75H20Z M240 215h74v60h-74Z"/><path class="map-green" d="M0 80h69l35 57-49 37H0Z M420 0h80v90l-60-15Z M315 235l57-10 40 75h-97Z"/><path class="map-street-edge" d="M-20 180 530 35M88-20 186 330M350-20 265 330M-20 245 520 280"/><path class="map-street" d="M-20 180 530 35M88-20 186 330M350-20 265 330M-20 245 520 280"/><path class="map-trip-base" d="M100 253 162 257 126 142 286 99"/><path class="map-trip" d="M100 253 162 257 126 142 286 99"/></svg><span class="benefit-origin"></span><span class="benefit-pin-shadow"></span><span class="benefit-pin"><span class="benefit-pin-shape"><i></i></span></span><span class="benefit-location">${escape(c.location)}</span></div><div class="benefit-request"><img src="./assets/battery.png" alt="" width="76" height="62" loading="lazy"><span><small>${escape(c.request)}</small><strong>${escape(c.issue)}</strong></span><span class="request-location-check">${icon("pin")}</span></div></div>`,
    `<div class="benefit-chat"><div class="chat-app-header"><span class="chat-avatar"><img src="./assets/hands.png" alt="" width="26" height="26" loading="lazy"></span><span>${escape(c.helper)}<small>${escape(c.chatLabel)}</small></span></div><div class="chat-example chat-in"><span>${escape(c.chat[0])}</span></div><div class="chat-example chat-out"><span>${escape(c.chat[1])}</span>${icon("doublecheck")}</div><span class="chat-typing" aria-hidden="true"><i></i><i></i><i></i></span></div>`,
    `<div class="benefit-status"><div class="status-example"><div class="status-app-header"><img src="./assets/brand.png" alt="" width="29" height="29" loading="lazy"><span>${escape(c.tracking)}</span></div>${c.status.map((label,i)=>`<div class="status-line ${i === 2 ? "status-current" : ""}"><span class="status-dot">${i < 2 ? icon("progress") : '<i></i>'}</span><span>${escape(label)}</span></div>`).join("")}</div></div>`
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
  services.innerHTML = `<div class="container"><div class="route-intro"><span class="eyebrow">${escape(c.roadEyebrow)}</span><h2>${escape(c.roadTitle)}</h2><p>${escape(c.roadText)}</p></div><div class="route-moments">${c.moments.map(([title, body], i) => `<article class="route-moment benefit-${["location-card", "chat-card", "status-card"][i]}"><div class="benefit-copy"><h3>${escape(title)}</h3><p>${escape(body)}</p></div><div class="benefit-visual" aria-hidden="true">${previews[i]}</div></article>`).join("")}</div><div class="benefits-action"><a class="button benefits-try" href="#how">${escape(c.roadDemo)}${arrow}</a><p class="benefits-note">${escape(c.previews.note)}</p></div></div>`;
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
