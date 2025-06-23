import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import notionService from '../services/NotionService.js';
import InlineAddRow from '../components/InlineAddRow.jsx';
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
  const datasets = notionService.getDatasets(processId);
  const rules = notionService.getRules(processId);

  const [addingRule, setAddingRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [editingField, setEditingField] = useState(null); // rule id
  const [editingProp, setEditingProp] = useState(null);

  const handleAddRule = () => {
    if (!newRuleName.trim()) return;
    const firstField = metadataFields[0]?.id || '';
    notionService.addRule(processId, {
      id: `rule${Date.now()}`,
      name: newRuleName.trim(),
      leftFieldId: firstField,
      operator: '=',
      value: ''
    });
    setNewRuleName('');
    setAddingRule(false);
    forceUpdate();
  };

  const updateRule = (ruleId, prop, value) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      notionService.updateRule(processId, ruleId, { ...rule, [prop]: value });
      forceUpdate();
    }
  };

  const deleteRule = (ruleId) => {
    notionService.deleteRule(processId, ruleId);
    forceUpdate();
  };

  const startEditing = (id, prop) => {
    setEditingField(id);
    setEditingProp(prop);
  };

  const stopEditing = () => {
    setEditingField(null);
    setEditingProp(null);
  };

  const getFieldName = (id) => {
    return metadataFields.find(f => f.id === id)?.name || 'Unknown';
  };

  const getFieldById = (id) => metadataFields.find(f => f.id === id);

  const getDropdownOptions = (field) => {
    if (!field) return [];
    let options = field.options || [];
    if (field.datasetId) {
      const dataset = datasets.find(ds => ds.id === field.datasetId);
      if (dataset && dataset.items) {
        options = dataset.items.map(i => ({ value: i.value, label: i.label }));
      }
    }
    return options;
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{process.name} - Rules</h1>
        <p>{process.submenus.find(s => s.name === 'Rules')?.description}</p>
      </div>
      <div className="content-card full-width">
        <div className="metadata-fields-grid">
          <div className="metadata-grid-header">
            <div className="header-name">Rule Name</div>
            <div>Field</div>
            <div>Operator</div>
            <div>Value</div>
            <div className="header-actions">Actions</div>
          </div>
          {rules.length === 0 ? (
            <div className="empty-fields-placeholder">
              <p>No rules created yet. Click below to get started.</p>
            </div>
          ) : (
            rules.map(rule => (
              <div key={rule.id} className="metadata-field-row">
                <div className="prop-cell prop-name">
                  {editingField === rule.id && editingProp === 'name' ? (
                    <input
                      type="text"
                      className="seamless-input"
                      value={rule.name}
                      onChange={e => updateRule(rule.id, 'name', e.target.value)}
                      onBlur={stopEditing}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') stopEditing(); }}
                      autoFocus
                    />
                  ) : (
                    <span className="editable-prop" onClick={() => startEditing(rule.id,'name')}>{rule.name}</span>
                  )}
                </div>
                <div className="prop-cell">
                  {editingField === rule.id && editingProp === 'leftFieldId' ? (
                    <select
                      className="seamless-input"
                      value={rule.leftFieldId}
                      onChange={e => updateRule(rule.id, 'leftFieldId', e.target.value)}
                      onBlur={stopEditing}
                      autoFocus
                    >
                      {metadataFields.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="editable-prop" onClick={() => startEditing(rule.id,'leftFieldId')}>{getFieldName(rule.leftFieldId)}</span>
                  )}
                </div>
                <div className="prop-cell">
                  {editingField === rule.id && editingProp === 'operator' ? (
                    <select
                      className="seamless-input"
                      value={rule.operator}
                      onChange={e => updateRule(rule.id, 'operator', e.target.value)}
                      onBlur={stopEditing}
                      autoFocus
                    >
                      <option value="=">=</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="!=">≠</option>
                    </select>
                  ) : (
                    <span className="editable-prop" onClick={() => startEditing(rule.id,'operator')}>{rule.operator}</span>
                  )}
                </div>
                <div className="prop-cell">
                  {editingField === rule.id && editingProp === 'value' ? (
                    (() => {
                      const field = getFieldById(rule.leftFieldId);
                      if (field && (field.type === 'select' || field.type === 'dropdown')) {
                        const opts = getDropdownOptions(field);
                        return (
                          <select
                            className="seamless-input"
                            value={rule.value}
                            onChange={e => updateRule(rule.id, 'value', e.target.value)}
                            onBlur={stopEditing}
                            autoFocus
                          >
                            {opts.map((o, idx) => (
                              <option key={idx} value={o.value || o}>
                                {o.label || o.value || o}
                              </option>
                            ))}
                          </select>
                        );
                      }
                      return (
                        <input
                          type="text"
                          className="seamless-input"
                          value={rule.value}
                          onChange={e => updateRule(rule.id, 'value', e.target.value)}
                          onBlur={stopEditing}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') stopEditing(); }}
                          autoFocus
                        />
                      );
                    })()
                  ) : (
                    <span className="editable-prop" onClick={() => startEditing(rule.id,'value')}>
                      {rule.value || 'Click to add...'}
                    </span>
                  )}
                </div>
                <div className="prop-cell prop-actions">
                  <button className="action-button delete" onClick={() => deleteRule(rule.id)} title="Delete rule">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
          <InlineAddRow
            active={addingRule}
            onActivate={() => setAddingRule(true)}
            label={<span className="editable-prop" style={{ color: '#666' }}>Add a rule</span>}
            className="metadata-field-row"
            cellClassName="prop-cell"
          >
            <div className="prop-cell prop-name">
              <input
                type="text"
                value={newRuleName}
                onChange={e => setNewRuleName(e.target.value)}
                placeholder="Rule name"
                className="seamless-input"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && newRuleName.trim()) handleAddRule(); }}
                onBlur={() => { if (newRuleName.trim()) { handleAddRule(); } else { setAddingRule(false); setNewRuleName(''); } }}
              />
            </div>
            <div className="prop-cell"><span className="editable-prop placeholder-text">Select field...</span></div>
            <div className="prop-cell"><span className="editable-prop placeholder-text">=</span></div>
            <div className="prop-cell"><span className="editable-prop placeholder-text">Enter value...</span></div>
            <div className="prop-cell prop-actions"></div>
          </InlineAddRow>
        </div>
      </div>
    </div>
  );
}

export default ProcessRulesPage;
