import { useState, useEffect } from 'react';
import { X, FileText, Users } from 'lucide-react';
import './WorkflowStepModal.css';

function WorkflowStepModal({ step, process, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'form',
    formId: '',
    required: true
  });

  useEffect(() => {
    if (step) {
      setFormData({
        name: step.name || '',
        description: step.description || '',
        type: step.type || 'form',
        formId: step.formId || '',
        required: step.required !== false
      });
    }
  }, [step]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{step ? 'Edit Workflow Step' : 'Add Workflow Step'}</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Step Name *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter step name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter step description"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Step Type</label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="form">Form Step</option>
              <option value="manual">Manual Step</option>
              <option value="approval">Approval Step</option>
              <option value="notification">Notification Step</option>
            </select>
          </div>

          {formData.type === 'form' && (
            <div className="form-group">
              <label htmlFor="formId">
                <FileText size={16} />
                Assign Form
              </label>
              <select
                id="formId"
                value={formData.formId}
                onChange={(e) => handleChange('formId', e.target.value)}
                required
              >
                <option value="">Select a form</option>
                {process.forms.map(form => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
              {formData.formId && (
                <div className="form-preview">
                  <p className="form-description">
                    {process.forms.find(f => f.id === formData.formId)?.description}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.required}
                onChange={(e) => handleChange('required', e.target.checked)}
              />
              <span>Required Step</span>
            </label>
            <p className="help-text">
              If checked, this step must be completed before the workflow can proceed
            </p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {step ? 'Update Step' : 'Add Step'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WorkflowStepModal; 