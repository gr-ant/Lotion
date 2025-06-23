import { useState, useRef, useEffect } from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import notionService from '../services/NotionService.js';
import TypeSelector from '../components/TypeSelector.jsx';
import BooleanSelector from '../components/BooleanSelector.jsx';
import InlineAddRow from '../components/InlineAddRow.jsx';
import './ProcessMetadataPage.css';

function ProcessMetadataPage({ processId }) {
  // Using a revision state for re-renders, consider refactoring state management
  // if notionService is designed to update global/cached data.
  const [revision, setRevision] = useState(0);
  const forceUpdate = () => setRevision(r => r + 1);

  // Directly get process and enterprise fields.
  // If notionService updates are not reflected automatically,
  // you might need local state for 'process' and 'metadataFields'.
  const process = notionService.getProcessById(processId);
  const enterpriseFields = notionService.getEnterpriseFields();
  const metadataFields = process?.metadataFields || [];
  const datasets = notionService.getDatasets(processId);

  const typeSelectorRefs = useRef({});
  const requiredSelectorRefs = useRef({});
  const inputRefs = useRef({});

  const [editingField, setEditingField] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [activeTypeSelector, setActiveTypeSelector] = useState(null);
  const [activeRequiredSelector, setActiveRequiredSelector] = useState(null);
  const [activeDatasetDropdown, setActiveDatasetDropdown] = useState(null);

  useEffect(() => {
    // Focus the input when a field name or new field is put into editing mode
    if (editingField && editingProperty === 'name' && inputRefs.current[editingField]) {
      inputRefs.current[editingField].focus();
    }
  }, [editingField, editingProperty, revision]); // revision included to ensure focus on re-render if forceUpdate is used

  if (!process) return <div className="page-content">Process not found</div>;

  const addMetadataField = () => {
    const newField = {
      id: `field${Date.now()}`, // Unique ID for the new field
      name: '',
      type: 'text',
      required: false,
      description: '',
      placeholder: '',
      options: [] // For select/radio type fields
    };
    // Update the process metadata through the service
    notionService.updateProcessMetadata(processId, [...metadataFields, newField]);
    forceUpdate(); // Trigger a re-render to show the new field
    setEditingField(newField.id); // Set the new field to be in editing mode
    setEditingProperty('name'); // Focus on its name property
  };

  const updateFieldProperty = (fieldId, property, value) => {
    const newFields = metadataFields.map(f => f.id === fieldId ? { ...f, [property]: value } : f);
    notionService.updateProcessMetadata(processId, newFields);
    forceUpdate(); // Trigger a re-render
  };

  const deleteMetadataField = (id) => {
    const newFields = metadataFields.filter(f => f.id !== id);
    notionService.updateProcessMetadata(processId, newFields);
    forceUpdate(); // Trigger a re-render
    // If the deleted field was being edited, clear the editing state
    if (editingField === id) {
      setEditingField(null);
      setEditingProperty(null);
    }
  };

  const startEditing = (fieldId, property) => {
    if (property === 'type') {
      setActiveTypeSelector(fieldId); // Activate type dropdown
    } else if (property === 'required') {
      setActiveRequiredSelector(fieldId); // Activate boolean dropdown
    } else {
      setEditingField(fieldId); // Set field for direct text editing
      setEditingProperty(property);
    }
  };

  const stopEditing = () => {
    setEditingField(null);
    setEditingProperty(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      stopEditing(); // Exit editing on Enter or Escape
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
          {(enterpriseFields.length > 0 || metadataFields.length > 0) && (
            <div className="metadata-grid-header">
              <div className="header-name">Field Name</div>
              <div className="header-type">Type</div>
              <div>Dataset</div>
              <div className="header-required">Required</div>
              <div className="header-placeholder">Placeholder</div>
              <div className="header-actions">Actions</div> {/* Added "Actions" header text */}
            </div>
          )}

          {/* Enterprise fields (locked) */}
          {enterpriseFields.map((field) => (
            <div key={field.id} className="metadata-field-row">
              <div className="prop-cell prop-name">
                <span className="editable-prop" style={{ color: '#9b9a97', cursor: 'not-allowed' }}>{field.name}</span>
              </div>
              <div className="prop-cell prop-type">
                <span className="editable-prop type-tag" style={{ color: '#9b9a97', cursor: 'not-allowed' }}>{field.type}</span>
              </div>
              <div className="prop-cell prop-required">
                <span className={`editable-prop required-tag ${field.required ? 'yes' : 'no'}`} style={{ color: '#9b9a97', cursor: 'not-allowed' }}>{field.required ? 'Yes' : 'No'}</span>
              </div>
              <div className="prop-cell prop-placeholder">
                <span className="editable-prop placeholder-text" style={{ color: '#9b9a97', cursor: 'not-allowed' }}>{field.placeholder || ''}</span>
              </div>
              <div className="prop-cell prop-actions"></div> {/* Empty for locked fields */}
            </div>
          ))}

          {/* Process fields (editable) */}
          {metadataFields.length === 0 && enterpriseFields.length === 0 ? (
            <div className="empty-fields-placeholder">
              <p>No metadata fields created yet. Click "Add Field" to get started.</p>
            </div>
          ) : (
            metadataFields.map((field) => (
              <div key={field.id} className="metadata-field-row">
                <div className="prop-cell prop-name">
                  {editingField === field.id && editingProperty === 'name' ? (
                    <input
                      ref={el => inputRefs.current[field.id] = el}
                      type="text"
                      value={field.name}
                      onChange={(e) => {
                        updateFieldProperty(field.id, 'name', e.target.value);
                      }}
                      onBlur={stopEditing}
                      onKeyDown={handleKeyDown}
                      className="seamless-input"
                    />
                  ) : (
                    <span className="editable-prop" onClick={() => startEditing(field.id, 'name')}>{field.name}</span>
                  )}
                </div>

                <div className="prop-cell prop-type" ref={el => (typeSelectorRefs.current[field.id] = el)}>
                  <span className="editable-prop type-tag" onClick={() => startEditing(field.id, 'type')}>{field.type}</span>
                </div>

                {/* For select/dropdown fields, allow picking a dataset as options source */}
                {(field.type === 'select' || field.type === 'dropdown') && (
                  <div className="prop-cell prop-dataset" style={{ position: 'relative' }}>
                    <div
                      className="notion-dropdown-trigger"
                      style={{
                        border: '1px solid #e3e2e0',
                        borderRadius: 4,
                        padding: '4px 8px',
                        minWidth: 120,
                        background: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: field.datasetId ? '#37352f' : '#9b9a97',
                        fontSize: 14
                      }}
                      onClick={() => setActiveDatasetDropdown(field.id)}
                      tabIndex={0}
                    >
                      <span>
                        {field.datasetId
                          ? datasets.find(ds => ds.id === field.datasetId)?.name || 'Unknown dataset'
                          : 'No dataset'}
                      </span>
                    </div>
                    {activeDatasetDropdown === field.id && (
                      <div
                        className="notion-dropdown-menu"
                        style={{
                          position: 'absolute',
                          top: '110%',
                          left: 0,
                          zIndex: 20,
                          background: '#fff',
                          border: '1px solid #e3e2e0',
                          borderRadius: 4,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                          minWidth: 180,
                          padding: '4px 0'
                        }}
                        onBlur={() => setActiveDatasetDropdown(null)}
                        tabIndex={-1}
                      >
                        {datasets.map(ds => (
                          <div
                            key={ds.id}
                            className="notion-dropdown-option"
                            style={{
                              padding: '8px 16px',
                              cursor: 'pointer',
                              color: field.datasetId === ds.id ? '#37352f' : '#37352f99',
                              background: field.datasetId === ds.id ? '#f7f6f3' : 'transparent'
                            }}
                            onMouseDown={() => {
                              updateFieldProperty(field.id, 'datasetId', ds.id);
                              setActiveDatasetDropdown(null);
                            }}
                          >
                            {ds.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(field.type !== 'select' && field.type !== 'dropdown') && (
                  <div className="prop-cell prop-dataset">
                    <span className="editable-prop placeholder-text">N/A</span>
                  </div>
                )}

                <div className="prop-cell prop-required" ref={el => (requiredSelectorRefs.current[field.id] = el)}>
                  <span
                    className={`editable-prop required-tag ${field.required ? 'yes' : 'no'}`}
                    onClick={() => startEditing(field.id, 'required')}
                  >
                    {field.required ? 'Yes' : 'No'}
                  </span>
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
          {/* Inline Add Row for new fields */}
          <InlineAddRow
            active={editingField === 'add'} // Check if the "add" row is active for editing
            onActivate={() => {
              // Set editingField to a temporary 'add' state to show the input
              setEditingField('add');
              setEditingProperty('name');
              // This is a placeholder; the actual new field creation should happen
              // when the user confirms the input, e.g., by pressing Enter.
              // For now, addMetadataField is called when 'Add a field' is clicked,
              // which then sets editingField to the new field's actual ID.
            }}
            label="Add a field"
            className="metadata-field-row"
            cellClassName="prop-cell"
          >
            {/* These cells are displayed when the InlineAddRow is active for editing */}
            <div className="prop-cell prop-name">
              <input
                ref={el => inputRefs.current['add'] = el} // Ref for the add input
                type="text"
                placeholder="Field name"
                value={editingField === 'add' ? '' : metadataFields.find(f => f.id === editingField)?.name || ''}
                onChange={(e) => {
                  if (editingField === 'add') {
                    // For the 'add' row, create the field immediately on first type
                    // and then update its name.
                    const newFieldId = `field${Date.now()}`; // Generate ID early
                    const newField = {
                      id: newFieldId,
                      name: e.target.value,
                      type: 'text',
                      required: false,
                      description: '',
                      placeholder: '',
                      options: []
                    };
                    notionService.updateProcessMetadata(processId, [...metadataFields, newField]);
                    setEditingField(newFieldId); // Switch to editing the newly created field
                    setEditingProperty('name');
                    forceUpdate();
                  } else {
                    // For existing fields, simply update
                    updateFieldProperty(editingField, 'name', e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    stopEditing(); // Confirm editing on Enter
                  }
                  if (e.key === 'Escape') {
                    // If adding a new field and escape is pressed, delete it
                    if (editingField && editingField.startsWith('field')) {
                      deleteMetadataField(editingField); // Delete the newly added field
                    }
                    stopEditing();
                    setEditingField(null); // Ensure add mode is fully exited
                  }
                }}
                onBlur={() => {
                  // If the user blurs and the field is still in 'add' state or empty, clean up
                  if (editingField === 'add' || (editingField && !metadataFields.find(f => f.id === editingField)?.name)) {
                      if (editingField && editingField.startsWith('field')) {
                          deleteMetadataField(editingField); // Delete if it was a newly created, unnamed field
                      }
                  }
                  stopEditing();
                  setEditingField(null); // Ensure add mode is fully exited
                }}
                className="seamless-input"
              />
            </div>
            <div className="prop-cell prop-type">
              <span className="editable-prop type-tag">text</span>
            </div>
            <div className="prop-cell prop-required">
              <span className="editable-prop required-tag no">No</span>
            </div>
            <div className="prop-cell prop-desc">
              <span className="editable-prop placeholder-text">Click to add...</span>
            </div>
            <div className="prop-cell prop-placeholder">
              <span className="editable-prop placeholder-text">Click to add...</span>
            </div>
            <div className="prop-cell prop-actions">
              {/* This button should likely cancel the add operation, not delete */}
              <button className="action-button delete" onClick={() => {
                if (editingField && editingField.startsWith('field')) {
                    deleteMetadataField(editingField); // Delete the newly added field if cancelling
                }
                stopEditing();
                setEditingField(null); // Ensure add mode is fully exited
              }}>
                <Trash2 size={14} /> {/* Consider changing icon/text to a 'cancel' or 'X' */}
              </button>
            </div>
          </InlineAddRow>
        </div>
      </div>
      {/* Type Selector Popover */}
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
      {/* Boolean Selector Popover (for Required) */}
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