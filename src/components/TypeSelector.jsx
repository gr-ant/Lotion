import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './TypeSelector.css';

const fieldTypes = [
  'text', 'number', 'user', 'date', 'select', 'textarea', 'yes/no', 'currency'
];

function TypeSelector({ onSelect, onClose, targetRef }) {
  const selectorRef = useRef(null);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target) && 
          targetRef && !targetRef.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, targetRef]);

  useEffect(() => {
    if (targetRef) {
      const target = targetRef;
      const targetRect = target.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const estimatedHeight = 300; // Approximate height of the selector
      
      // Check if there's enough space below
      const spaceBelow = windowHeight - targetRect.bottom;
      const spaceAbove = targetRect.top;
      
      let top, bottom;
      if (spaceBelow >= estimatedHeight || spaceBelow > spaceAbove) {
        // Position below (default)
        top = targetRect.bottom + 4;
        bottom = 'auto';
      } else {
        // Position above
        bottom = windowHeight - targetRect.top + 4;
        top = 'auto';
      }
      
      setPosition({
        top,
        bottom,
        left: targetRect.left,
        width: targetRect.width
      });
    }
  }, [targetRef]);

  if (!position) return null;

  return ReactDOM.createPortal(
    <div 
      ref={selectorRef} 
      className="type-selector"
      style={{
        position: 'fixed',
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        width: position.width,
        zIndex: 1000
      }}
    >
      <div className="type-selector-header">
        <h4>Select Field Type</h4>
      </div>
      <div className="type-selector-items">
        {fieldTypes.map(type => (
          <div
            key={type}
            className="type-selector-item"
            onClick={() => onSelect(type)}
          >
            <span className="type-name">{type}</span>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}

export default TypeSelector;
