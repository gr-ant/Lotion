import { useState } from 'react';
import { X } from 'lucide-react';
import notionService from '../services/NotionService.js';
import UserSelector from './UserSelector.jsx';
import './DataMappingModal.css';

function DataMappingModal({ processId, mapping, onSave, onClose }) {
  const [localMapping, setLocalMapping] = useState(mapping || {
    id: `data_${Date.now()}`,
    sourceField: null,
    targetField: null,
    transformation: 'copy',
    value: null,
    ruleId: null,
    enabled: true
  });

  // Get metadata fields from both enterprise and process-specific
  const process = notionService.getProcessById(processId);
  const enterpriseFields = notionService.getEnterpriseFields();
  const processFields = process?.metadataFields || [];
  
  // Combine and filter fields (exclude ID, Title, and enterprise Assigned To fields)
  const allMetadataFields = [...enterpriseFields, ...processFields].filter(field => 
    !['enterprise_id', 'enterprise_title', 'enterprise_assigned_to'].includes(field.id) && 
    field.type !== 'id' && 
    field.name.toLowerCase() !== 'name'
  );
  
  // Add special workflow fields
  const workflowFields = [
    {
      id: 'workflow_assigned_to',
      name: 'Assigned To',
      type: 'user',
      description: 'User assigned to this workflow step'
    }
  ];
  
  // Combine all available fields for mapping
  const allAvailableFields = [...allMetadataFields, ...workflowFields];

  const getAvailableTransformations = (sourceField) => {
    if (!sourceField) return ['copy', 'set'];
    
    const field = allAvailableFields.find(f => f.id === sourceField);
    if (!field) return ['copy', 'set'];
    
    const baseTransformations = ['copy', 'set'];
    
    // Only numeric and date fields support add/subtract
    if (['number', 'currency', 'date'].includes(field.type)) {
      return [...baseTransformations, 'add', 'subtract'];
    }
    
    return baseTransformations;
  };

  const getCompatibleTargetFields = (sourceField, transformation) => {
    if (!sourceField) return allAvailableFields;
    
    const field = allAvailableFields.find(f => f.id === sourceField);
    if (!field) return allAvailableFields;
    
    // For 'set' transformation, any field is compatible
    if (transformation === 'set') {
      return allAvailableFields;
    }
    
    // For 'copy', target should be same type or compatible
    if (transformation === 'copy') {
      return allAvailableFields.filter(targetField => {
        // Same type is always compatible
        if (targetField.type === field.type) return true;
        
        // Text can accept most types via string conversion
        if (targetField.type === 'text') return true;
        
        // Number/currency are compatible with each other
        if (['number', 'currency'].includes(field.type) && 
            ['number', 'currency'].includes(targetField.type)) {
          return true;
        }
        
        return false;
      });
    }
    
    // For 'add'/'subtract', only compatible numeric/date fields
    if (['add', 'subtract'].includes(transformation)) {
      return allAvailableFields.filter(targetField => {
        if (['number', 'currency'].includes(field.type)) {
          return ['number', 'currency'].includes(targetField.type);
        }
        if (field.type === 'date') {
          return targetField.type === 'date';
        }
        return false;
      });
    }
    
    return allAvailableFields;
  };

  const handleUpdate = (updates) => {
    setLocalMapping({ ...localMapping, ...updates });
  };

  const handleSave = () => {
    onSave(localMapping);
  };

  const rules = notionService.getRules(processId);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configure Data Mapping</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">

          <div className="form-section">
            <label>Condition Rule</label>
            <div className="rule-controls">
              <select
                value={localMapping.ruleId || ''}
                onChange={(e) => handleUpdate({ ruleId: e.target.value || null })}
                className="form-select"
              >
                <option value="">No condition</option>
                {rules.map(rule => (
                  <option key={rule.id} value={rule.id}>
                    {rule.name}
                  </option>
                ))}
              </select>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localMapping.enabled !== false}
                  onChange={(e) => handleUpdate({ enabled: e.target.checked })}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Enabled</span>
              </label>
            </div>
            {localMapping.ruleId && (
              <div className="rule-preview">
                <span className="rule-label">When:</span>
                <span className="rule-description">
                  {(() => {
                    const rule = rules.find(r => r.id === localMapping.ruleId);
                    if (!rule) return 'Rule not found';
                    
                    // Use the same rule description logic as in WorkflowMappings
                    if (rule.conditions && rule.conditions.length > 0) {
                      const conditionTexts = rule.conditions.map(cond => {
                        const leftField = allAvailableFields.find(f => f.id === cond.leftFieldId)?.name || 'Unknown';
                        const operator = cond.operator;
                        let rightSide = '';
                        
                        if (cond.rightMode === 'field') {
                          rightSide = `[${allAvailableFields.find(f => f.id === cond.rightFieldId)?.name || 'Unknown'}]`;
                        } else if (['empty', 'not_empty'].includes(cond.operator)) {
                          rightSide = '';
                        } else {
                          rightSide = `"${cond.rightValue || '(empty)'}"`;
                        }
                        
                        return rightSide ? `${leftField} ${operator} ${rightSide}` : `${leftField} ${operator}`;
                      });
                      
                      return conditionTexts.join(` ${rule.logic} `);
                    } else {
                      // Old format
                      const leftField = allAvailableFields.find(f => f.id === rule.leftFieldId)?.name || 'Unknown';
                      const operator = rule.operator;
                      let rightSide = '';
                      
                      if (rule.rightMode === 'value') {
                        rightSide = rule.rightValue || '(empty)';
                      } else {
                        rightSide = allAvailableFields.find(f => f.id === rule.rightFieldId)?.name || 'Unknown';
                      }
                      
                      return `${leftField} ${operator} ${rightSide}`;
                    }
                  })()}
                </span>
              </div>
            )}
          </div>

          <div className="form-section">
            <label>Source Field</label>
            <select
              value={localMapping.sourceField || ''}
              onChange={(e) => {
                const newMapping = { sourceField: e.target.value };
                // Reset transformation and target if source changes
                if (e.target.value !== localMapping.sourceField) {
                  newMapping.transformation = 'copy';
                  newMapping.targetField = null;
                  newMapping.value = null;
                }
                handleUpdate(newMapping);
              }}
              className="form-select"
            >
              <option value="">Select source field...</option>
              {allAvailableFields.map(field => (
                <option key={field.id} value={field.id}>
                  {field.name} ({field.type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label>Transformation</label>
            <select
              value={localMapping.transformation}
              onChange={(e) => {
                const newMapping = { transformation: e.target.value };
                // Reset target field and value when transformation changes
                if (e.target.value !== localMapping.transformation) {
                  newMapping.targetField = null;
                  newMapping.value = null;
                }
                handleUpdate(newMapping);
              }}
              className="form-select"
            >
              {getAvailableTransformations(localMapping.sourceField).map(trans => (
                <option key={trans} value={trans}>
                  {trans === 'copy' && 'Copy to'}
                  {trans === 'add' && 'Add to'}
                  {trans === 'subtract' && 'Subtract from'}
                  {trans === 'set' && 'Set value'}
                </option>
              ))}
            </select>
          </div>

          {localMapping.transformation !== 'set' && (
            <div className="form-section">
              <label>Target Field</label>
              <select
                value={localMapping.targetField || ''}
                onChange={(e) => handleUpdate({ targetField: e.target.value })}
                className="form-select"
              >
                <option value="">Select target field...</option>
                {getCompatibleTargetFields(localMapping.sourceField, localMapping.transformation)
                  .map(field => (
                    <option key={field.id} value={field.id}>
                      {field.name} ({field.type})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {localMapping.transformation === 'set' && (
            <>
              <div className="form-section">
                <label>Target Field</label>
                <select
                  value={localMapping.targetField || ''}
                  onChange={(e) => handleUpdate({ targetField: e.target.value, value: null })}
                  className="form-select"
                >
                  <option value="">Select target field...</option>
                  {allAvailableFields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.name} ({field.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-section">
                <label>Value</label>
                {(() => {
                  const targetField = allAvailableFields.find(f => f.id === localMapping.targetField);
                  
                  // For user fields, show UserSelector
                  if (targetField?.type === 'user') {
                    return (
                      <UserSelector
                        value={localMapping.value || ''}
                        onChange={(value) => handleUpdate({ value })}
                        placeholder="Select user or group..."
                      />
                    );
                  }
                  
                  // Default text input for other field types
                  return (
                    <input
                      type="text"
                      value={localMapping.value || ''}
                      onChange={(e) => handleUpdate({ value: e.target.value })}
                      className="form-input"
                      placeholder="Enter value..."
                    />
                  );
                })()}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Mapping
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataMappingModal;