// The approved Three.js medal geometry and lighting, with the earned tier's
// color supplied by the app. Lifecycle belongs to this element, not the page.
import * as T from './assets/perks/vendor/three.module.js';
import { makeMedal, studioEnvironment } from './medal-model.js';

class AkhooMedal extends HTMLElement {
  static observedAttributes = ['paused', 'metal'];
  connectedCallback() {
    if (this.dispose) return;
    const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
    root.innerHTML = '<style>:host{display:block;position:relative}canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}slot{display:flex;justify-content:center;align-items:center;height:100%}:host([ready]) slot{visibility:hidden}</style><slot></slot>';
    let renderer, model, environment, raf = 0, time = 0, last = 0, pulse = 0, disposed = false, visible = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const canAnimate = () => !disposed && visible && !document.hidden && !reduced.matches && this.getAttribute('paused') !== 'true';
    const cleanup = () => {
      disposed = true; cancelAnimationFrame(raf); intersection?.disconnect(); resize?.disconnect();
      document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync);
      this.removeEventListener('click', play); this.removeEventListener('keydown', key);
      renderer?.dispose(); environment?.dispose();
      model?.group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
      this.removeAttribute('ready'); root.querySelector('canvas')?.remove(); this.sync = undefined;
    };
    let intersection, resize;
    const play = () => { if (canAnimate()) { pulse = 1.5; sync(); } };
    const key = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); play(); } };
    let render = () => {};
    const frame = now => {
      raf = 0; if (!canAnimate()) return;
      if (last && now - last < 1000 / 30) { raf = requestAnimationFrame(frame); return; }
      const dt = last ? Math.min((now - last) / 1000, .05) : 0;
      last = now; time += dt; pulse = Math.max(0, pulse - dt); render(); raf = requestAnimationFrame(frame);
    };
    const sync = () => { cancelAnimationFrame(raf); raf = 0; last = 0; if (canAnimate()) raf = requestAnimationFrame(frame); else if (!disposed) render(); };
    try {
      renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setClearColor(0, 0); renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
      const scene = new T.Scene(), view = 2.6, camera = new T.OrthographicCamera(-view / 2, view / 2, view / 2, -view / 2, .1, 30);
      camera.position.set(0, 1.05, 7); camera.lookAt(0, .1, 0);
      environment = studioEnvironment(renderer); scene.environment = environment.texture;
      scene.add(new T.HemisphereLight('#ecfaff', '#466689', .9));
      for (const [x, y, z, intensity] of [[-3, 4, 5, 2.6], [4, 1, 3, 1.1], [0, 4, -3, 1.5]]) { const light = new T.DirectionalLight('#ffffff', intensity); light.position.set(x, y, z); scene.add(light); }
      model = makeMedal(this.getAttribute('metal') || '#ced8e2'); scene.add(model.group);
      root.append(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.domElement.addEventListener('webglcontextlost', cleanup, { once: true });
      render = () => { model.update(time, pulse > 0 ? 1 - pulse / 1.5 : 0, canAnimate()); renderer.render(scene, camera); };
      resize = new ResizeObserver(() => { const { width, height } = this.getBoundingClientRect(); if (!width || !height || disposed) return; camera.left = -view / 2 * width / height; camera.right = view / 2 * width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false); render(); }); resize.observe(this);
      intersection = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; sync(); }); intersection.observe(this);
      document.addEventListener('visibilitychange', sync); reduced.addEventListener('change', sync);
      this.addEventListener('click', play); this.addEventListener('keydown', key);
      this.setAttribute('ready', ''); this.sync = sync; this.dispose = cleanup;
    } catch { cleanup(); }
  }
  attributeChangedCallback(name, previous, value) {
    if (name === 'metal' && previous !== null && previous !== value) { this.disconnectedCallback(); if (this.isConnected) this.connectedCallback(); }
    else this.sync?.();
  }
  disconnectedCallback() { this.dispose?.(); this.dispose = undefined; }
}
if (!customElements.get('akhoo-medal')) customElements.define('akhoo-medal', AkhooMedal);
