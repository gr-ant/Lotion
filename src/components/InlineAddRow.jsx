import React from 'react';

/**
 * InlineAddRow - a reusable component for inline add skeleton rows and input rows.
 *
 * Props:
 * - active: boolean (if true, show children as the input row; else show skeleton row)
 * - onActivate: function (called when skeleton row is clicked)
 * - label: string or ReactNode (label for the skeleton row, e.g. 'Add a field')
 * - className: string (optional extra class for the row)
 * - children: ReactNode (the input row to render when active)
 * - style: object (optional inline style)
 * - rowType: 'div' | 'tr' | 'li' (default: 'div')
 * - cellClassName: string (optional, for grid/table cell styling)
 */
function InlineAddRow({
  active,
  onActivate,
  label,
  className = '',
  children,
  style = {},
  rowType = 'div',
  cellClassName = '',
}) {
  const Row = rowType;
  return active ? (
    <Row className={className} style={style}>
      {children}
    </Row>
  ) : (
    <Row
      className={['skeleton-row', className].filter(Boolean).join(' ')}
      style={style}
      onClick={onActivate}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') onActivate && onActivate();
      }}
      role="button"
      aria-label={typeof label === 'string' ? label : undefined}
    >
      {/* For grid/table/list, children should be a cell or wrapper */}
      <div className={cellClassName} style={{ width: '100%' }}>
        {label}
      </div>
    </Row>
  );
}

export default InlineAddRow;
