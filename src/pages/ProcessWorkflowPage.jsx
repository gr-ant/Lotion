import { Plus, FileText, Settings } from 'lucide-react';
import { getProcessById } from '../config.js';

function ProcessWorkflowPage({ processId }) {
  const process = getProcessById(processId);

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
