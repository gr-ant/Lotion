import React, { useState } from 'react';
import './FormRenderer.css';
import { config } from '../config.js';
import notionService from '../services/NotionService.js';

const FormRenderer = ({ form, metadataFields, onSubmit, isPreview = false, processId: propProcessId }) => {
  const [values, setValues] = useState(() => {
    const initial = {};
    (form.layout || []).forEach(item => {
      const meta = metadataFields.find(f => f.id === item.metadataFieldId);
      if (meta) {
        if (meta.type === 'yes/no') initial[meta.id] = false;
        else initial[meta.id] = '';
      }
    });
    return initial;
  });

  const [errors, setErrors] = useState({});
  const [userSearch, setUserSearch] = useState({});
  const [userDropdownOpen, setUserDropdownOpen] = useState({});

  const getFieldById = (id) => metadataFields.find(f => f.id === id);

  const handleChange = (fieldId, value) => {
    setValues(v => ({ ...v, [fieldId]: value }));

    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    form.layout.forEach(item => {
      const field = getFieldById(item.metadataFieldId);
      if (field && field.required) {
        const value = values[field.id];
        if (
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0)
        ) {
          newErrors[field.id] = `${field.name} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isPreview) {
      console.log('Form data (preview):', values);
      return;
    }

    if (validateForm()) {
      onSubmit?.(values);
    }
  };

  const users = notionService.getUsers();

  // Use processId prop if provided, otherwise fall back to form.processId
  const processId = propProcessId || form.processId;

  console.log('Process ID:', processId);

  const datasets = processId ? notionService.getDatasets(processId) : [];

  console.log(datasets, 'datasets in form renderer');

  const getLayoutItem = (fieldId) => {
    if (form && Array.isArray(form.layout)) {
      return form.layout.find(item => item.metadataFieldId === fieldId);
    }
    return null;
  };

  const renderField = (item) => {
    const meta = getFieldById(item.metadataFieldId);
    if (!meta) return null;

    const value = values[meta.id] !== undefined ? values[meta.id] : '';
    const error = errors[meta.id];
    const isRequired = meta.required;
    const layoutItem = getLayoutItem(meta.id);
    const isReadOnly = layoutItem && layoutItem.readOnly;

    const commonProps = {
      id: meta.id,
      name: meta.id,
      value: value,
      onChange: (e) => handleChange(meta.id, e.target.value),
      placeholder: meta.placeholder || `Enter ${meta.name.toLowerCase()}`,
      className: `form-input ${error ? 'error' : ''}`,
      disabled: isPreview || isReadOnly
    };

    const renderInput = () => {
      switch (meta.type) {
        case 'textarea':
          if (isReadOnly) return <div style={{ fontWeight: 'bold' }}>{value}</div>;
          return (
            <textarea
              {...commonProps}
              rows={4}
              className={`form-textarea ${error ? 'error' : ''}`}
            />
          );
        case 'select':
        case 'dropdown':
          let options = meta.options || [];
          if (meta.datasetId) {
            const dataset = datasets.find(ds => ds.id === meta.datasetId);
            if (dataset && dataset.items) {
              options = dataset.items.map(item => ({ value: item.value, label: item.label || item.value, id: item.id }));
            }
          }
          if (isReadOnly) {
            let display = value;
            if (meta.datasetId) {
              const dataset = datasets.find(ds => ds.id === meta.datasetId);
              const item = dataset?.items.find(i => i.id === value || i.value === value);
              display = item?.label || item?.value || '';
            } else {
              const option = options.find(o => o.value === value);
              display = option?.label || option?.value || value;
            }
            return <div style={{ fontWeight: 'bold' }}>{display}</div>;
          }
          return (
            <select {...commonProps} className={`form-select ${error ? 'error' : ''}`}> 
              <option value="">Select an option</option>
              {options.map((option, index) => (
                <option key={option.id || index} value={option.value || option}>
                  {option.label || option.value || option}
                </option>
              ))}
            </select>
          );
        case 'boolean':
          if (isReadOnly) return <div style={{ fontWeight: 'bold' }}>{value ? 'Yes' : 'No'}</div>;
          return (
            <div className="boolean-input">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={value === 'true' || value === true}
                  onChange={(e) => handleChange(meta.id, e.target.checked)}
                  disabled={isReadOnly}
                />
                <span className="checkmark"></span>
                {meta.placeholder || `Check if ${meta.name.toLowerCase()}`}
              </label>
            </div>
          );
        case 'user':
          if (isReadOnly) {
            const user = users.find(u => u.id === value);
            return <div style={{ fontWeight: 'bold' }}>{user ? user.name : ''}</div>;
          }
          return (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className={`form-input ${error ? 'error' : ''}`}
                placeholder="Search user..."
                value={userSearch[meta.id] || (users.find(u => u.id === value)?.name || '')}
                onChange={e => {
                  setUserSearch(s => ({ ...s, [meta.id]: e.target.value }));
                  setUserDropdownOpen(o => ({ ...o, [meta.id]: true }));
                }}
                onFocus={() => setUserDropdownOpen(o => ({ ...o, [meta.id]: true }))}
                onBlur={() => setTimeout(() => setUserDropdownOpen(o => ({ ...o, [meta.id]: false })), 150)}
                disabled={isReadOnly}
              />
              {userDropdownOpen[meta.id] && (
                <div className="user-search-dropdown" style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #e3e2e0', borderRadius: 4, width: '100%', maxHeight: 180, overflowY: 'auto' }}>
                  {users.filter(u =>
                    (userSearch[meta.id] || '').length === 0 ||
                    u.name.toLowerCase().includes((userSearch[meta.id] || '').toLowerCase()) ||
                    u.email?.toLowerCase().includes((userSearch[meta.id] || '').toLowerCase())
                  ).map(u => (
                    <div
                      key={u.id}
                      className="user-search-option"
                      style={{ padding: '8px', cursor: 'pointer' }}
                      onMouseDown={() => {
                        handleChange(meta.id, u.id);
                        setUserSearch(s => ({ ...s, [meta.id]: u.name }));
                        setUserDropdownOpen(o => ({ ...o, [meta.id]: false }));
                      }}
                    >
                      {u.name} {u.email && <span style={{ color: '#9b9a97', fontSize: 12 }}>({u.email})</span>}
                    </div>
                  ))}
                  {users.filter(u =>
                    (userSearch[meta.id] || '').length === 0 ||
                    u.name.toLowerCase().includes((userSearch[meta.id] || '').toLowerCase()) ||
                    u.email?.toLowerCase().includes((userSearch[meta.id] || '').toLowerCase())
                  ).length === 0 && (
                    <div style={{ padding: '8px', color: '#9b9a97', fontStyle: 'italic' }}>No users found</div>
                  )}
                </div>
              )}
            </div>
          );
        case 'users':
          if (isReadOnly) {
            const selectedUsers = users.filter(u => (Array.isArray(value) ? value.includes(u.id) : false));
            return <div style={{ fontWeight: 'bold' }}>{selectedUsers.map(u => u.name).join(', ')}</div>;
          }
          return (
            <select
              {...commonProps}
              multiple
              value={value}
              onChange={(e) =>
                handleChange(
                  meta.id,
                  Array.from(e.target.selectedOptions).map((o) => o.value)
                )
              }
              className={`form-select ${error ? 'error' : ''}`}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          );
        case 'date':
          if (isReadOnly) return <div style={{ fontWeight: 'bold' }}>{value}</div>;
          return <input {...commonProps} type="date" />;
        case 'email':
          if (isReadOnly) return <div style={{ fontWeight: 'bold' }}>{value}</div>;
          return <input {...commonProps} type="email" />;
        case 'number':
          if (isReadOnly) return <div style={{ fontWeight: 'bold' }}>{value}</div>;
          return <input {...commonProps} type="number" />;
        case 'currency':
          if (isReadOnly) return <div style={{ fontWeight: 'bold' }}>${value}</div>;
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 4 }}>$</span>
              <input
                {...commonProps}
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                pattern="^\d+(\.\d{1,2})?$"
                title="Enter a monetary value (e.g., 10.00 or 10.99)"
                onBlur={(e) => {
                  const numValue = parseFloat(e.target.value);
                  if (!isNaN(numValue)) {
                    handleChange(meta.id, numValue.toFixed(2));
                  } else if (e.target.value === '') {
                    handleChange(meta.id, '');
                  }
                }}
              />
            </div>
          );
        case 'yes/no':
          if (isReadOnly) return <div style={{ fontWeight: 'bold' }}>{value === true ? 'Yes' : value === false ? 'No' : ''}</div>;
          return (
            <div className="form-field-row">
              <label>{meta.name}{isRequired && ' *'}</label>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={value === true}
                    onChange={(e) => handleChange(meta.id, e.target.checked)}
                    disabled={isReadOnly}
                  />
                  Yes
                </label>
                <label style={{ marginLeft: 16 }}>
                  <input
                    type="checkbox"
                    checked={value === false}
                    onChange={(e) => handleChange(meta.id, e.target.checked)}
                    disabled={isReadOnly}
                  />
                  No
                </label>
              </div>
              {error && <span className="error-message">{error}</span>}
            </div>
          );
        default:
          if (isReadOnly) return <div style={{ fontWeight: 'bold' }}>{value}</div>;
          return <input {...commonProps} type="text" />;
      }
    };

    return (
      <div key={meta.id} className={`form-field ${item.fullWidth ? 'full-width' : ''}`}>
        <label htmlFor={meta.id} className="form-label">
          {meta.name}
          {isRequired && <span className="required-indicator">*</span>}
        </label>
        {renderInput()}
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  };

  return (
    <div className="form-renderer">
      <form onSubmit={handleSubmit} className="rendered-form">
        <div className="form-header">
        </div>

        <div className="form-fields">
          {form.layout.map((item, index) => renderField(item))}
        </div>

        {!isPreview && (
          <div className="form-actions">
            <button type="submit" className="submit-button">
              Submit Form
            </button>
          </div>
        )}

        {isPreview && (
          <div className="preview-note">
            <p>This is a preview. Form data will not be submitted.</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default FormRenderer;