import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { getProcessById, users } from '../config.js';

function ProcessWorkflowPage({ processId }) {
  const process = getProcessById(processId);
  const [workflowForms, setWorkflowForms] = useState(() => {
    const saved = localStorage.getItem(`workflowForms_${processId}`);
    return saved ? JSON.parse(saved) : (process?.workflow.forms || []);
  });

  useEffect(() => {
    localStorage.setItem(`workflowForms_${processId}`, JSON.stringify(workflowForms));
  }, [workflowForms, processId]);

  if (!process) {
    return <div className="page-content">Process not found</div>;
  }

  const availableForms = process.forms.filter(f => !workflowForms.some(w => w.formId === f.id));

  const addForm = (formId) => {
    setWorkflowForms([...workflowForms, { formId, users: [], order: workflowForms.length + 1 }]);
  };

  const removeForm = (formId) => {
    const updated = workflowForms.filter(f => f.formId !== formId).map((f, idx) => ({ ...f, order: idx + 1 }));
    setWorkflowForms(updated);
  };

  const updateUsers = (formId, userIds) => {
    setWorkflowForms(workflowForms.map(f => f.formId === formId ? { ...f, users: userIds } : f));
  };

  const onDragEnd = ({ source, destination }) => {
    if (!destination) return;
    const reordered = [...workflowForms];
    const [removed] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, removed);
    setWorkflowForms(reordered.map((f, idx) => ({ ...f, order: idx + 1 })));
  };

  const handleAddSelect = (e) => {
    const id = e.target.value;
    if (id) {
      addForm(id);
      e.target.value = '';
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{process.name} - Workflow</h1>
        <p>{process.submenus.find(s => s.name === 'Workflow')?.description}</p>
      </div>
      <div className="content-card full-width">
        <div className="workflow-forms-grid">
          {workflowForms.length > 0 && (
            <div className="workflow-grid-header">
              <div className="header-name">Form</div>
              <div className="header-users">Assigned Users</div>
              <div className="header-actions">Actions</div>
            </div>
          )}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="wf">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {workflowForms.map((wf, index) => {
                    const form = process.forms.find(f => f.id === wf.formId);
                    return (
                      <Draggable key={wf.formId} draggableId={wf.formId} index={index}>
                        {(prov) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className="workflow-form-row"
                          >
                            <div className="prop-cell">{form?.name || wf.formId}</div>
                            <div className="prop-cell">
                              <select
                                multiple
                                value={wf.users}
                                onChange={(e) =>
                                  updateUsers(
                                    wf.formId,
                                    Array.from(e.target.selectedOptions).map(o => o.value)
                                  )
                                }
                                className="inline-edit-select"
                              >
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="prop-cell">
                              <button className="action-button delete" onClick={() => removeForm(wf.formId)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <div className="workflow-form-row skeleton-row">
            <div className="prop-cell">
              <select onChange={handleAddSelect} value="" className="inline-edit-select">
                <option value="">Add form...</option>
                {availableForms.map(form => (
                  <option key={form.id} value={form.id}>{form.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcessWorkflowPage;
