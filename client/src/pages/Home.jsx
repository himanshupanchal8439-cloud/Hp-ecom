import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Hero3D from '../components/Hero3D';
import ProductGrid from '../components/ProductGrid';
import Footer from '../components/Footer';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/products')
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <main className="wrap">
        <section className="hero-highlight-wrap">
          <div className="hero-highlight">
            <span>Limited autumn release • 6 sculptural essentials</span>
            <span>Free express shipping over ₹5000</span>
          </div>
        </section>

        <Hero3D products={products} />

        <section className="section" id="shop">
          {loading ? <div className="empty-state">Loading products…</div> : <ProductGrid products={products} />}
        </section>

        <section className="section" id="contact">
          <div className="section-head">
            <h2>Visit &amp; Contact</h2>
            <span className="idx">03 / 03</span>
          </div>
          <div className="hero-highlight" style={{ margin: 0, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span>Studio open by appointment • Leeds, UK</span>
            <a className="btn" href="mailto:hello@him-style.com" style={{ borderBottom: '1px solid currentColor' }}>hello@him-style.com</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
