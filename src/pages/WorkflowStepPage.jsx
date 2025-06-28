import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Users, Settings, Plus, Trash2 } from 'lucide-react';
import notionService from '../services/NotionService.js';
import WorkflowModel from '../models/WorkflowModel.js';
import WorkflowMappings from '../components/WorkflowMappings.jsx';
import MultiAssignSelector from '../components/MultiAssignSelector.jsx';
import './WorkflowStepPage.css';

function WorkflowStepPage() {
  const { processId, stepId } = useParams();
  const navigate = useNavigate();
  const [editingField, setEditingField] = useState(null);
  const [revision, setRevision] = useState(0);
  const forceUpdate = () => setRevision(r => r + 1);

  const process = notionService.getProcessById(processId);
  const workflow = new WorkflowModel(process?.workflow);
  const step = workflow.getStepById(stepId);
  const userGroups = notionService.getUserGroups();
  const forms = notionService.getForms(processId);
  
  // Ensure step has mappings initialized
  if (step && !step.mappings) {
    step.mappings = { routing: [], data: [] };
  }

  if (!process || !step) {
    return <div className="page-content">Step not found</div>;
  }

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

  const getAssigneeNames = (assignees) => {
    if (!assignees || assignees.length === 0) return 'Unassigned';
    
    const names = assignees.map(assignee => {
      if (assignee.type === 'group') {
        const group = userGroups.find(g => g.id === assignee.id);
        return group ? group.name : 'Unknown Group';
      } else {
        const user = notionService.getUsers().find(u => u.id === assignee.id);
        return user ? user.name : 'Unknown User';
      }
    });
    
    return names.join(', ');
  };

  const handleAssigneeChange = (newAssignees) => {
    const newWorkflow = new WorkflowModel(workflow.toJSON());
    newWorkflow.updateStep(stepId, { assignedTo: newAssignees });
    notionService.updateProcessWorkflow(processId, newWorkflow.toJSON());
    forceUpdate();
  };

  const handleBack = () => {
    navigate(`/processes/${processId}/workflow`);
  };

  const handleInlineEdit = (field, value) => {
    const newWorkflow = new WorkflowModel(workflow.toJSON());
    newWorkflow.updateStep(stepId, { [field]: value });
    notionService.updateProcessWorkflow(processId, newWorkflow.toJSON());
    forceUpdate();
    setEditingField(null);
  };

  const startEditing = (field) => {
    setEditingField(field);
  };

  const isEditing = (field) => {
    return editingField === field;
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="header-with-back">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{step.name}</h1>
            <p className="breadcrumb">{process.name} / Workflow / {step.name}</p>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="content-card">
          <div className="card-header">
            <h3>Step Details</h3>
          </div>
          <div className="step-details">
            <div className="detail-row">
              <label>Step Name</label>
              {isEditing('name') ? (
                <input
                  type="text"
                  value={step.name}
                  onChange={(e) => handleInlineEdit('name', e.target.value)}
                  onBlur={() => setEditingField(null)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingField(null); }}
                  className="seamless-input"
                  autoFocus
                />
              ) : (
                <span className="editable-value" onClick={() => startEditing('name')}>
                  {step.name}
                </span>
              )}
            </div>
            <div className="detail-row">
              <label>Form</label>
              {isEditing('formId') ? (
                <select
                  value={step.formId || ''}
                  onChange={(e) => handleInlineEdit('formId', e.target.value)}
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
                <span className="editable-value" onClick={() => startEditing('formId')}>
                  <FileText size={16} className="inline-icon" />
                  {getFormName(step.formId)}
                </span>
              )}
            </div>
            <div className="detail-row">
              <label>Assigned To</label>
              <div className="assignee-section">
                <MultiAssignSelector
                  value={step.assignedTo || []}
                  onChange={handleAssigneeChange}
                  placeholder="Select users or groups..."
                />
                {step.assignedToUserGroup && (
                  <div className="legacy-assignment">
                    <span className="legacy-label">Legacy assignment:</span>
                    <span className="legacy-value">{getUserGroupName(step.assignedToUserGroup)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="detail-row">
              <label>Description</label>
              {isEditing('description') ? (
                <textarea
                  value={step.description || ''}
                  onChange={(e) => handleInlineEdit('description', e.target.value)}
                  onBlur={() => setEditingField(null)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setEditingField(null); }}
                  className="seamless-input"
                  rows="3"
                  autoFocus
                />
              ) : (
                <span className="editable-value" onClick={() => startEditing('description')}>
                  {step.description || 'No description provided'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <h3>Workflow Mappings</h3>
          </div>
          <WorkflowMappings
            step={step}
            allSteps={workflow.getOrderedSteps()}
            processId={processId}
            onUpdate={(updates) => {
              const newMappings = updates.mappings || {};
              const newWorkflow = new WorkflowModel(workflow.toJSON());
              newWorkflow.updateStep(stepId, { mappings: newMappings });
              notionService.updateProcessWorkflow(processId, newWorkflow.toJSON());
              forceUpdate();
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default WorkflowStepPage;