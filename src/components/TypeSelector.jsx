import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

function TypeSelector({ onSelect, onClose, targetRef }) {
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

  const fieldTypes = ['text', 'number', 'email', 'date', 'select', 'textarea', 'boolean', 'user', 'users'];

  return ReactDOM.createPortal(
    <div className="type-selector-menu" style={{ top: position.top, left: position.left }} ref={selectorRef}>
      {fieldTypes.map(type => (
        <div key={type} className="type-selector-item" onClick={() => onSelect(type)}>
          {type}
        </div>
      ))}
    </div>,
    document.body
  );
}

export default TypeSelector;
