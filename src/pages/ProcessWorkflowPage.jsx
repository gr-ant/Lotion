import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Settings, FileText, ArrowUp, ArrowDown, Trash2, Users } from 'lucide-react';
import notionService from '../services/NotionService.js';
import WorkflowModel from '../models/WorkflowModel.js';
import WorkflowSettingsModal from '../components/WorkflowSettingsModal.jsx';
import InlineAddRow from '../components/InlineAddRow.jsx';
import './ProcessWorkflowPage.css';

function ProcessWorkflowPage({ processId }) {
  const [revision, setRevision] = useState(0);
  const forceUpdate = () => setRevision(r => r + 1);

  const nameInputRef = useRef(null);
  const [showNewStepSkeleton, setShowNewStepSkeleton] = useState(false);

  useEffect(() => {
    if (showNewStepSkeleton && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showNewStepSkeleton]);

  const process = notionService.getProcessById(processId);
  const workflow = new WorkflowModel(process?.workflow);
  const userGroups = notionService.getUserGroups();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingField, setEditingField] = useState(null);

  // Get forms for this process from localStorage
  const forms = notionService.getForms(processId);

  if (!process) {
    return <div className="page-content">Process not found</div>;
  }

  const handleSaveNewStep = (stepData) => {
    const newWorkflow = new WorkflowModel(workflow.toJSON());
    newWorkflow.addStep(stepData);
    notionService.updateProcessWorkflow(processId, newWorkflow.toJSON());
    forceUpdate();
    setShowNewStepSkeleton(false);
  };

  const handleDeleteStep = (stepId) => {
    const newWorkflow = new WorkflowModel(workflow.toJSON());
    newWorkflow.removeStep(stepId);
    notionService.updateProcessWorkflow(processId, newWorkflow.toJSON());
    forceUpdate();
  };

  const handleMoveStep = (stepId, direction) => {
    const newWorkflow = new WorkflowModel(workflow.toJSON());
    const currentIndex = newWorkflow.steps.findIndex(s => s.id === stepId);
    if (currentIndex === -1) return;
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < newWorkflow.steps.length) {
      newWorkflow.moveStep(stepId, newIndex);
      notionService.updateProcessWorkflow(processId, newWorkflow.toJSON());
      forceUpdate();
    }
  };

  const handleUpdateSettings = (newSettings) => {
    const newWorkflow = new WorkflowModel(workflow.toJSON());
    newWorkflow.updateSettings(newSettings);
    notionService.updateProcessWorkflow(processId, newWorkflow.toJSON());
    forceUpdate();
    setShowSettingsModal(false);
  };

  const handleInlineEdit = (stepId, field, value) => {
    const newWorkflow = new WorkflowModel(workflow.toJSON());
    newWorkflow.updateStep(stepId, { [field]: value });
    notionService.updateProcessWorkflow(processId, newWorkflow.toJSON());
    forceUpdate();
    setEditingField(null);
  };

  const getFormName = (formId) => {
    if (!formId) return 'No Form';
    const form = forms.find(f => f.id === formId);
    return form ? form.name : 'Unknown Form';
  };

  const getUserGroupName = (groupId) => {
    if (!groupId) return 'Unassigned';
    const group = userGroups.find(g => g.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  const startEditing = (stepId, field) => {
    setEditingField(`${stepId}-${field}`);
  };

  const isEditing = (stepId, field) => {
    return editingField === `${stepId}-${field}`;
  };

  const orderedSteps = workflow.getOrderedSteps();

  const startAddNewStep = () => {
    setShowNewStepSkeleton(true);
  };

  const cancelAddNewStep = () => {
    setShowNewStepSkeleton(false);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{process.name} - Workflow</h1>
        <p>{workflow.description}</p>
      </div>

      <div className="content-card full-width">
        <div className="card-header">
          <h3>Workflow Steps</h3>
          <button className="btn btn-secondary" onClick={() => setShowSettingsModal(true)}>
            <Settings size={16} />
            Settings
          </button>
        </div>

        <div className="metadata-fields-grid">
          <div className="metadata-grid-header">
            <div className="header-name">Step Name</div>
            <div className="header-type">Type</div>
            <div className="header-form">Form</div>
            <div className="header-assigned">Assigned To</div>
            <div className="header-actions">Actions</div>
          </div>
          
          {orderedSteps.map((step, index) => (
            <div
              key={step.id}
              className={`metadata-field-row`}
            >
              <div className="prop-cell prop-name">
                {isEditing(step.id, 'name') ? (
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => handleInlineEdit(step.id, 'name', e.target.value)}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingField(null); }}
                    className="seamless-input"
                    autoFocus
                  />
                ) : (
                  <span className="editable-prop" onClick={() => startEditing(step.id, 'name')}>
                    {step.name}
                  </span>
                )}
              </div>

              <div className="prop-cell prop-type">
                <span className="type-tag">{step.type}</span>
              </div>
              
              <div className="prop-cell prop-form">
                {isEditing(step.id, 'formId') ? (
                  <select
                    value={step.formId || ''}
                    onChange={(e) => handleInlineEdit(step.id, 'formId', e.target.value)}
                    onBlur={() => setEditingField(null)}
                    className="seamless-input"
                    autoFocus
                  >
                    <option value="">No Form</option>
                    {forms.map(form => (
                      <option key={form.id} value={form.id}>{form.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="editable-prop" onClick={() => startEditing(step.id, 'formId')}>
                    {getFormName(step.formId)}
                  </span>
                )}
              </div>

              <div className="prop-cell prop-assigned">
                {isEditing(step.id, 'assignedToUserGroup') ? (
                  <select
                    value={step.assignedToUserGroup || ''}
                    onChange={(e) => handleInlineEdit(step.id, 'assignedToUserGroup', e.target.value)}
                    onBlur={() => setEditingField(null)}
                    className="seamless-input"
                    autoFocus
                  >
                    <option value="">Unassigned</option>
                    {userGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="editable-prop" onClick={() => startEditing(step.id, 'assignedToUserGroup')}>
                    {getUserGroupName(step.assignedToUserGroup)}
                  </span>
                )}
              </div>

              <div className="prop-cell prop-actions">
                <button
                  className="action-button"
                  onClick={() => handleMoveStep(step.id, 'up')}
                  disabled={index === 0}
                  title="Move up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  className="action-button"
                  onClick={() => handleMoveStep(step.id, 'down')}
                  disabled={index === orderedSteps.length - 1}
                  title="Move down"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  className="action-button delete"
                  onClick={() => handleDeleteStep(step.id)}
                  title="Delete step"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {orderedSteps.length === 0 && (
             <div className="empty-fields-placeholder">
              <p>No workflow steps created yet. Click "Add Step" to get started.</p>
            </div>
          )}

          <InlineAddRow
            active={showNewStepSkeleton}
            onActivate={startAddNewStep}
            label="Add a step"
            className="metadata-field-row"
          >
            <div className="prop-cell prop-name">
               <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="Enter step name..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      handleSaveNewStep({ name: e.target.value.trim(), type: 'form', formId: '' });
                    }
                    if (e.key === 'Escape') {
                      cancelAddNewStep();
                    }
                  }}
                  onBlur={cancelAddNewStep}
                  className="seamless-input"
                />
            </div>
            <div className="prop-cell prop-type">
              <span className="type-tag">form</span>
            </div>
            <div className="prop-cell prop-form">
              <span className="editable-prop placeholder-text">Select form...</span>
            </div>
            <div className="prop-cell prop-assigned">
              <span className="editable-prop placeholder-text">Select group...</span>
            </div>
            <div className="prop-cell prop-actions">
              <button className="action-button" onClick={cancelAddNewStep} title="Cancel">
                <Trash2 size={14} />
              </button>
            </div>
          </InlineAddRow>
        </div>
      </div>

      {showSettingsModal && (
        <WorkflowSettingsModal
          settings={workflow.settings}
          onSave={handleUpdateSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}

export default ProcessWorkflowPage;
