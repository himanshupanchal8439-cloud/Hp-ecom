import { useNavigate } from 'react-router-dom';

const stockLabel = { 'in-stock': 'In stock', 'low-stock': 'Low stock', 'out-of-stock': 'Out of stock' };
const stockClass = { 'in-stock': '', 'low-stock': 'low', 'out-of-stock': 'restocking' };

function ProductCard({ p }) {
  const navigate = useNavigate();
  const hasDiscount = p.discountPercent > 0 && p.mrp > p.price;
  return (
    <button className="card" onClick={() => navigate(`/product/${p.id}`)}>
      <div className="card-media">
        {hasDiscount && <span className="discount-badge">{p.discountPercent}% OFF</span>}
        <div className="swatch front"><img src={p.front} alt={`${p.name}, front`} /></div>
        <div className="swatch back"><img src={p.back} alt={`${p.name}, back`} /></div>
      </div>
      <div className="card-info">
        <span>{p.name}</span>
        <span className="price">
          ₹{p.price}
          {hasDiscount && <s className="mrp"> ₹{p.mrp}</s>}
        </span>
      </div>
      <div className={`card-tag ${stockClass[p.stock] || ''}`}>
        <i></i>{stockLabel[p.stock] || 'In stock'}
      </div>
    </button>
  );
}

export default function ProductGrid({ products }) {
  if (products.length === 0) {
    return <div className="empty-state">No products available right now.</div>;
  }
  const byCategory = {};
  products.forEach((p) => {
    (byCategory[p.category] ||= []).push(p);
  });
  const entries = Object.entries(byCategory);

  return (
    <>
      {entries.map(([category, items], i) => (
        <div key={category}>
          <div className="section-head" style={i > 0 ? { marginTop: 56 } : undefined}>
            <h2>{category}</h2>
            <span className="idx">{String(i + 1).padStart(2, '0')} / {entries.length}</span>
          </div>
          <div className="grid">
            {items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
