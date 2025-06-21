import { BrowserRouter as Router, Routes, Route, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import * as ReactDOM from 'react-dom';
import { Plus, Menu, ChevronRight, ChevronDown, FileText, Settings, Edit, Trash2 } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { config, getProcessById } from './config.js';
import FormRenderer from './components/FormRenderer.jsx';
import './App.css';

function Sidebar() {
  const location = useLocation();
  const [expandedProcess, setExpandedProcess] = useState(null);
  
  const toggleProcess = (processId) => {
    setExpandedProcess(expandedProcess === processId ? null : processId);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">{config.app.name}</h1>
        <button className="menu-button">
          <Menu size={20} />
        </button>
      </div>
      
      <div className="sidebar-content">
        <div className="nav-section">
          <div className="nav-header">
            <span>Processes</span>
            <button className="add-button">
              <Plus size={16} />
            </button>
          </div>
          <nav className="nav-menu">
            {config.processes.map((process) => {
              const isExpanded = expandedProcess === process.id;
              const isActive = location.pathname.startsWith(`/processes/${process.id}`);
              
              return (
                <div key={process.id} className="process-item">
                  <button
                    className={`nav-item process-header ${isActive ? 'active' : ''}`}
                    onClick={() => toggleProcess(process.id)}
                  >
                    <div className="process-icon">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    <span>{process.name}</span>
                  </button>
                  
                  {isExpanded && (
                    <div className="process-submenu">
                      {process.submenus.map((submenu) => {
                        const isSubActive = location.pathname.startsWith(submenu.path);
                        return (
                          <Link
                            key={submenu.id}
                            to={submenu.path}
                            className={`nav-item submenu-item ${isSubActive ? 'active' : ''}`}
                          >
                            <span>{submenu.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

function BooleanSelector({ onSelect, onClose, targetRef }) {
  const [position, setPosition] = useState(null);
  const selectorRef = useRef(null);

  useEffect(() => {
    if (targetRef) {
      const rect = targetRef.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left });
    }
  }, [targetRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!position) return null;

  return ReactDOM.createPortal(
    <div className="type-selector-menu" style={{ top: position.top, left: position.left }} ref={selectorRef}>
      <div className="type-selector-item" onClick={() => onSelect(true)}>Yes</div>
      <div className="type-selector-item" onClick={() => onSelect(false)}>No</div>
    </div>,
    document.body
  );
}

function TypeSelector({ onSelect, onClose, targetRef }) {
  const [position, setPosition] = useState(null);
  const selectorRef = useRef(null);

  useEffect(() => {
    if (targetRef) {
      const rect = targetRef.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left });
    }
  }, [targetRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!position) return null;

  const fieldTypes = ["text", "number", "email", "date", "select", "textarea", "boolean"];

  return ReactDOM.createPortal(
    <div className="type-selector-menu" style={{ top: position.top, left: position.left }} ref={selectorRef}>
      {fieldTypes.map(type => (
        <div key={type} className="type-selector-item" onClick={() => onSelect(type)}>
          {type}
        </div>
      ))}
    </div>,
    document.body
  );
}

function ProcessMetadataPage({ processId }) {
  const process = getProcessById(processId);
  const typeSelectorRefs = useRef({});
  const requiredSelectorRefs = useRef({});
  
  const [metadataFields, setMetadataFields] = useState(() => {
    const savedFields = localStorage.getItem(`metadataFields_${processId}`);
    return savedFields ? JSON.parse(savedFields) : (process?.metadataFields || []);
  });

  useEffect(() => {
    localStorage.setItem(`metadataFields_${processId}`, JSON.stringify(metadataFields));
  }, [metadataFields, processId]);

  const [editingField, setEditingField] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [activeTypeSelector, setActiveTypeSelector] = useState(null);
  const [activeRequiredSelector, setActiveRequiredSelector] = useState(null);
  
  if (!process) return <div className="page-content">Process not found</div>;

  const addMetadataField = () => {
    const newField = {
      id: `field${Date.now()}`, name: 'New Field', type: 'text', required: false,
      description: '', placeholder: '', options: []
    };
    setMetadataFields([...metadataFields, newField]);
    setEditingField(newField.id);
    setEditingProperty('name');
  };

  const updateFieldProperty = (fieldId, property, value) => {
    setMetadataFields(metadataFields.map(f => f.id === fieldId ? { ...f, [property]: value } : f));
  };

  const deleteMetadataField = (id) => {
    setMetadataFields(metadataFields.filter(f => f.id !== id));
    if (editingField === id) {
      setEditingField(null);
      setEditingProperty(null);
    }
  };

  const startEditing = (fieldId, property) => {
    if (property === 'type') {
      setActiveTypeSelector(fieldId);
    } else if (property === 'required') {
      setActiveRequiredSelector(fieldId);
    } else {
      setEditingField(fieldId);
      setEditingProperty(property);
    }
  };

  const stopEditing = () => {
    setEditingField(null);
    setEditingProperty(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      stopEditing();
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{process.name} - Metadata</h1>
        <p>{process.submenus.find(s => s.name === 'Metadata')?.description}</p>
      </div>
      
      <div className="content-card full-width">
        <div className="card-header">
          <h3>Metadata Fields</h3>
        </div>
        
        <div className="metadata-fields-grid">
          {metadataFields.length > 0 && (
            <div className="metadata-grid-header">
              <div className="header-name">Field Name</div>
              <div className="header-type">Type</div>
              <div className="header-required">Required</div>
              <div className="header-desc">Description</div>
              <div className="header-placeholder">Placeholder</div>
              <div className="header-actions">Actions</div>
            </div>
          )}
          {metadataFields.length === 0 ? (
            <div className="empty-fields-placeholder">
              <p>No metadata fields created yet. Click "Add Field" to get started.</p>
            </div>
          ) : (
            metadataFields.map((field) => (
              <div key={field.id} className="metadata-field-row">
                <div className="prop-cell prop-name">
                  {editingField === field.id && editingProperty === 'name' ? (
                    <input type="text" value={field.name}
                      onChange={(e) => updateFieldProperty(field.id, 'name', e.target.value)}
                      onBlur={stopEditing} onKeyDown={handleKeyDown}
                      className="seamless-input" autoFocus />
                  ) : ( <span className="editable-prop" onClick={() => startEditing(field.id, 'name')}>{field.name}</span> )}
                </div>

                <div className="prop-cell prop-type" ref={el => typeSelectorRefs.current[field.id] = el}>
                  <span className="editable-prop type-tag" onClick={() => startEditing(field.id, 'type')}>{field.type}</span>
                </div>

                <div className="prop-cell prop-required" ref={el => requiredSelectorRefs.current[field.id] = el}>
                  <span 
                    className={`editable-prop required-tag ${field.required ? 'yes' : 'no'}`} 
                    onClick={() => startEditing(field.id, 'required')}
                  >
                    {field.required ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="prop-cell prop-desc">
                  {editingField === field.id && editingProperty === 'description' ? (
                    <input type="text" value={field.description}
                      onChange={(e) => updateFieldProperty(field.id, 'description', e.target.value)}
                      onBlur={stopEditing} onKeyDown={handleKeyDown}
                      className="seamless-input" autoFocus placeholder="Enter description..." />
                  ) : ( <span className="editable-prop placeholder-text" onClick={() => startEditing(field.id, 'description')}>{field.description || 'Click to add...'}</span> )}
                </div>

                <div className="prop-cell prop-placeholder">
                   {editingField === field.id && editingProperty === 'placeholder' ? (
                    <input type="text" value={field.placeholder}
                      onChange={(e) => updateFieldProperty(field.id, 'placeholder', e.target.value)}
                      onBlur={stopEditing} onKeyDown={handleKeyDown}
                      className="seamless-input" autoFocus placeholder="Enter placeholder..." />
                  ) : ( <span className="editable-prop placeholder-text" onClick={() => startEditing(field.id, 'placeholder')}>{field.placeholder || 'Click to add...'}</span> )}
                </div>
                
                <div className="prop-cell prop-actions">
                  <button className="action-button delete" onClick={() => deleteMetadataField(field.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
          <div className="metadata-field-row skeleton-row" onClick={addMetadataField}>
            <div className="prop-cell">
              <span>Add a field</span>
            </div>
          </div>
        </div>
      </div>
       {activeTypeSelector && (
        <TypeSelector
          onSelect={(type) => {
            updateFieldProperty(activeTypeSelector, 'type', type);
            setActiveTypeSelector(null);
          }}
          onClose={() => setActiveTypeSelector(null)}
          targetRef={typeSelectorRefs.current[activeTypeSelector]}
        />
      )}
      {activeRequiredSelector && (
        <BooleanSelector
          onSelect={(value) => {
            updateFieldProperty(activeRequiredSelector, 'required', value);
            setActiveRequiredSelector(null);
          }}
          onClose={() => setActiveRequiredSelector(null)}
          targetRef={requiredSelectorRefs.current[activeRequiredSelector]}
        />
      )}
    </div>
  );
}

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

function ProcessFormsListPage() {
  const { processId } = useParams();
  const navigate = useNavigate();
  const process = getProcessById(processId);
  
  const [forms, setForms] = useState(() => {
    const savedForms = localStorage.getItem(`forms_${processId}`);
    return savedForms ? JSON.parse(savedForms) : (process?.forms || []);
  });

  const [hoveredFormId, setHoveredFormId] = useState(null);

  useEffect(() => {
    localStorage.setItem(`forms_${processId}`, JSON.stringify(forms));
  }, [forms, processId]);

  const createNewForm = () => {
    const newFormId = `form${Date.now()}`;
    const newForm = {
      id: newFormId, name: 'New Form', description: 'A new empty form.', layout: []
    };
    setForms([...forms, newForm]);
    navigate(`/processes/${processId}/forms/${newFormId}`);
  };

  const deleteForm = (formIdToDelete, event) => {
    event.preventDefault();
    event.stopPropagation();
    const updatedForms = forms.filter(form => form.id !== formIdToDelete);
    setForms(updatedForms);
    setHoveredFormId(null);
  };

  if (!process) {
    return <div className="page-content">Process not found for ID: {processId}</div>;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{process.name} - Forms</h1>
      </div>
      <div className="content-card full-width">
        <div className="forms-list">
          {forms.length === 0 ? (
            <div className="empty-forms-placeholder">
              <p>No forms created yet. Click below to get started.</p>
            </div>
          ) : (
            forms.map(form => (
              <Link to={`/processes/${processId}/forms/${form.id}`} key={form.id} className="form-list-item">
                <div className="form-info">
                  <h4>{form.name}</h4>
                  <p>{form.description}</p>
                </div>
                <div className="form-list-actions">
                  <button
                    className="action-button delete"
                    onClick={(e) => deleteForm(form.id, e)}
                    onMouseEnter={() => setHoveredFormId(form.id)}
                    onMouseLeave={() => setHoveredFormId(null)}
                    title="Delete form"
                  >
                    <Trash2 size={16} />
                  </button>
                  {hoveredFormId === form.id && (
                    <div className="delete-warning">
                      Click to delete permanently
                    </div>
                  )}
                  <ChevronRight size={20} className="form-list-arrow" />
                </div>
              </Link>
            ))
          )}
          <div className="form-list-item skeleton-row" onClick={createNewForm}>
            <div className="form-info">
              <h4> Create a new form</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormBuilderPage() {
  const { processId, formId } = useParams();
  const navigate = useNavigate();
  const process = getProcessById(processId);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const contextMenuRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Load metadata fields from localStorage or use process defaults
  const metadataFields = useMemo(() => {
    const savedFields = localStorage.getItem(`metadataFields_${processId}`);
    if (savedFields) {
      return JSON.parse(savedFields);
    }
    return process?.metadataFields || [];
  }, [processId, process]);
  
  // Load form from localStorage or create new one
  const [form, setForm] = useState(() => {
    const savedForms = localStorage.getItem(`forms_${processId}`);
    if (savedForms) {
      const forms = JSON.parse(savedForms);
      const existingForm = forms.find(f => f.id === formId);
      if (existingForm) {
        return existingForm;
      }
    }
    // If form doesn't exist, create a new one
    return {
      id: formId,
      name: 'New Form',
      description: 'A new empty form.',
      layout: []
    };
  });

  // Save form to localStorage whenever it changes
  useEffect(() => {
    const savedForms = localStorage.getItem(`forms_${processId}`);
    const forms = savedForms ? JSON.parse(savedForms) : [];
    const updatedForms = forms.filter(f => f.id !== formId);
    updatedForms.push(form);
    localStorage.setItem(`forms_${processId}`, JSON.stringify(updatedForms));
  }, [form, processId, formId]);

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;

    const currentLayout = form.layout;
    const availableFields = metadataFields.filter(
      field => !currentLayout.some(item => item.metadataFieldId === field.id)
    );

    // Moving from available to form layout
    if (source.droppableId === 'availableFields' && destination.droppableId === 'formLayout') {
      const fieldToAdd = availableFields[source.index];
      const newLayout = [...currentLayout];
      newLayout.splice(destination.index, 0, { 
        metadataFieldId: fieldToAdd.id,
        fullWidth: false // Default to single column
      });
      setForm({ ...form, layout: newLayout });
    } 
    // Reordering within form layout
    else if (source.droppableId === 'formLayout' && destination.droppableId === 'formLayout') {
      const newLayout = [...currentLayout];
      const [removed] = newLayout.splice(source.index, 1);
      newLayout.splice(destination.index, 0, removed);
      setForm({ ...form, layout: newLayout });
    }
    // Moving from form layout back to available
    else if (source.droppableId === 'formLayout' && destination.droppableId === 'availableFields') {
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
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isPositioned: false,
    });
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
    const newField = {
      metadataFieldId: field.id,
      fullWidth: fullWidth
    };

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
      fullWidth: !newLayout[fieldIndex].fullWidth
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
                <h1 
                  className="editable-prop page-title"
                  onClick={startEditingTitle}
                >
                  {form.name}
                </h1>
              )}
              <p>Building form for: {process.name}</p>
            </div>
            <div className="page-header-actions">
              <button 
                className="primary-button"
                onClick={() => setShowPreview(!showPreview)}
              >
                <FileText size={16} />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button 
                className="primary-button"
                onClick={() => navigate(`/processes/${processId}/forms`)}
              >
                <FileText size={16} />
                Back to Forms
              </button>
            </div>
          </div>
        </div>
        
        <div className="form-builder-layout">
          <Droppable droppableId="availableFields">
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

          <Droppable droppableId="formLayout">
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
                              </div>
                            </div>
                            <div className="field-actions">
                              <button 
                                className="action-button"
                                onClick={() => toggleFieldWidth(index)}
                                title={item.fullWidth ? "Make single column" : "Make full width"}
                              >
                                {item.fullWidth ? "↔" : "↔"}
                              </button>
                              <button 
                                className="action-button delete"
                                onClick={() => removeFieldFromForm(field.id)}
                              >
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
          <div className="form-preview-section">
            <h3>Form Preview</h3>
            <FormRenderer 
              form={form} 
              metadataFields={metadataFields} 
              isPreview={true}
            />
          </div>
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
                      <div className="context-menu-actions">
 
                      </div>
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

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            {config.processes.map((process) => (
              <Route key={process.id} path={`/processes/${process.id}/metadata`} element={<ProcessMetadataPage processId={process.id} />} />
            ))}
            {config.processes.map((process) => (
              <Route key={process.id} path={`/processes/${process.id}/workflow`} element={<ProcessWorkflowPage processId={process.id} />} />
            ))}
            <Route path="/processes/:processId/forms" element={<ProcessFormsListPage />} />
            <Route path="/processes/:processId/forms/:formId" element={<FormBuilderPage />} />
            <Route path="*" element={<ProcessMetadataPage processId="process1" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
