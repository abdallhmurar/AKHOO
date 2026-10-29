// Motion runs only while the section is visible and respects reduced motion.
export function setupBrandMotion() {
  const root = document.querySelector('#site');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Map();
  const sections = [...document.querySelectorAll('.hero,.route-section,.how,.community,.perks,.download-section')];
  const visible = new Set();

  function animate(element, frames, options) {
    if (preference.matches || document.hidden) return;
    running.get(element)?.cancel();
    const animation = element.animate(frames, options);
    running.set(element, animation);
    animation.finished.then(() => {
      if (running.get(element) === animation) running.delete(element);
    }, () => {
      if (running.get(element) === animation) running.delete(element);
    });
  }
  function sync() {
    const enabled = !preference.matches && !document.hidden;
    sections.forEach(section => section.classList.toggle('motion-active', enabled && visible.has(section)));
    if (!enabled) {
      running.forEach(animation => animation.cancel());
      running.clear();
    }
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
    sync();
  }, {threshold: 0.05});
  sections.forEach(section => observer.observe(section));
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);

  function onClick(event) {
    const button = event.target.closest('.button,.journey-try,.rose-help-card,.tabs button,.demo-issues button,.demo-back');
    if (!button || button.disabled || preference.matches || document.hidden) return;
    animate(button, [
      {transform:'scale(.95) translateY(2px)'},
      {transform:'scale(1.035) translateY(-1px)',offset:.5},
      {transform:'scale(.995)',offset:.8},
      {transform:'scale(1)'}
    ], {duration:450,easing:'cubic-bezier(.22,1,.36,1)'});

  }
  root.addEventListener('click', onClick);
  return () => {
    observer.disconnect();
    preference.removeEventListener('change', sync);
    document.removeEventListener('visibilitychange', sync);
    root.removeEventListener('click', onClick);
    running.forEach(animation => animation.cancel());
    running.clear();
    sections.forEach(section => section.classList.remove('motion-active'));
  };
}
