import { useState } from 'react';
import notionService from '../services/NotionService.js';
import './ConfigurationPage.css';

function ConfigurationPage() {
  const [processId, setProcessId] = useState('');
  const [uploadType, setUploadType] = useState('enterprise');
  const [isUploading, setIsUploading] = useState(false);
  const processes = notionService.getProcesses();

  // Download handlers
  const handleDownloadEnterprise = () => {
    try {
      const config = notionService.getConfig();
      const enterpriseData = {
        metadataFields: config.enterprise?.metadataFields || [],
        userGroups: config.enterprise?.userGroups || [],
        users: config.enterprise?.users || []
      };
      
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(enterpriseData, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute('href', dataStr);
      dlAnchor.setAttribute('download', 'enterprise-config.json');
      dlAnchor.click();
    } catch (error) {
      console.error('Error downloading enterprise config:', error);
      alert('Error downloading enterprise configuration. Please try again.');
    }
  };

  const handleDownloadProcess = () => {
    if (!processId) return;
    
    try {
      const process = notionService.getProcessById(processId);
      if (!process) {
        alert('Process not found.');
        return;
      }
      
      // Include all process data including datasets and rules
      const processData = {
        ...process,
        datasets: notionService.getDatasets(processId),
        rules: notionService.getRules(processId),
        forms: notionService.getForms(processId)
      };
      
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(processData, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute('href', dataStr);
      dlAnchor.setAttribute('download', `process-${processId}-config.json`);
      dlAnchor.click();
    } catch (error) {
      console.error('Error downloading process config:', error);
      alert('Error downloading process configuration. Please try again.');
    }
  };

  // Upload handler
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        
        if (uploadType === 'enterprise') {
          handleEnterpriseUpload(json);
        } else if (uploadType === 'process') {
          handleProcessUpload(json);
        }
      } catch (err) {
        console.error('Error parsing JSON:', err);
        alert('Invalid JSON file. Please check the file format and try again.');
      } finally {
        setIsUploading(false);
        // Reset file input
        e.target.value = '';
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
      setIsUploading(false);
    };
    
    reader.readAsText(file);
  };

  const handleEnterpriseUpload = (enterpriseData) => {
    try {
      // Validate enterprise data structure
      if (typeof enterpriseData !== 'object' || enterpriseData === null) {
        throw new Error('Invalid enterprise configuration format');
      }

      // Update enterprise configuration through NotionService
      if (enterpriseData.metadataFields) {
        notionService.updateEnterpriseMetadataFields(enterpriseData.metadataFields);
      }

      if (enterpriseData.userGroups) {
        notionService.updateUserGroups(enterpriseData.userGroups);
      }

      if (enterpriseData.users) {
        notionService.updateUsers(enterpriseData.users);
      }

      alert('Enterprise configuration uploaded successfully!');
      
      // Reload to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error uploading enterprise config:', error);
      alert('Error uploading enterprise configuration: ' + error.message);
    }
  };

  const handleProcessUpload = (processData) => {
    try {
      // Validate process data structure
      if (!processData.id) {
        throw new Error('Process configuration must include an ID');
      }

      if (!processData.name) {
        throw new Error('Process configuration must include a name');
      }

      // Check if process already exists
      const existingProcess = notionService.getProcessById(processData.id);
      
      if (existingProcess) {
        // Update existing process
        const processes = notionService.getProcesses();
        const processIndex = processes.findIndex(p => p.id === processData.id);
        
        if (processIndex !== -1) {
          // Update the main process data
          processes[processIndex] = {
            id: processData.id,
            name: processData.name,
            workflow: processData.workflow,
            metadataFields: processData.metadataFields,
            forms: processData.forms
          };
          
          notionService.updateProcesses(processes);
          
          // Update associated data if present
          if (processData.datasets && Array.isArray(processData.datasets)) {
            // Clear existing datasets and add new ones
            notionService.clearDatasets(processData.id);
            processData.datasets.forEach(dataset => {
              notionService.addDataset(processData.id, dataset);
            });
          }
          
          if (processData.rules && Array.isArray(processData.rules)) {
            // Clear existing rules and add new ones
            notionService.clearRules(processData.id);
            processData.rules.forEach(rule => {
              notionService.addRule(processData.id, rule);
            });
          }
          
          if (processData.forms) {
            notionService.updateForms(processData.id, processData.forms);
          }
        }
        
        alert(`Process "${processData.name}" updated successfully!`);
      } else {
        // Add new process
        const newProcess = {
          id: processData.id,
          name: processData.name,
          workflow: processData.workflow || {},
          metadataFields: processData.metadataFields || [],
          forms: processData.forms || []
        };
        
        notionService.addProcess(newProcess);
        
        // Add associated data if present
        if (processData.datasets && Array.isArray(processData.datasets)) {
          processData.datasets.forEach(dataset => {
            notionService.addDataset(processData.id, dataset);
          });
        }
        
        if (processData.rules && Array.isArray(processData.rules)) {
          processData.rules.forEach(rule => {
            notionService.addRule(processData.id, rule);
          });
        }
        
        if (processData.forms) {
          notionService.updateForms(processData.id, processData.forms);
        }
        
        alert(`Process "${processData.name}" added successfully!`);
      }
      
      // Reload to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error uploading process config:', error);
      alert('Error uploading process configuration: ' + error.message);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Configuration Import/Export</h1>
        <p>Download or upload configuration for the entire enterprise or individual processes.</p>
      </div>
      
      <div className="content-card full-width" style={{ marginBottom: 32 }}>
        <h3>Enterprise Configuration</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
          Includes metadata fields, user groups, and users.
        </p>
        <button 
          onClick={handleDownloadEnterprise} 
          className="config-button"
          disabled={isUploading}
        >
          Download Enterprise Config
        </button>
        <div style={{ marginTop: 12 }}>
          <label className="config-upload-label">
            <input 
              type="file" 
              accept="application/json,.json" 
              style={{ display: 'none' }} 
              onChange={handleUpload} 
              onClick={() => setUploadType('enterprise')}
              disabled={isUploading}
            />
            <span className={`config-upload-btn ${isUploading ? 'disabled' : ''}`}>
              {isUploading && uploadType === 'enterprise' ? 'Uploading...' : 'Upload Enterprise Config'}
            </span>
          </label>
        </div>
      </div>
      
      <div className="content-card full-width">
        <h3>Process Configuration</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
          Includes process definition, workflow, forms, datasets, and rules.
        </p>
        <div style={{ marginBottom: 12 }}>
          <select 
            value={processId} 
            onChange={e => setProcessId(e.target.value)} 
            className="seamless-input" 
            style={{ minWidth: 200 }}
            disabled={isUploading}
          >
            <option value="">Select a process...</option>
            {processes.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={handleDownloadProcess} 
          className="config-button" 
          disabled={!processId || isUploading}
        >
          Download Process Config
        </button>
        <div style={{ marginTop: 12 }}>
          <label className="config-upload-label">
            <input 
              type="file" 
              accept="application/json,.json" 
              style={{ display: 'none' }} 
              onChange={handleUpload} 
              onClick={() => setUploadType('process')}
              disabled={isUploading}
            />
            <span className={`config-upload-btn ${isUploading ? 'disabled' : ''}`}>
              {isUploading && uploadType === 'process' ? 'Uploading...' : 'Upload Process Config'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default ConfigurationPage;