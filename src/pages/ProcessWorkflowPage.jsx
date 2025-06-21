import { Plus, FileText, Settings, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getProcessById, getWorkflowByProcessId } from '../config.js';
import WorkflowModel from '../models/WorkflowModel.js';

function ProcessWorkflowPage({ processId }) {
  const process = getProcessById(processId);
  const workflowConfig = getWorkflowByProcessId(processId);

  const [forms, setForms] = useState(() => {
    const saved = localStorage.getItem(`workflowForms_${processId}`);
    if (saved) return JSON.parse(saved);
    return workflowConfig?.forms || [];
  });

  useEffect(() => {
    localStorage.setItem(`workflowForms_${processId}`, JSON.stringify(forms));
  }, [forms, processId]);

  const moveForm = (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= forms.length) return;
    const updated = [...forms];
    const [item] = updated.splice(index, 1);
    updated.splice(newIndex, 0, item);
    setForms(updated.map((f, idx) => ({ ...f, order: idx + 1 })));
  };

  const removeForm = (formId) => {
    const updated = forms.filter(f => f.formId !== formId);
    setForms(updated.map((f, idx) => ({ ...f, order: idx + 1 })));
  };

  const addForm = (formId) => {
    if (!formId) return;
    const updated = [...forms, { formId, order: forms.length + 1 }];
    setForms(updated);
  };

  const availableForms = process?.forms.filter(f => !forms.some(wf => wf.formId === f.id)) || [];

  const workflow = new WorkflowModel({ forms });

  if (!process) {
    return <div className="page-content">Process not found</div>;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{process.name} - Workflow</h1>
        <p>{process.submenus.find(s => s.name === 'Workflow')?.description}</p>
      </div>
      <div className="content-grid">
        <div className="content-card">
          <h3>Workflow Steps</h3>
          <div className="workflow-steps">
            {process.workflow.steps.map((step) => (
              <div key={step.id} className="workflow-step">
                <div className="step-number">{step.order}</div>
                <div className="step-content">
                  <h4>{step.name}</h4>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="content-card">
          <h3>Forms Order</h3>
          <div className="workflow-forms">
            {workflow.getOrderedForms().map(({ formId, order }, index) => {
              const form = process.forms.find(f => f.id === formId);
              return (
                <div key={formId} className="workflow-step">
                  <div className="step-number">{order}</div>
                  <div className="step-content">
                    <h4>{form?.name || formId}</h4>
                  </div>
                  <div className="step-actions">
                    <button
                      className="action-button"
                      disabled={index === 0}
                      onClick={() => moveForm(index, -1)}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="action-button"
                      disabled={index === forms.length - 1}
                      onClick={() => moveForm(index, 1)}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      className="action-button delete"
                      onClick={() => removeForm(formId)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="workflow-step skeleton-row">
              <select onChange={(e) => { addForm(e.target.value); e.target.value=''; }}>
                <option value="">Add form...</option>
                {availableForms.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="content-card">
          <h3>Workflow Actions</h3>
          <div className="workflow-actions">
            <button className="action-button">
              <Plus size={16} />
              Add Step
            </button>
            <button className="action-button">
              <FileText size={16} />
              Export Workflow
            </button>
            <button className="action-button">
              <Settings size={16} />
              Workflow Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcessWorkflowPage;
