export default function Footer({ minimal }) {
  return (
    <footer>
      <div className="rule"></div>
      <div className="foot-big">Made to bear weight.<br /><span className="accent">Not just to be worn.</span></div>
      <div className="foot-cta">
        <span>New season preview opens Friday</span>
        <a href={minimal ? '/#shop' : '#shop'}>Browse essentials</a>
      </div>
      <div className="rule"></div>
      {!minimal && (
        <div className="foot-cols" style={{ marginTop: 40 }}>
          <div>
            <span className="wordmark">HIM-STORE</span>
            <span style={{ opacity: 0.6 }}>All rights reserved © 2026</span>
          </div>
          <div>
            <a href="#shop">Shop</a>
            <a href="#">Lookbook</a>
            <a href="#">About</a>
            <a href="#">Stockists</a>
          </div>
          <div>
            <a href="#">Instagram</a>
            <a href="#">Are.na</a>
            <a href="#">Substack</a>
          </div>
          <div>
            <a href="#contact">Contact</a>
            <a href="#">Shipping &amp; Returns</a>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
      )}
      <div className="foot-bottom" style={minimal ? { marginTop: 24 } : undefined}>
        <span>Studio address — 14 Kettle Yard, Leeds, UK</span>
        <span>Developed by Himanshu Panchal</span>
      </div>
    </footer>
  );
}
