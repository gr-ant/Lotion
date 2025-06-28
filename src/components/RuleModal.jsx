import { useState } from 'react';
import { X } from 'lucide-react';
import notionService from '../services/NotionService.js';
import './RuleModal.css';

function RuleModal({ processId, rule, onSave, onClose }) {
  const [localRule, setLocalRule] = useState(rule || {
    conditions: [{
      id: `cond_${Date.now()}`,
      leftFieldId: '',
      operator: '=',
      rightMode: 'field',
      rightFieldId: '',
      rightValue: ''
    }],
    logic: 'AND'
  });

  const process = notionService.getProcessById(processId);
  const enterpriseFields = notionService.getEnterpriseFields();
  const metadataFields = [...enterpriseFields, ...(process?.metadataFields || [])];
  const forms = notionService.getForms(processId) || [];
  const allFields = forms.flatMap(form => 
    (form.fields || []).map(field => ({
      ...field,
      formName: form.name,
      formId: form.id,
      displayName: `${form.name} → ${field.name}`
    }))
  );
  const combinedFields = [...metadataFields.map(f => ({ ...f, displayName: f.name })), ...allFields];

  const handleAddCondition = () => {
    setLocalRule({
      ...localRule,
      conditions: [...localRule.conditions, {
        id: `cond_${Date.now()}`,
        leftFieldId: '',
        operator: '=',
        rightMode: 'field',
        rightFieldId: '',
        rightValue: ''
      }]
    });
  };

  const handleRemoveCondition = (condId) => {
    setLocalRule({
      ...localRule,
      conditions: localRule.conditions.filter(c => c.id !== condId)
    });
  };

  const handleUpdateCondition = (condId, updates) => {
    setLocalRule({
      ...localRule,
      conditions: localRule.conditions.map(c => 
        c.id === condId ? { ...c, ...updates } : c
      )
    });
  };

  const handleSave = () => {
    onSave(localRule);
  };

  const getFieldOptions = (fieldId) => {
    const field = combinedFields.find(f => f.id === fieldId);
    if (!field || !['dropdown', 'select'].includes(field.type)) return [];
    
    const datasets = notionService.getDatasets(processId);
    if (field.datasetId) {
      const dataset = datasets.find(ds => ds.id === field.datasetId);
      return dataset?.items || [];
    }
    return field.options || [];
  };

  const getFieldType = (fieldId) => {
    const field = combinedFields.find(f => f.id === fieldId);
    return field?.type || 'text';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configure Rule</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="logic-selector">
            <label>Logic:</label>
            <select 
              value={localRule.logic}
              onChange={(e) => setLocalRule({ ...localRule, logic: e.target.value })}
            >
              <option value="AND">All conditions must be true (AND)</option>
              <option value="OR">Any condition must be true (OR)</option>
            </select>
          </div>

          <div className="conditions-list">
            {localRule.conditions.map((condition, index) => (
              <div key={condition.id} className="condition-row">
                <span className="condition-number">{index + 1}</span>
                
                <select
                  value={condition.leftFieldId}
                  onChange={(e) => handleUpdateCondition(condition.id, { leftFieldId: e.target.value })}
                  className="field-select"
                >
                  <option value="">Select field...</option>
                  {combinedFields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.displayName}
                    </option>
                  ))}
                </select>

                <select
                  value={condition.operator}
                  onChange={(e) => handleUpdateCondition(condition.id, { operator: e.target.value })}
                  className="operator-select"
                >
                  <option value="=">=</option>
                  <option value="!=">≠</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&ge;</option>
                  <option value="<=">&le;</option>
                  <option value="contains">contains</option>
                  <option value="not_contains">does not contain</option>
                  <option value="empty">is empty</option>
                  <option value="not_empty">is not empty</option>
                </select>

                <div className="comparison-toggle">
                  <div className="toggle-group">
                    <button
                      type="button"
                      className={`toggle-option ${condition.rightMode === 'value' ? 'active' : ''}`}
                      onClick={() => handleUpdateCondition(condition.id, { 
                        rightMode: 'value',
                        rightFieldId: ''
                      })}
                    >
                      📝 Value
                    </button>
                    <button
                      type="button"
                      className={`toggle-option ${condition.rightMode === 'field' ? 'active' : ''}`}
                      onClick={() => handleUpdateCondition(condition.id, { 
                        rightMode: 'field',
                        rightValue: ''
                      })}
                    >
                      📊 Field
                    </button>
                  </div>
                </div>

                <div className="comparison-input">
                    {condition.rightMode === 'field' ? (
                      <select
                        value={condition.rightFieldId}
                        onChange={(e) => handleUpdateCondition(condition.id, { rightFieldId: e.target.value })}
                        className="field-select"
                      >
                        <option value="">Select field...</option>
                        {combinedFields.map(field => (
                          <option key={field.id} value={field.id}>
                            <span className={`field-type-indicator ${field.type}`}></span>
                            {field.displayName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      (() => {
                        const leftFieldType = getFieldType(condition.leftFieldId);
                        const options = getFieldOptions(condition.leftFieldId);
                        
                        // For dropdown/select fields, show dropdown options
                        if (['dropdown', 'select'].includes(leftFieldType) && options.length > 0) {
                          return (
                            <select
                              value={condition.rightValue}
                              onChange={(e) => handleUpdateCondition(condition.id, { rightValue: e.target.value })}
                              className="field-select value-select"
                            >
                              <option value="">Select option...</option>
                              {options.map((opt, idx) => (
                                <option key={idx} value={opt.value || opt}>
                                  {opt.label || opt.value || opt}
                                </option>
                              ))}
                            </select>
                          );
                        }
                        
                        // For number/currency fields
                        if (['number', 'currency'].includes(leftFieldType)) {
                          return (
                            <input
                              type="number"
                              value={condition.rightValue}
                              onChange={(e) => handleUpdateCondition(condition.id, { rightValue: e.target.value })}
                              placeholder="Enter number..."
                              className="value-input number-input"
                            />
                          );
                        }
                        
                        // For date fields
                        if (leftFieldType === 'date') {
                          return (
                            <input
                              type="date"
                              value={condition.rightValue}
                              onChange={(e) => handleUpdateCondition(condition.id, { rightValue: e.target.value })}
                              className="value-input date-input"
                            />
                          );
                        }
                        
                        // For checkbox fields
                        if (leftFieldType === 'checkbox') {
                          return (
                            <select
                              value={condition.rightValue}
                              onChange={(e) => handleUpdateCondition(condition.id, { rightValue: e.target.value })}
                              className="field-select value-select"
                            >
                              <option value="">Select...</option>
                              <option value="true">Checked</option>
                              <option value="false">Unchecked</option>
                            </select>
                          );
                        }
                        
                        // Default text input for other field types
                        return (
                          <input
                            type="text"
                            value={condition.rightValue}
                            onChange={(e) => handleUpdateCondition(condition.id, { rightValue: e.target.value })}
                            placeholder="Enter value..."
                            className="value-input text-input"
                          />
                        );
                      })()
                    )}
                  </div>

                {localRule.conditions.length > 1 && (
                  <button
                    className="remove-condition"
                    onClick={() => handleRemoveCondition(condition.id)}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className="add-condition-button" onClick={handleAddCondition}>
            + Add Condition
          </button>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}

export default RuleModal;