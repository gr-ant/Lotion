import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

function BooleanSelector({ onSelect, onClose, targetRef }) {
  const [position, setPosition] = useState(null);
  const selectorRef = useRef(null);

  useEffect(() => {
    if (targetRef) {
      const rect = targetRef.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left });
    }
  }, [targetRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!position) return null;

  return ReactDOM.createPortal(
    <div className="type-selector-menu" style={{ top: position.top, left: position.left }} ref={selectorRef}>
      <div className="type-selector-item" onClick={() => onSelect(true)}>Yes</div>
      <div className="type-selector-item" onClick={() => onSelect(false)}>No</div>
    </div>,
    document.body
  );
}

export default BooleanSelector;
