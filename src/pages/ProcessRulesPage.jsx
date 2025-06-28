import { useState } from 'react';
import { Trash2, Edit2, Plus } from 'lucide-react';
import notionService from '../services/NotionService.js';
import RuleModal from '../components/RuleModal.jsx';
import './ProcessRulesPage.css';
import './ProcessMetadataPage.css';

function ProcessRulesPage({ processId }) {
  const process = notionService.getProcessById(processId);
  const [revision, setRevision] = useState(0);
  const forceUpdate = () => setRevision(r => r + 1);

  if (!process) {
    return <div className="page-content">Process not found</div>;
  }

  const enterpriseFields = notionService.getEnterpriseFields();
  const metadataFields = [...enterpriseFields, ...(process.metadataFields || [])];
  const rules = notionService.getRules(processId);

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const handleAddRule = () => {
    setEditingRule(null);
    setShowRuleModal(true);
  };

  const handleEditRule = (rule) => {
    // Convert old rule format to new format if needed
    const convertedRule = rule.conditions ? rule : {
      conditions: [{
        id: `cond_${Date.now()}`,
        leftFieldId: rule.leftFieldId,
        operator: rule.operator,
        rightMode: rule.rightMode || 'field',
        rightFieldId: rule.rightFieldId,
        rightValue: rule.rightValue || ''
      }],
      logic: 'AND'
    };
    setEditingRule({ ...rule, ...convertedRule });
    setShowRuleModal(true);
  };

  const handleSaveRule = (ruleData) => {
    if (editingRule && editingRule.id) {
      // Update existing rule
      notionService.updateRule(processId, editingRule.id, {
        ...editingRule,
        ...ruleData,
        name: editingRule.name
      });
    } else {
      // Add new rule
      notionService.addRule(processId, {
        id: `rule${Date.now()}`,
        name: 'New Rule',
        ...ruleData
      });
    }
    setShowRuleModal(false);
    setEditingRule(null);
    forceUpdate();
  };

  const updateRuleName = (ruleId, name) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      notionService.updateRule(processId, ruleId, { ...rule, name });
      forceUpdate();
    }
  };

  const deleteRule = (ruleId) => {
    notionService.deleteRule(processId, ruleId);
    forceUpdate();
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
    if (rule.conditions && rule.conditions.length > 0) {
      // New format
      const conditionTexts = rule.conditions.map(cond => {
        const leftField = metadataFields.find(f => f.id === cond.leftFieldId)?.name || 'Unknown';
        const operator = getOperatorDisplay(cond.operator);
        let rightSide = '';
        
        if (cond.rightMode === 'field') {
          rightSide = `[${metadataFields.find(f => f.id === cond.rightFieldId)?.name || 'Unknown'}]`;
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
      const leftField = metadataFields.find(f => f.id === rule.leftFieldId)?.name || 'Unknown';
      const operator = getOperatorDisplay(rule.operator);
      let rightSide = '';
      
      if (rule.rightMode === 'value') {
        rightSide = rule.rightValue || '(empty)';
      } else {
        rightSide = metadataFields.find(f => f.id === rule.rightFieldId)?.name || 'Unknown';
      }
      
      return `${leftField} ${operator} ${rightSide}`;
    }
  };

  return (
    <>
      <div className="page-content">
        <div className="page-header">
          <h1>{process.name} - Rules</h1>
          <p>{process.submenus.find(s => s.name === 'Rules')?.description}</p>
        </div>
        <div className="content-card full-width">
          <div className="card-header">
            <h3>Rules</h3>
            <button className="btn btn-primary" onClick={handleAddRule}>
              <Plus size={16} />
              Add Rule
            </button>
          </div>
          <div className="rules-list">
            {rules.length === 0 ? (
              <div className="empty-rules-state">
                <p>No rules created yet.</p>
                <p>Click "Add Rule" to create your first rule.</p>
              </div>
            ) : (
              rules.map(rule => (
                <div key={rule.id} className="rule-item">
                  <div className="rule-header">
                    <input
                      type="text"
                      className="rule-name-input"
                      value={rule.name}
                      onChange={(e) => updateRuleName(rule.id, e.target.value)}
                      placeholder="Rule name..."
                    />
                    <div className="rule-actions">
                      <button 
                        className="btn btn-icon" 
                        onClick={() => handleEditRule(rule)}
                        title="Edit rule"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn btn-icon btn-danger" 
                        onClick={() => deleteRule(rule.id)}
                        title="Delete rule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="rule-description">
                    {getRuleDescription(rule)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showRuleModal && (
        <RuleModal
          processId={processId}
          rule={editingRule}
          onSave={handleSaveRule}
          onClose={() => {
            setShowRuleModal(false);
            setEditingRule(null);
          }}
        />
      )}
    </>
  );
}

export default ProcessRulesPage;