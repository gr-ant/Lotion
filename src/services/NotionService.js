import { config as initialConfig } from '../config.js';

const deepCopy = (obj) => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error("Could not deep copy object", obj, error);
    return obj;
  }
};

class NotionService {
  constructor() {
    console.log('NotionService: constructor called');
    this.config = this.loadConfig();
    this.processesCache = null;
    this.formsCache = new Map();
    this.isDirty = false;
    this.saveTimeout = null;
  }

  // IMPROVED: Debounced saving to reduce localStorage calls
  scheduleSave() {
    this.isDirty = true;
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveConfig();
    }, 100); // Debounce saves by 100ms
  }

  loadConfig() {
    console.log('NotionService: loadConfig called');
    const savedConfig = localStorage.getItem('lotionConfig');
    if (savedConfig) {
      console.log('NotionService: Found config in localStorage');
      try {
        return JSON.parse(savedConfig);
      } catch (error) {
        console.error('Failed to parse config from localStorage:', error);
        // Fall through to initialize from initialConfig
      }
    }
    console.log('NotionService: No config in localStorage, initializing from initialConfig');
    const initial = deepCopy(initialConfig);
    localStorage.setItem('lotionConfig', JSON.stringify(initial));
    return initial;
  }

  saveConfig() {
    if (!this.isDirty) return;
    
    console.log('NotionService: saveConfig called');
    try {
      localStorage.setItem('lotionConfig', JSON.stringify(this.config));
      this.isDirty = false;
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
      throw error;
    }
  }

  // IMPROVED: Centralized process finding with error handling
  _findProcessById(processId, processes = null) {
    if (!processId) {
      throw new Error('Process ID is required');
    }
    
    const allProcesses = processes || this.getProcesses();
    const process = allProcesses.find(p => p.id === processId);
    
    if (!process) {
      console.warn(`Process with ID ${processId} not found`);
      return null;
    }
    
    return process;
  }

  // IMPROVED: Generic CRUD operations for nested collections
  _updateNestedCollection(processId, collectionName, operation) {
    try {
      const processes = this.getProcesses();
      const process = this._findProcessById(processId, processes);
      
      if (!process) {
        throw new Error(`Process with ID ${processId} not found`);
      }
      
      if (!process[collectionName]) {
        process[collectionName] = [];
      }
      
      operation(process[collectionName]);
      this.updateProcesses(processes);
      
    } catch (error) {
      console.error(`Error updating ${collectionName} for process ${processId}:`, error);
      throw error;
    }
  }

  _findInNestedCollection(processId, collectionName, itemId) {
    const processes = this.getProcesses();
    const process = this._findProcessById(processId, processes);
    
    if (!process || !process[collectionName]) {
      return { process, collection: [], item: null, index: -1 };
    }
    
    const collection = process[collectionName];
    const index = collection.findIndex(item => item.id === itemId);
    const item = index !== -1 ? collection[index] : null;
    
    return { process, collection, item, index };
  }

  // PUBLIC API METHODS (unchanged signatures)
  
  getProcessById(processId) {
    try {
      return this._findProcessById(processId);
    } catch (error) {
      console.error('Error in getProcessById:', error);
      return null;
    }
  }

  getEnterpriseFields() {
    console.log('NotionService: getEnterpriseFields called');
    // Always link enterprise_status field to the permanent dataset
    return (this.config.enterprise?.metadataFields || []).map(f =>
      f.id === 'enterprise_status'
        ? { ...f, datasetId: 'enterprise_status' }
        : f
    );
  }

  updateProcessMetadata(processId, newMetadataFields) {
    console.log(`NotionService: updateProcessMetadata called for processId: ${processId}`, newMetadataFields);
    try {
      const processes = this.getProcesses();
      const process = this._findProcessById(processId, processes);
      if (process) {
        process.metadataFields = newMetadataFields;
        this.updateProcesses(processes);
      }
    } catch (error) {
      console.error('Error updating process metadata:', error);
    }
  }

  updateProcessWorkflow(processId, newWorkflowJSON) {
    console.log(`NotionService: updateProcessWorkflow called for processId: ${processId}`, newWorkflowJSON);
    try {
      const processes = this.getProcesses();
      const process = this._findProcessById(processId, processes);
      if (process) {
        process.workflow = newWorkflowJSON;
        this.updateProcesses(processes);
      }
    } catch (error) {
      console.error('Error updating process workflow:', error);
    }
  }
  
  updateProcessForms(processId, newForms) {
    console.log(`NotionService: updateProcessForms called for processId: ${processId}`, newForms);
    try {
      const processes = this.getProcesses();
      const process = this._findProcessById(processId, processes);
      if (process) {
        process.forms = newForms;
        this.updateProcesses(processes);
      }
    } catch (error) {
      console.error('Error updating process forms:', error);
    }
  }
  
  getUserGroups() {
    console.log('NotionService: getUserGroups called');
    return this.config.enterprise?.userGroups || [];
  }

  getUsers() {
    console.log('NotionService: getUsers called');
    return this.config.enterprise?.users || [];
  }

  updateUserGroups(newUserGroups) {
    console.log('NotionService: updateUserGroups called', newUserGroups);
    if (!this.config.enterprise) {
      this.config.enterprise = {};
    }
    this.config.enterprise.userGroups = newUserGroups;
    this.scheduleSave();
  }

  updateUsers(newUsers) {
    console.log('NotionService: updateUsers called', newUsers);
    if (!this.config.enterprise) {
      this.config.enterprise = {};
    }
    this.config.enterprise.users = newUsers;
    this.scheduleSave();
  }

  updateEnterpriseMetadataFields(newMetadataFields) {
    console.log('NotionService: updateEnterpriseMetadataFields called', newMetadataFields);
    if (!this.config.enterprise) {
      this.config.enterprise = {};
    }
    this.config.enterprise.metadataFields = newMetadataFields;
    this.scheduleSave();
  }

  addUserToGroup(userId, groupId) {
    try {
      const groups = this.getUserGroups();
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.userIds) group.userIds = [];
        if (!group.userIds.includes(userId)) {
          group.userIds.push(userId);
          this.updateUserGroups(groups);
        }
      }
    } catch (error) {
      console.error('Error adding user to group:', error);
    }
  }

  removeUserFromGroup(userId, groupId) {
    try {
      const groups = this.getUserGroups();
      const group = groups.find(g => g.id === groupId);
      if (group && group.userIds) {
        group.userIds = group.userIds.filter(id => id !== userId);
        this.updateUserGroups(groups);
      }
    } catch (error) {
      console.error('Error removing user from group:', error);
    }
  }

  getGroupsForUser(userId) {
    try {
      return this.getUserGroups().filter(g => g.userIds && g.userIds.includes(userId));
    } catch (error) {
      console.error('Error getting groups for user:', error);
      return [];
    }
  }
  
  getConfig() {
    console.log('NotionService: getConfig called');
    return this.config;
  }

  // IMPROVED: Cached forms with better error handling
  getForms(processId) {
    const key = `forms_${processId}`;
    
    // Check cache first
    if (this.formsCache.has(key)) {
      return this.formsCache.get(key);
    }
    
    // Try localStorage
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const forms = JSON.parse(saved);
        this.formsCache.set(key, forms);
        return forms;
      } catch (e) {
        console.error('Failed to parse forms from localStorage', e);
      }
    }
    
    // Fallback to config
    const process = this.getProcessById(processId);
    const forms = process?.forms || [];
    this.formsCache.set(key, forms);
    return forms;
  }

  updateForms(processId, forms) {
    const key = `forms_${processId}`;
    try {
      localStorage.setItem(key, JSON.stringify(forms));
      this.formsCache.set(key, forms);
    } catch (error) {
      console.error('Failed to update forms:', error);
      throw error;
    }
  }

  // IMPROVED: Cached processes
  getProcesses() {
    if (this.processesCache) {
      return this.processesCache;
    }
    
    const key = 'processes';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        this.processesCache = JSON.parse(saved);
        return this.processesCache;
      } catch (e) {
        console.error('Failed to parse processes from localStorage', e);
      }
    }
    
    // Fallback to config
    this.processesCache = this.config.processes || [];
    return this.processesCache;
  }

  addProcess(process) {
    try {
      const processes = this.getProcesses();
      processes.push(process);
      this.updateProcesses(processes);
    } catch (error) {
      console.error('Error adding process:', error);
      throw error;
    }
  }

  deleteProcess(processId) {
    try {
      const processes = this.getProcesses();
      const filteredProcesses = processes.filter(p => p.id !== processId);
      this.updateProcesses(filteredProcesses);
    } catch (error) {
      console.error('Error deleting process:', error);
      throw error;
    }
  }

  // IMPROVED: Invalidate cache when updating
  updateProcesses(processes) {
    try {
      localStorage.setItem('processes', JSON.stringify(processes));
      this.processesCache = processes;
      this.config.processes = processes;
      this.scheduleSave();
    } catch (error) {
      console.error('Error updating processes:', error);
      throw error;
    }
  }

  // IMPROVED: Consolidated CRUD operations using generic methods
  
  // DATASETS CRUD
  getDatasets(processId) {
    const process = this.getProcessById(processId);
    let datasets = process?.datasets || [];
    
    // Check for permanent enterprise_status dataset
    const hasEnterpriseStatus = datasets.some(ds => ds.id === 'enterprise_status');
    
    if (!hasEnterpriseStatus) {
      // Inject permanent dataset
      const permanentDataset = {
        id: 'enterprise_status',
        name: 'Enterprise Status',
        items: [
          { id: 'status_active', value: 'active', label: 'Active' },
          { id: 'status_pending', value: 'pending', label: 'Pending' },
          { id: 'status_complete', value: 'complete', label: 'Complete' },
          { id: 'status_cancelled', value: 'cancelled', label: 'Cancelled' }
        ],
        permanent: true
      };
      datasets = [permanentDataset, ...datasets];
      // Persist it to the process
      if (process) {
        process.datasets = datasets;
        this.saveToStorage();
      }
    }
    
    return datasets;
  }

  addDataset(processId, dataset) {
    this._updateNestedCollection(processId, 'datasets', (datasets) => {
      datasets.push(dataset);
    });
  }

  updateDataset(processId, datasetId, newDataset) {
    this._updateNestedCollection(processId, 'datasets', (datasets) => {
      const idx = datasets.findIndex(d => d.id === datasetId);
      if (idx !== -1) {
        datasets[idx] = newDataset;
      }
    });
  }

  deleteDataset(processId, datasetId) {
    if (datasetId === 'enterprise_status') {
      // Block deletion of permanent dataset
      return;
    }
    this._updateNestedCollection(processId, 'datasets', (datasets) => {
      const idx = datasets.findIndex(d => d.id === datasetId);
      if (idx !== -1) {
        datasets.splice(idx, 1);
      }
    });
  }

  clearDatasets(processId) {
    this._updateNestedCollection(processId, 'datasets', (datasets) => {
      datasets.length = 0;
    });
  }

  addDatasetItem(processId, datasetId, item) {
    this._updateNestedCollection(processId, 'datasets', (datasets) => {
      const dataset = datasets.find(d => d.id === datasetId);
      if (dataset) {
        if (!dataset.items) dataset.items = [];
        dataset.items.push(item);
      }
    });
  }

  updateDatasetItem(processId, datasetId, itemId, newItem) {
    this._updateNestedCollection(processId, 'datasets', (datasets) => {
      const dataset = datasets.find(d => d.id === datasetId);
      if (dataset && dataset.items) {
        const idx = dataset.items.findIndex(i => i.id === itemId);
        if (idx !== -1) {
          dataset.items[idx] = newItem;
        }
      }
    });
  }

  deleteDatasetItem(processId, datasetId, itemId) {
    this._updateNestedCollection(processId, 'datasets', (datasets) => {
      const dataset = datasets.find(d => d.id === datasetId);
      if (dataset && dataset.items) {
        dataset.items = dataset.items.filter(i => i.id !== itemId);
      }
    });
  }

  // RULES CRUD
  getRules(processId) {
    const process = this.getProcessById(processId);
    return process?.rules || [];
  }

  addRule(processId, rule) {
    this._updateNestedCollection(processId, 'rules', (rules) => {
      rules.push(rule);
    });
  }

  updateRule(processId, ruleId, newRule) {
    this._updateNestedCollection(processId, 'rules', (rules) => {
      const idx = rules.findIndex(r => r.id === ruleId);
      if (idx !== -1) {
        rules[idx] = newRule;
      }
    });
  }

  deleteRule(processId, ruleId) {
    this._updateNestedCollection(processId, 'rules', (rules) => {
      const idx = rules.findIndex(r => r.id === ruleId);
      if (idx !== -1) {
        rules.splice(idx, 1);
      }
    });
  }

  clearRules(processId) {
    this._updateNestedCollection(processId, 'rules', (rules) => {
      rules.length = 0;
    });
  }

  // --- Process Instance Table Management ---

  _loadProcessInstances() {
    const saved = localStorage.getItem('lotionProcessInstances');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse lotionProcessInstances:', e);
        return [];
      }
    }
    return [];
  }

  _saveProcessInstances(instances) {
    localStorage.setItem('lotionProcessInstances', JSON.stringify(instances));
  }

  getProcessInstances(processId) {
    const all = this._loadProcessInstances();
    return all.filter(inst => inst.processId === processId);
  }

  addProcessInstance(processId, instanceData) {
    const all = this._loadProcessInstances();
    const newInstance = {
      id: 'instance_' + Math.random().toString(36).slice(2, 10),
      processId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: instanceData.status || 'Active',
      data: instanceData.data || {}
    };
    all.push(newInstance);
    this._saveProcessInstances(all);
    return newInstance;
  }

  updateProcessInstance(instanceId, updatedData) {
    const all = this._loadProcessInstances();
    const idx = all.findIndex(inst => inst.id === instanceId);
    if (idx !== -1) {
      all[idx] = {
        ...all[idx],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      this._saveProcessInstances(all);
      return all[idx];
    }
    return null;
  }

  deleteProcessInstance(instanceId) {
    let all = this._loadProcessInstances();
    all = all.filter(inst => inst.id !== instanceId);
    this._saveProcessInstances(all);
  }
}

const notionService = new NotionService();
export default notionService;