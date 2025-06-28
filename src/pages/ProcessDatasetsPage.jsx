import { useState } from 'react';
import { Trash2, ChevronRight } from 'lucide-react';
import notionService from '../services/NotionService.js';
import InlineAddRow from '../components/InlineAddRow.jsx';
import './ProcessFormsListPage.css';

function ProcessDatasetsPage({ processId }) {
  const process = notionService.getProcessById(processId);
  const [revision, setRevision] = useState(0);
  const forceUpdate = () => setRevision(r => r + 1);

  const [addingDataset, setAddingDataset] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [editingDatasetId, setEditingDatasetId] = useState(null);
  const [editingDatasetName, setEditingDatasetName] = useState('');
  const [expandedDatasetId, setExpandedDatasetId] = useState(null);
  const [addingItemId, setAddingItemId] = useState(null);
  const [newItemValue, setNewItemValue] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editingItemValue, setEditingItemValue] = useState('');
  const [editingItemLabel, setEditingItemLabel] = useState('');

  const datasets = notionService.getDatasets(processId);

  if (!process) {
    return <div className="page-content">Process not found</div>;
  }

  const handleAddDataset = () => {
    if (!newDatasetName.trim()) return;
    notionService.addDataset(processId, {
      id: `dataset${Date.now()}`,
      name: newDatasetName.trim(),
      items: []
    });
    setNewDatasetName('');
    setAddingDataset(false);
    forceUpdate();
  };

  const handleRenameDataset = (datasetId) => {
    if (!editingDatasetName.trim()) return;
    const dataset = datasets.find(d => d.id === datasetId);
    if (dataset) {
      notionService.updateDataset(processId, datasetId, {
        ...dataset,
        name: editingDatasetName.trim()
      });
      setEditingDatasetId(null);
      setEditingDatasetName('');
      forceUpdate();
    }
  };

  const handleDeleteDataset = (datasetId) => {
    notionService.deleteDataset(processId, datasetId);
    forceUpdate();
  };

  const handleAddItem = (datasetId) => {
    if (!newItemValue.trim()) return;
    notionService.addDatasetItem(processId, datasetId, {
      id: `item${Date.now()}`,
      value: newItemValue.trim(),
      label: newItemLabel.trim() || newItemValue.trim()
    });
    setNewItemValue('');
    setNewItemLabel('');
    setAddingItemId(null);
    forceUpdate();
  };

  const handleEditItem = (datasetId, itemId) => {
    if (!editingItemValue.trim()) return;
    const dataset = datasets.find(d => d.id === datasetId);
    if (dataset) {
      notionService.updateDatasetItem(processId, datasetId, itemId, {
        id: itemId,
        value: editingItemValue.trim(),
        label: editingItemLabel.trim() || editingItemValue.trim()
      });
      setEditingItem(null);
      setEditingItemValue('');
      setEditingItemLabel('');
      forceUpdate();
    }
  };

  const handleDeleteItem = (datasetId, itemId) => {
    notionService.deleteDatasetItem(processId, datasetId, itemId);
    forceUpdate();
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{process.name} - Datasets</h1>
        <p>Datasets are reusable lists of options for select/dropdown fields in forms.</p>
      </div>
      <div className="content-card full-width">
        <div className="metadata-fields-grid">
          <div className="metadata-grid-header">
            <div className="header-name">Dataset Name</div>
            <div className="header-actions">Actions</div>
          </div>
          {datasets.length === 0 ? (
            <div className="empty-fields-placeholder">
              <p>No datasets created yet. Click below to get started.</p>
            </div>
          ) : (
            datasets.map(dataset => [
              <div key={dataset.id} className="metadata-field-row">
                <div className="prop-cell prop-name">
                  {editingDatasetId === dataset.id ? (
                    <input
                      type="text"
                      value={editingDatasetName}
                      onChange={e => setEditingDatasetName(e.target.value)}
                      onBlur={() => handleRenameDataset(dataset.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameDataset(dataset.id);
                        if (e.key === 'Escape') setEditingDatasetId(null);
                      }}
                      autoFocus
                      className="seamless-input"
                      disabled={dataset.id === 'enterprise_status'}
                    />
                  ) : (
                    <span
                      className="editable-prop"
                      style={{ cursor: dataset.id === 'enterprise_status' ? 'not-allowed' : 'pointer', color: dataset.id === 'enterprise_status' ? '#9b9a97' : undefined }}
                      onClick={dataset.id === 'enterprise_status' ? undefined : () => {
                        setEditingDatasetId(dataset.id);
                        setEditingDatasetName(dataset.name);
                      }}
                    >
                      {dataset.name}
                      {dataset.id === 'enterprise_status' && <span style={{ fontSize: 12, marginLeft: 8, color: '#2e75cc' }}>(Permanent)</span>}
                    </span>
                  )}
                </div>
                <div className="prop-cell prop-actions">
                  {dataset.id !== 'enterprise_status' && (
                    <button
                      className="action-button delete"
                      onClick={() => handleDeleteDataset(dataset.id)}
                      title="Delete dataset"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button
                    className="action-button"
                    onClick={() => setExpandedDatasetId(expandedDatasetId === dataset.id ? null : dataset.id)}
                    title={expandedDatasetId === dataset.id ? 'Collapse' : 'Expand'}
                  >
                    {(dataset.items || []).length}
                    <ChevronRight size={18} style={{ transform: expandedDatasetId === dataset.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                </div>
              </div>,
              expandedDatasetId === dataset.id && (
                <div key={dataset.id + '-expanded'} className="metadata-field-row" style={{ background: '#faf9f6' }}>
                  <div className="prop-cell" colSpan={3} style={{ width: '100%', padding: 0 }}>
                    <div style={{ paddingLeft: '30px', width: '100%' }}>
                      {(dataset.items || []).map(item => (
                        <div key={item.id} className="metadata-field-row" style={{ background: 'transparent', display: 'grid', gridTemplateColumns: 'minmax(500px,3fr) 80px', alignItems: 'center', marginBottom: 0, width: '100%' }}>
                          <div className="prop-cell prop-name" style={{ width: '100%' }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{item.value}</span>
                          </div>
                          <div className="prop-cell prop-actions">
                            <button
                              className="action-button delete"
                              onClick={() => handleDeleteItem(dataset.id, item.id)}
                              title="Delete item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {/* Inline add row for items */}
                      {addingItemId === dataset.id ? (
                        <div className="metadata-field-row" style={{ background: 'transparent', display: 'grid', gridTemplateColumns: 'minmax(300px,3fr) 80px', alignItems: 'center', marginBottom: 0 }}>
                          <div className="prop-cell prop-name">
                            <input
                              type="text"
                              value={newItemValue}
                              onChange={e => setNewItemValue(e.target.value)}
                              placeholder="Value"
                              className="seamless-input"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter' && newItemValue.trim()) {
                                  handleAddItem(dataset.id);
                                }
                              }}
                              onBlur={() => {
                                if (newItemValue.trim()) {
                                  handleAddItem(dataset.id);
                                } else {
                                  setAddingItemId(null);
                                  setNewItemValue('');
                                }
                              }}
                            />
                          </div>
                          <div className="prop-cell prop-actions"></div>
                        </div>
                      ) : (
                        <div
                          className="editable-prop"
                          style={{ color: '#666', cursor: 'pointer', marginTop: 4 , width: 'fit-content' }}
                          onClick={() => setAddingItemId(dataset.id)}
                        >
                          Add an item
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            ])
          )}
          <InlineAddRow
            active={addingDataset}
            onActivate={() => setAddingDataset(true)}
            label={
              <span className="editable-prop" style={{ color: '#666' }}>Add a dataset</span>
            }
            className="metadata-field-row"
            cellClassName="prop-cell"
          >
            <div className="prop-cell prop-name">
              <input
                type="text"
                value={newDatasetName}
                onChange={e => setNewDatasetName(e.target.value)}
                placeholder="Dataset name"
                className="seamless-input"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && newDatasetName.trim()) {
                    handleAddDataset();
                  }
                }}
                onBlur={() => {
                  if (newDatasetName.trim()) {
                    handleAddDataset();
                  } else {
                    setAddingDataset(false);
                    setNewDatasetName('');
                  }
                }}
              />
            </div>
            <div className="prop-cell prop-type"></div>
            <div className="prop-cell prop-actions">
              <ChevronRight size={18} style={{ opacity: 0.5 }} />
            </div>
          </InlineAddRow>
        </div>
      </div>
    </div>
  );
}

export default ProcessDatasetsPage; 