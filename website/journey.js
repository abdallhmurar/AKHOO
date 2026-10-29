import { icon as sharedIcon } from './icons.js';
import {webRequest} from './app-links.js';
import { journeyCopy } from "./journey-copy.js";
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const icon = (name, extra = "") => sharedIcon(name, `story-icon ${extra}`);
const arrow = icon("arrow", "directional");

function benefitPreviews(c) {
  return [
    `<div class="benefit-map"><div class="benefit-map-board"><svg class="benefit-streets" viewBox="0 0 500 300" preserveAspectRatio="none" aria-hidden="true"><path class="map-blocks" d="M28 24h82v50H28Z M150 12h52v65h-52Z M330 18h85v46h-85Z M342 144h110v68H342Z M20 190h48v75H20Z M240 215h74v60h-74Z"/><path class="map-green" d="M0 80h69l35 57-49 37H0Z M420 0h80v90l-60-15Z M315 235l57-10 40 75h-97Z"/><path class="map-street-edge" d="M-20 180 530 35M88-20 186 330M350-20 265 330M-20 245 520 280"/><path class="map-street" d="M-20 180 530 35M88-20 186 330M350-20 265 330M-20 245 520 280"/><path class="map-trip-base" d="M100 253 162 257 126 142 286 99"/><path class="map-trip" d="M100 253 162 257 126 142 286 99"/></svg><span class="benefit-origin"></span><span class="benefit-pin-shadow"></span><span class="benefit-pin"><span class="benefit-pin-shape"><i></i></span></span><span class="benefit-location">${escape(c.location)}</span></div><div class="benefit-request"><img src="./assets/battery.webp" alt="" width="76" height="62" loading="lazy"><span><small>${escape(c.request)}</small><strong>${escape(c.issue)}</strong></span><span class="request-location-check">${icon("pin")}</span></div></div>`,
    `<div class="benefit-chat"><div class="chat-app-header"><span class="chat-avatar"><img src="./assets/hands.webp" alt="" width="26" height="26" loading="lazy"></span><span>${escape(c.helper)}<small>${escape(c.chatLabel)}</small></span></div><div class="chat-example chat-in"><span>${escape(c.chat[0])}</span></div><div class="chat-example chat-out"><span>${escape(c.chat[1])}</span>${icon("doublecheck")}</div><span class="chat-typing" aria-hidden="true"><i></i><i></i><i></i></span></div>`,
    `<div class="benefit-status"><div class="status-example"><div class="status-app-header"><img src="./assets/brand.webp" alt="" width="29" height="29" loading="lazy"><span>${escape(c.tracking)}</span></div>${c.status.map((label,i)=>`<div class="status-line ${i === 2 ? "status-current" : ""}"><span class="status-dot">${i < 2 ? icon("progress") : '<i></i>'}</span><span>${escape(label)}</span></div>`).join("")}</div></div>`
  ];
}

export function createJourney(t, lang) {
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
      <a class="journey-stage rose-help-card" href="${webRequest}" data-open-app aria-label="${escape(c.helpTitle)} ${escape(c.helpAction)}" aria-describedby="help-preview-note">
        <span class="rose-help-media" aria-hidden="true"><img src="./assets/help-rose.jpg" alt="" width="1344" height="672" fetchpriority="high"><video data-src="./assets/help-rose.mp4" poster="./assets/help-rose.jpg" muted loop playsinline preload="none" tabindex="-1" aria-hidden="true" disablepictureinpicture></video></span>
        <span class="rose-help-copy" dir="${lang === 'en' ? 'ltr' : 'rtl'}"><span class="rose-help-title">${escape(c.helpTitle)}</span><span class="rose-help-text">${escape(c.helpText)}</span></span>
        <span class="rose-help-action"><span>${escape(c.helpAction)}</span>${arrow}</span>
      </a>
      <p class="help-preview-note" id="help-preview-note">${escape(t.appHint)}</p>
    </div>
  </div>`;
  const services = document.querySelector("#services");
  services.className = "services route-section";
  const previews = benefitPreviews(c.previews);
  services.innerHTML = `<div class="container"><div class="route-intro"><span class="eyebrow">${escape(c.roadEyebrow)}</span><h2>${escape(c.roadTitle)}</h2><p>${escape(c.roadText)}</p></div><div class="route-moments">${c.moments.map(([title, body], i) => `<article class="route-moment benefit-${["location-card", "chat-card", "status-card"][i]}"><div class="benefit-copy"><h3>${escape(title)}</h3><p>${escape(body)}</p></div><div class="benefit-visual" aria-hidden="true">${previews[i]}</div></article>`).join("")}</div><div class="benefits-action"><a class="button benefits-try" href="#how">${escape(c.roadDemo)}${arrow}</a><p class="benefits-note">${escape(c.previews.note)}</p></div></div>`;
  document.querySelectorAll(".section-number,.community-sticker,.partner-symbol").forEach(element => element.remove());
  document.querySelector(".community").classList.add("journey-community");
}
