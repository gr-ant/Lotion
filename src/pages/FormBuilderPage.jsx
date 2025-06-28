import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FileText, Trash2 } from 'lucide-react';
import notionService from '../services/NotionService.js';
import FormRenderer from '../components/FormRenderer.jsx';
import Modal from '../components/Modal.jsx';
import './FormBuilderPage.css';

function FormBuilderPage() {
  const { processId, formId } = useParams();
  const navigate = useNavigate();
  const process = notionService.getProcessById(processId);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const contextMenuRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);

  const metadataFields = useMemo(() => {
    const savedFields = localStorage.getItem(`metadataFields_${processId}`);
    const processFields = savedFields ? JSON.parse(savedFields) : (process?.metadataFields || []);
    const enterpriseFields = notionService.getEnterpriseFields();
    return [...enterpriseFields, ...processFields];
  }, [processId, process]);

  const [form, setForm] = useState(() => {
    const forms = notionService.getForms(processId);
    const existingForm = forms.find(f => f.id === formId);
    if (existingForm) {
      return existingForm;
    }
    return { id: formId, name: 'New Form', description: 'A new empty form.', layout: [] };
  });

  useEffect(() => {
    const forms = notionService.getForms(processId).filter(f => f.id !== formId);
    forms.push(form);
    notionService.updateForms(processId, forms);
  }, [form, processId, formId]);

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;

    const currentLayout = form.layout;
    const availableFields = metadataFields.filter(
      field => !currentLayout.some(item => item.metadataFieldId === field.id)
    );

    if (source.droppableId === 'availableFields' && destination.droppableId === 'formLayout') {
      const fieldToAdd = availableFields[source.index];
      const newLayout = [...currentLayout];
      newLayout.splice(destination.index, 0, {
        metadataFieldId: fieldToAdd.id,
        fullWidth: false
      });
      setForm({ ...form, layout: newLayout });
    } else if (source.droppableId === 'formLayout' && destination.droppableId === 'formLayout') {
      const newLayout = [...currentLayout];
      const [removed] = newLayout.splice(source.index, 1);
      newLayout.splice(destination.index, 0, removed);
      setForm({ ...form, layout: newLayout });
    } else if (source.droppableId === 'formLayout' && destination.droppableId === 'availableFields') {
      const newLayout = [...currentLayout];
      newLayout.splice(source.index, 1);
      setForm({ ...form, layout: newLayout });
    }
  };

  const startEditingTitle = () => {
    setTitleValue(form.name);
    setIsEditingTitle(true);
  };

  const saveTitle = () => {
    if (titleValue.trim()) {
      setForm({ ...form, name: titleValue.trim() });
    }
    setIsEditingTitle(false);
  };

  const cancelTitleEdit = () => {
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelTitleEdit();
    }
  };

  const handleFormClick = (e) => {
    if (e.target.closest('.form-layout-field') || e.target.closest('.context-menu')) {
      return;
    }
    setContextMenu({ x: e.clientX, y: e.clientY, isPositioned: false });
  };

  useEffect(() => {
    if (contextMenu && !contextMenu.isPositioned && contextMenuRef.current) {
      const menu = contextMenuRef.current;
      const menuRect = menu.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      let newY = contextMenu.y;
      if (newY + menuRect.height > windowHeight) {
        newY = contextMenu.y - menuRect.height;
        if (newY < 0) {
          newY = windowHeight - menuRect.height - 10;
          if (newY < 0) newY = 10;
        }
      }
      setContextMenu({ ...contextMenu, y: newY, isPositioned: true });
    }
  }, [contextMenu]);

  const addFieldToForm = (field, fullWidth = false, position = null) => {
    const newField = { metadataFieldId: field.id, fullWidth, readOnly: false };

    let newLayout;
    if (position !== null) {
      newLayout = [...form.layout];
      newLayout.splice(position, 0, newField);
    } else {
      newLayout = [...form.layout, newField];
    }

    setForm({ ...form, layout: newLayout });
    setContextMenu(null);
  };

  const toggleFieldWidth = (fieldIndex) => {
    const newLayout = [...form.layout];
    newLayout[fieldIndex] = {
      ...newLayout[fieldIndex],
      fullWidth: !newLayout[fieldIndex].fullWidth,
    };
    setForm({ ...form, layout: newLayout });
  };

  const toggleFieldReadOnly = (fieldIndex) => {
    const newLayout = [...form.layout];
    newLayout[fieldIndex] = {
      ...newLayout[fieldIndex],
      readOnly: !newLayout[fieldIndex].readOnly,
    };
    setForm({ ...form, layout: newLayout });
  };

  const removeFieldFromForm = (fieldId) => {
    const newLayout = form.layout.filter(l => l.metadataFieldId !== fieldId);
    setForm({ ...form, layout: newLayout });
  };

  if (!process) {
    return <div className="page-content">Process not found for ID: {processId}</div>;
  }

  const getFieldById = (id) => metadataFields.find(f => f.id === id);
  const availableFields = metadataFields.filter(
    field => !form.layout.some(item => item.metadataFieldId === field.id)
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="page-content">
        <div className="page-header">
          <div className="page-header-content">
            <div>
              {isEditingTitle ? (
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={saveTitle}
                  className="seamless-input page-title-input"
                  autoFocus
                />
              ) : (
                <h1 className="editable-prop page-title" onClick={startEditingTitle}>{form.name}</h1>
              )}
              <p>Building form for: {process.name}</p>
            </div>
            <div className="page-header-actions">
              <button className="primary-button" onClick={() => setShowPreview(true)}>
                <FileText size={16} />
                Preview Form
              </button>
              <button className="primary-button" onClick={() => navigate(`/processes/${processId}/forms`)}>
                <FileText size={16} />
                Back to Forms
              </button>
            </div>
          </div>
        </div>

        <div className="form-builder-layout">
          <Droppable droppableId="availableFields" isDropDisabled={false}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="form-builder-panel available-fields">
                <h3>Available Fields</h3>
                <p>Drag fields to the form or click on the form to add fields</p>
                {availableFields.length === 0 ? (
                  <div className="empty-fields-placeholder">
                    <p>No available fields. Create fields in the Metadata section first.</p>
                  </div>
                ) : (
                  availableFields.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="form-builder-field">
                          <h4>{field.name}</h4>
                          <span className="field-type">{field.type}</span>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <Droppable droppableId="formLayout" isDropDisabled={false}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`form-builder-panel form-layout ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                onClick={handleFormClick}
              >
                <h3>Form Layout</h3>
                <p>Click anywhere to add fields. Drag to reorder.</p>

                <div className="form-fields-container">
                  {form.layout.map((item, index) => {
                    const field = getFieldById(item.metadataFieldId);
                    return field ? (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`form-layout-field ${item.fullWidth ? 'full-width' : ''}`}
                          >
                            <div className="field-info">
                              <h4>{field.name}</h4>
                              <p>{field.description}</p>
                              <div className="field-meta">
                                <span className="field-type">{field.type}</span>
                                {field.required && <span className="field-required">Required</span>}
                                {item.fullWidth && <span className="field-full-width">Full Width</span>}
                                {item.readOnly && <span className="field-readonly">Read Only</span>}
                              </div>
                            </div>
                            <div className="field-actions">
                              <button
                                className={`action-button${item.readOnly ? ' active' : ''}`}
                                onClick={() => toggleFieldReadOnly(index)}
                                title={item.readOnly ? 'Set editable' : 'Set read only'}
                              >
                                {item.readOnly ? <span role="img" aria-label="Read Only">🔒</span> : <span role="img" aria-label="Editable">🔓</span>}
                              </button>
                              <button
                                className="action-button"
                                onClick={() => toggleFieldWidth(index)}
                                title={item.fullWidth ? 'Make single column' : 'Make full width'}
                              >
                                {item.fullWidth ? '↔' : '↔'}
                              </button>
                              <button className="action-button delete" onClick={() => removeFieldFromForm(field.id)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ) : null;
                  })}
                </div>

                {provided.placeholder}
                {form.layout.length === 0 && (
                  <div className="empty-form-placeholder">
                    <p>Click anywhere to add fields to your form</p>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>

        {showPreview && form.layout.length > 0 && (
          <Modal title={form.name} onClose={() => setShowPreview(false)}>
            <FormRenderer form={form} metadataFields={metadataFields} isPreview={false} processId={processId} />
          </Modal>
        )}

        {contextMenu && (
          <div className="context-menu-overlay" onClick={() => setContextMenu(null)}>
            <div
              ref={contextMenuRef}
              className="context-menu"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
                visibility: contextMenu.isPositioned ? 'visible' : 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="context-menu-header">
                <h4>Add Field</h4>
              </div>
              {availableFields.length === 0 ? (
                <div className="context-menu-empty">
                  <p>No available fields</p>
                </div>
              ) : (
                <div className="context-menu-items">
                  {availableFields.map(field => (
                    <div key={field.id} className="context-menu-item">
                      <div
                        className="context-menu-field-info"
                        onClick={() => addFieldToForm(field, false)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="field-name">{field.name}</span>
                        <span className="field-type">{field.type}</span>
                      </div>
                      <div className="context-menu-actions" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
}

export default FormBuilderPage;
