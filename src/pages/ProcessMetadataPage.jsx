import { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { getProcessById } from '../config.js';
import TypeSelector from '../components/TypeSelector.jsx';
import BooleanSelector from '../components/BooleanSelector.jsx';

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
      id: `field${Date.now()}`,
      name: 'New Field',
      type: 'text',
      required: false,
      description: '',
      placeholder: '',
      options: []
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
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateFieldProperty(field.id, 'name', e.target.value)}
                      onBlur={stopEditing}
                      onKeyDown={handleKeyDown}
                      className="seamless-input"
                      autoFocus
                    />
                  ) : (
                    <span className="editable-prop" onClick={() => startEditing(field.id, 'name')}>{field.name}</span>
                  )}
                </div>

                <div className="prop-cell prop-type" ref={el => (typeSelectorRefs.current[field.id] = el)}>
                  <span className="editable-prop type-tag" onClick={() => startEditing(field.id, 'type')}>{field.type}</span>
                </div>

                <div className="prop-cell prop-required" ref={el => (requiredSelectorRefs.current[field.id] = el)}>
                  <span
                    className={`editable-prop required-tag ${field.required ? 'yes' : 'no'}`}
                    onClick={() => startEditing(field.id, 'required')}
                  >
                    {field.required ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="prop-cell prop-desc">
                  {editingField === field.id && editingProperty === 'description' ? (
                    <input
                      type="text"
                      value={field.description}
                      onChange={(e) => updateFieldProperty(field.id, 'description', e.target.value)}
                      onBlur={stopEditing}
                      onKeyDown={handleKeyDown}
                      className="seamless-input"
                      autoFocus
                      placeholder="Enter description..."
                    />
                  ) : (
                    <span className="editable-prop placeholder-text" onClick={() => startEditing(field.id, 'description')}>
                      {field.description || 'Click to add...'}
                    </span>
                  )}
                </div>

                <div className="prop-cell prop-placeholder">
                  {editingField === field.id && editingProperty === 'placeholder' ? (
                    <input
                      type="text"
                      value={field.placeholder}
                      onChange={(e) => updateFieldProperty(field.id, 'placeholder', e.target.value)}
                      onBlur={stopEditing}
                      onKeyDown={handleKeyDown}
                      className="seamless-input"
                      autoFocus
                      placeholder="Enter placeholder..."
                    />
                  ) : (
                    <span className="editable-prop placeholder-text" onClick={() => startEditing(field.id, 'placeholder')}>
                      {field.placeholder || 'Click to add...'}
                    </span>
                  )}
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

export default ProcessMetadataPage;
