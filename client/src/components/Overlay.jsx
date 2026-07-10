export default function Overlay({ open, center, title, onClose, children }) {
  return (
    <div
      className={`overlay${center ? ' center' : ''}${open ? ' open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="panel">
        <div className="panel-head">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
