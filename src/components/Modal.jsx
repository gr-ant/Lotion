import ReactDOM from 'react-dom';

function Modal({ title, onClose, children }) {
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
