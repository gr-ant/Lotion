import { useState } from 'react';
import { Plus, Trash2, GitBranch, Database, Edit2 } from 'lucide-react';
import notionService from '../services/NotionService.js';
import RuleModal from './RuleModal.jsx';
import DataMappingModal from './DataMappingModal.jsx';
import './WorkflowMappings.css';

function WorkflowMappings({ step, allSteps, processId, onUpdate }) {
  const [activeTab, setActiveTab] = useState('routing');
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [showDataMappingModal, setShowDataMappingModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [editingMappingType, setEditingMappingType] = useState(null); // 'routing' or 'data'

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

  const handleAddRoutingMapping = () => {
    const newMapping = {
      id: `routing_${Date.now()}`,
      name: 'New Routing Rule',
      rule: null,
      nextStepId: allSteps[0]?.id || null
    };
    
    const currentMappings = step.mappings || { routing: [], data: [] };
    const updatedMappings = {
      ...currentMappings,
      routing: [...(currentMappings.routing || []), newMapping]
    };
    
    onUpdate({ mappings: updatedMappings });
  };

  const handleAddDataMapping = () => {
    setEditingMapping(null); // Clear editing mapping for new mapping
    setShowDataMappingModal(true);
  };

  const handleUpdateRoutingMapping = (mappingId, updates) => {
    const currentMappings = step.mappings || { routing: [], data: [] };
    const updatedMappings = {
      ...currentMappings,
      routing: (currentMappings.routing || []).map(m => 
        m.id === mappingId ? { ...m, ...updates } : m
      )
    };
    onUpdate({ mappings: updatedMappings });
  };

  const handleUpdateDataMapping = (mappingId, updates) => {
    const currentMappings = step.mappings || { routing: [], data: [] };
    const updatedMappings = {
      ...currentMappings,
      data: (currentMappings.data || []).map(m => 
        m.id === mappingId ? { ...m, ...updates } : m
      )
    };
    onUpdate({ mappings: updatedMappings });
  };

  const handleDeleteMapping = (mappingId, type) => {
    const currentMappings = step.mappings || { routing: [], data: [] };
    const updatedMappings = {
      ...currentMappings,
      [type]: (currentMappings[type] || []).filter(m => m.id !== mappingId)
    };
    onUpdate({ mappings: updatedMappings });
  };

  const handleEditRule = (mapping, type = 'routing') => {
    setEditingMapping(mapping);
    setEditingMappingType(type);
    setShowRuleBuilder(true);
  };

  const handleSaveRule = (rule) => {
    if (editingMapping && editingMappingType) {
      if (editingMappingType === 'routing') {
        handleUpdateRoutingMapping(editingMapping.id, { rule });
      }
    }
    setShowRuleBuilder(false);
    setEditingMapping(null);
    setEditingMappingType(null);
  };

  const handleEditDataMapping = (mapping) => {
    setEditingMapping(mapping);
    setShowDataMappingModal(true);
  };

  const handleSaveDataMapping = (mappingData) => {
    const currentMappings = step.mappings || { routing: [], data: [] };
    
    if (editingMapping && editingMapping.id) {
      // Update existing mapping
      const updatedMappings = {
        ...currentMappings,
        data: (currentMappings.data || []).map(m => 
          m.id === editingMapping.id ? mappingData : m
        )
      };
      onUpdate({ mappings: updatedMappings });
    } else {
      // Add new mapping
      const updatedMappings = {
        ...currentMappings,
        data: [...(currentMappings.data || []), mappingData]
      };
      onUpdate({ mappings: updatedMappings });
    }
    
    setShowDataMappingModal(false);
    setEditingMapping(null);
  };

  const getFieldTypeBadge = (field) => {
    const typeColors = {
      text: 'field-type-text',
      number: 'field-type-number',
      currency: 'field-type-currency',
      date: 'field-type-date',
      dropdown: 'field-type-dropdown',
      select: 'field-type-dropdown',
      checkbox: 'field-type-checkbox',
      user: 'field-type-user'
    };
    return typeColors[field.type] || 'field-type-text';
  };

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

  const getOperatorDisplay = (operator) => {
    const operatorMap = {
      '=': '=',
      '!=': '≠',
      '>': '>',
      '<': '<',
      '>=': '≥',
      '<=': '≤',
      'contains': 'contains',
      'not_contains': 'does not contain',
      'empty': 'is empty',
      'not_empty': 'is not empty'
    };
    return operatorMap[operator] || operator;
  };

  const getRuleDescription = (rule) => {
    if (!rule) return '';
    
    if (rule.conditions && rule.conditions.length > 0) {
      // New format
      const conditionTexts = rule.conditions.map(cond => {
        const leftField = allAvailableFields.find(f => f.id === cond.leftFieldId)?.name || 'Unknown';
        const operator = getOperatorDisplay(cond.operator);
        let rightSide = '';
        
        if (cond.rightMode === 'field') {
          rightSide = `[${allAvailableFields.find(f => f.id === cond.rightFieldId)?.name || 'Unknown'}]`;
        } else if (['empty', 'not_empty'].includes(cond.operator)) {
          rightSide = ''; // These operators don't need a right side
        } else {
          rightSide = `"${cond.rightValue || '(empty)'}"`;
        }
        
        return rightSide ? `${leftField} ${operator} ${rightSide}` : `${leftField} ${operator}`;
      });
      
      return conditionTexts.join(` ${rule.logic} `);
    } else {
      // Old format
      const leftField = allAvailableFields.find(f => f.id === rule.leftFieldId)?.name || 'Unknown';
      const operator = getOperatorDisplay(rule.operator);
      let rightSide = '';
      
      if (rule.rightMode === 'value') {
        rightSide = rule.rightValue || '(empty)';
      } else {
        rightSide = allAvailableFields.find(f => f.id === rule.rightFieldId)?.name || 'Unknown';
      }
      
      return `${leftField} ${operator} ${rightSide}`;
    }
  };

  return (
    <div className="workflow-mappings">
      <div className="mappings-tabs">
        <button
          className={`tab ${activeTab === 'routing' ? 'active' : ''}`}
          onClick={() => setActiveTab('routing')}
        >
          <GitBranch size={16} />
          Routing Rules
        </button>
        <button
          className={`tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <Database size={16} />
          Data Mappings
        </button>
      </div>

      {activeTab === 'routing' && (
        <div className="routing-mappings">
          <div className="mappings-list">
            {step.mappings?.routing?.map((mapping) => (
              <div key={mapping.id} className="mapping-row">
                <div className="mapping-content">
                  <input
                    type="text"
                    value={mapping.name}
                    onChange={(e) => handleUpdateRoutingMapping(mapping.id, { name: e.target.value })}
                    className="mapping-name"
                    placeholder="Rule name..."
                  />
                  <div className="mapping-details">
                    <button
                      className="rule-button"
                      onClick={() => handleEditRule(mapping)}
                    >
                      {mapping.rule ? 'Edit Rule' : 'Create Rule'}
                    </button>
                    <span className="arrow">→</span>
                    <select
                      value={mapping.nextStepId || ''}
                      onChange={(e) => handleUpdateRoutingMapping(mapping.id, { nextStepId: e.target.value })}
                      className="step-select"
                    >
                      <option value="">End Workflow</option>
                      {allSteps
                        .filter(s => s.id !== step.id)
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
                <button
                  className="delete-button"
                  onClick={() => handleDeleteMapping(mapping.id, 'routing')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button className="add-mapping-button" onClick={handleAddRoutingMapping}>
            <Plus size={16} />
            Add Routing Rule
          </button>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="data-mappings">
          <div className="mappings-list">
            {step.mappings?.data?.map((mapping) => (
              <div key={mapping.id} className="mapping-row mapping-summary">
                <div className="mapping-content">
                  <div className="mapping-header">
                    <div className="mapping-info">
                      <div className="mapping-summary-text">
                        {(() => {
                          const sourceField = allAvailableFields.find(f => f.id === mapping.sourceField);
                          const targetField = allAvailableFields.find(f => f.id === mapping.targetField);
                          
                          let transformText = '';
                          if (mapping.transformation === 'copy') transformText = 'Copy to';
                          else if (mapping.transformation === 'add') transformText = 'Add to';
                          else if (mapping.transformation === 'subtract') transformText = 'Subtract from';
                          else if (mapping.transformation === 'set') transformText = 'Set value';
                          
                          const sourceName = sourceField?.name || 'Unknown';
                          const targetName = mapping.transformation === 'set' 
                            ? (mapping.value || 'No value') 
                            : (targetField?.name || 'Unknown');
                          
                          return `${sourceName} → ${transformText} → ${targetName}`;
                        })()}
                      </div>
                    </div>
                    <div className="mapping-actions">
                      <button
                        className="edit-button"
                        onClick={() => handleEditDataMapping(mapping)}
                        title="Edit mapping"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteMapping(mapping.id, 'data')}
                        title="Delete mapping"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="add-mapping-button" onClick={handleAddDataMapping}>
            <Plus size={16} />
            Add Data Mapping
          </button>
        </div>
      )}

      {showRuleBuilder && (
        <RuleModal
          processId={processId}
          rule={editingMapping?.rule}
          onSave={handleSaveRule}
          onClose={() => {
            setShowRuleBuilder(false);
            setEditingMapping(null);
            setEditingMappingType(null);
          }}
        />
      )}

      {showDataMappingModal && (
        <DataMappingModal
          processId={processId}
          mapping={editingMapping}
          onSave={handleSaveDataMapping}
          onClose={() => {
            setShowDataMappingModal(false);
            setEditingMapping(null);
          }}
        />
      )}
    </div>
  );
}

export default WorkflowMappings;