import { useState, useEffect } from 'react';
import { X, Settings, Clock, Users, CheckCircle } from 'lucide-react';
import './WorkflowSettingsModal.css';

function WorkflowSettingsModal({ settings, onSave, onClose }) {
  const [formData, setFormData] = useState({
    autoAssign: false,
    requireApproval: false,
    allowParallel: false,
    timeoutMinutes: 1440
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        autoAssign: settings.autoAssign || false,
        requireApproval: settings.requireApproval || false,
        allowParallel: settings.allowParallel || false,
        timeoutMinutes: settings.timeoutMinutes || 1440
      });
    }
  }, [settings]);

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

  const getTimeoutLabel = (minutes) => {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours`;
    return `${Math.floor(minutes / 1440)} days`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Settings size={20} />
            Workflow Settings
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="settings-section">
            <h3>
              <Users size={16} />
              Assignment Settings
            </h3>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.autoAssign}
                  onChange={(e) => handleChange('autoAssign', e.target.checked)}
                />
                <span>Auto-assign steps</span>
              </label>
              <p className="help-text">
                Automatically assign workflow steps to available users
              </p>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.requireApproval}
                  onChange={(e) => handleChange('requireApproval', e.target.checked)}
                />
                <span>Require approval</span>
              </label>
              <p className="help-text">
                Require manual approval before proceeding to next step
              </p>
            </div>
          </div>

          <div className="settings-section">
            <h3>
              <CheckCircle size={16} />
              Execution Settings
            </h3>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.allowParallel}
                  onChange={(e) => handleChange('allowParallel', e.target.checked)}
                />
                <span>Allow parallel execution</span>
              </label>
              <p className="help-text">
                Allow multiple steps to be executed simultaneously
              </p>
            </div>
          </div>

          <div className="settings-section">
            <h3>
              <Clock size={16} />
              Timeout Settings
            </h3>
            
            <div className="form-group">
              <label htmlFor="timeoutMinutes">Step Timeout</label>
              <div className="timeout-input">
                <input
                  type="range"
                  id="timeoutMinutes"
                  min="15"
                  max="10080"
                  step="15"
                  value={formData.timeoutMinutes}
                  onChange={(e) => handleChange('timeoutMinutes', parseInt(e.target.value))}
                />
                <span className="timeout-value">
                  {getTimeoutLabel(formData.timeoutMinutes)}
                </span>
              </div>
              <p className="help-text">
                Maximum time allowed for each step before escalation
              </p>
            </div>
          </div>

          <div className="settings-preview">
            <h4>Settings Summary</h4>
            <div className="preview-grid">
              <div className="preview-item">
                <span>Auto-assign:</span>
                <span className={formData.autoAssign ? 'enabled' : 'disabled'}>
                  {formData.autoAssign ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="preview-item">
                <span>Approval required:</span>
                <span className={formData.requireApproval ? 'enabled' : 'disabled'}>
                  {formData.requireApproval ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="preview-item">
                <span>Parallel execution:</span>
                <span className={formData.allowParallel ? 'enabled' : 'disabled'}>
                  {formData.allowParallel ? 'Allowed' : 'Sequential'}
                </span>
              </div>
              <div className="preview-item">
                <span>Step timeout:</span>
                <span>{getTimeoutLabel(formData.timeoutMinutes)}</span>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WorkflowSettingsModal; 