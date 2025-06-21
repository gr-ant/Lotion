import React, { useState } from 'react';
import './FormRenderer.css';

const FormRenderer = ({ form, metadataFields, onSubmit, isPreview = false }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const getFieldById = (id) => metadataFields.find(f => f.id === id);

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when user starts typing
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
        const value = formData[field.id];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
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
      console.log('Form data (preview):', formData);
      return;
    }
    
    if (validateForm()) {
      onSubmit?.(formData);
    }
  };

  const renderField = (item) => {
    const field = getFieldById(item.metadataFieldId);
    if (!field) return null;

    const value = formData[field.id] || '';
    const error = errors[field.id];
    const isRequired = field.required;

    const commonProps = {
      id: field.id,
      name: field.id,
      value: value,
      onChange: (e) => handleInputChange(field.id, e.target.value),
      placeholder: field.placeholder || `Enter ${field.name.toLowerCase()}`,
      className: `form-input ${error ? 'error' : ''}`,
      disabled: isPreview
    };

    const renderInput = () => {
      switch (field.type) {
        case 'textarea':
          return (
            <textarea
              {...commonProps}
              rows={4}
              className={`form-textarea ${error ? 'error' : ''}`}
            />
          );
        
        case 'select':
          return (
            <select {...commonProps} className={`form-select ${error ? 'error' : ''}`}>
              <option value="">Select an option</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        
        case 'boolean':
          return (
            <div className="boolean-input">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={value === 'true' || value === true}
                  onChange={(e) => handleInputChange(field.id, e.target.checked)}
                  disabled={isPreview}
                />
                <span className="checkmark"></span>
                {field.placeholder || `Check if ${field.name.toLowerCase()}`}
              </label>
            </div>
          );

        case 'user':
          return <input {...commonProps} type="text" />;
        
        case 'date':
          return <input {...commonProps} type="date" />;
        
        case 'email':
          return <input {...commonProps} type="email" />;
        
        case 'number':
          return <input {...commonProps} type="number" />;
        
        default:
          return <input {...commonProps} type="text" />;
      }
    };

    return (
      <div key={field.id} className={`form-field ${item.fullWidth ? 'full-width' : ''}`}>
        <label htmlFor={field.id} className="form-label">
          {field.name}
          {isRequired && <span className="required-indicator">*</span>}
        </label>
        {renderInput()}
        {field.description && (
          <p className="field-description">{field.description}</p>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  };

  return (
    <div className="form-renderer">
      <form onSubmit={handleSubmit} className="rendered-form">
        <div className="form-header">
          <h2 className="form-title">{form.name}</h2>
          {form.description && (
            <p className="form-description">{form.description}</p>
          )}
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
          <div className="preview-notice">
            <p>This is a preview. Form data will be logged to console when submitted.</p>
            <button type="submit" className="preview-submit-button">
              Test Submit
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default FormRenderer; 