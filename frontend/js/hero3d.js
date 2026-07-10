(function () {
  const hero = document.getElementById('hero3d');
  if (!hero || typeof gsap === 'undefined') return;

  const bg = document.getElementById('hero3dBg');
  const modelInner = document.getElementById('hero3dModelInner');
  const left = document.getElementById('hero3dLeft');
  const right = document.getElementById('hero3dRight');

  // modelInner is animated (not the outer #hero3dModel), because the outer
  // element relies on transform:translateX(-50%) for centering — GSAP writes
  // to the same `transform` style property, which would silently overwrite
  // that centering and knock the image off-center.
  gsap.set([bg, modelInner, left, right], { opacity: 0 });

  const tl = gsap.timeline();
  tl.fromTo(bg, { y: 60, opacity: 0, scale: 0.92 }, { y: 0, opacity: 0.14, scale: 1, duration: 1.3, ease: 'power4.out' })
    .fromTo(modelInner, { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, '-=0.9')
    .fromTo(left, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, '-=0.7')
    // Animate the container itself, not its children — the cards are filled
    // in asynchronously by fillCards() below and don't exist yet at this point.
    .fromTo(right, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.6');

  if (window.matchMedia('(min-width: 901px)').matches && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const xValue = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const yValue = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      gsap.to(bg, { x: xValue * -22, y: yValue * -12, duration: 1.2, ease: 'power2.out' });
      gsap.to(modelInner, { x: xValue * 16, y: yValue * 10, duration: 1.2, ease: 'power2.out' });
      gsap.to(left, { x: xValue * -8, y: yValue * -4, duration: 1.2, ease: 'power2.out' });
      gsap.to(right, { x: xValue * 14, y: yValue * 8, duration: 1.2, ease: 'power2.out' });
    });
    hero.addEventListener('mouseleave', () => {
      gsap.to([bg, modelInner, left, right], { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
    });
  }

  // Populate the two floating product cards once the catalog has loaded.
  function fillCards() {
    if (typeof state === 'undefined' || !Array.isArray(state.products) || state.products.length < 2) return false;
    const picks = state.products.slice(0, 2);
    const slots = [document.getElementById('hero3dCard1'), document.getElementById('hero3dCard2')];
    picks.forEach((p, i) => {
      slots[i].innerHTML = `
        <img src="${p.front}" alt="${p.name}" />
        <div class="price">₹${p.price}</div>
        <div class="name">${p.name}</div>`;
      slots[i].addEventListener('click', () => { window.location.href = `product.html?id=${p.id}`; });
    });
    return true;
  }

  if (!fillCards()) {
    const poll = setInterval(() => {
      if (fillCards()) clearInterval(poll);
    }, 200);
    setTimeout(() => clearInterval(poll), 8000);
  }
})();
