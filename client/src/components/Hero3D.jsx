import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hero3D({ products }) {
  const heroRef = useRef(null);
  const bgRef = useRef(null);
  const modelInnerRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const navigate = useNavigate();
  const picks = products.slice(0, 2);

  useEffect(() => {
    const hero = heroRef.current;
    const gsap = window.gsap;
    if (!hero || typeof gsap === 'undefined') return;

    const bg = bgRef.current;
    const modelInner = modelInnerRef.current;
    const left = leftRef.current;
    const right = rightRef.current;

    gsap.set([bg, modelInner, left, right], { opacity: 0 });

    const tl = gsap.timeline();
    tl.fromTo(bg, { y: 60, opacity: 0, scale: 0.92 }, { y: 0, opacity: 0.14, scale: 1, duration: 1.3, ease: 'power4.out' })
      .fromTo(modelInner, { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, '-=0.9')
      .fromTo(left, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, '-=0.7')
      .fromTo(right, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.6');

    let onMove, onLeave;
    if (window.matchMedia('(min-width: 901px)').matches && window.matchMedia('(hover: hover)').matches) {
      onMove = (e) => {
        const rect = hero.getBoundingClientRect();
        const xValue = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const yValue = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        gsap.to(bg, { x: xValue * -22, y: yValue * -12, duration: 1.2, ease: 'power2.out' });
        gsap.to(modelInner, { x: xValue * 16, y: yValue * 10, duration: 1.2, ease: 'power2.out' });
        gsap.to(left, { x: xValue * -8, y: yValue * -4, duration: 1.2, ease: 'power2.out' });
        gsap.to(right, { x: xValue * 14, y: yValue * 8, duration: 1.2, ease: 'power2.out' });
      };
      onLeave = () => {
        gsap.to([bg, modelInner, left, right], { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
      };
      hero.addEventListener('mousemove', onMove);
      hero.addEventListener('mouseleave', onLeave);
    }

    return () => {
      tl.kill();
      if (onMove) hero.removeEventListener('mousemove', onMove);
      if (onLeave) hero.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <section className="hero3d" id="hero3d" ref={heroRef}>
      <div className="hero3d-bg" ref={bgRef}>
        <svg viewBox="0 0 1200 220" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <text x="0" y="180" fontFamily="Fraunces, serif" fontSize="200" fontWeight="500" letterSpacing="-6">HIM-STORE</text>
        </svg>
      </div>

      <div className="hero3d-model">
        <div className="hero3d-model-inner" ref={modelInnerRef}>
          <img src="/images/hero-model.png" alt="Model wearing HIM-STORE outerwear" />
        </div>
      </div>

      <div className="hero3d-left" ref={leftRef}>
        <h1 className="hero3d-title">Built like<br />a joint,<br />not a seam.</h1>
        <p className="hero3d-copy">A small run of structural basics — patterns drawn from load-bearing shapes rather than trend boards. Six pieces, cut once a season.</p>
        <button className="hero3d-cta" onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}>
          Enter the shop
          <span className="hero3d-cta-arrow">→</span>
        </button>
        <div className="hero3d-stat">
          <div className="hero3d-stat-num">{String(products.length).padStart(2, '0')}</div>
          <div className="hero3d-stat-label">Sculptural essentials<br />Season 01 — Object no. 01–06</div>
        </div>
      </div>

      <div className="hero3d-right" ref={rightRef}>
        {picks.map((p) => (
          <div className="hero3d-pcard" key={p.id} onClick={() => navigate(`/product/${p.id}`)}>
            <img src={p.front} alt={p.name} />
            <div className="price">₹{p.price}</div>
            <div className="name">{p.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
