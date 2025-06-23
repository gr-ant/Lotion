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
  }

  loadConfig() {
    console.log('NotionService: loadConfig called');
    const savedConfig = localStorage.getItem('lotionConfig');
    if (savedConfig) {
      console.log('NotionService: Found config in localStorage');
      return JSON.parse(savedConfig);
    }
    console.log('NotionService: No config in localStorage, initializing from initialConfig');
    const initial = deepCopy(initialConfig);
    localStorage.setItem('lotionConfig', JSON.stringify(initial));
    return initial;
  }

  saveConfig() {
    console.log('NotionService: saveConfig called');
    localStorage.setItem('lotionConfig', JSON.stringify(this.config));
  }

  getProcessById(processId) {
    const processes = this.getProcesses();
    return processes.find(p => p.id === processId) || null;
  }

  getEnterpriseFields() {
    console.log('NotionService: getEnterpriseFields called');
    return this.config.enterprise.metadataFields || [];
  }

  updateProcessMetadata(processId, newMetadataFields) {
    console.log(`NotionService: updateProcessMetadata called for processId: ${processId}`, newMetadataFields);
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    if (process) {
      process.metadataFields = newMetadataFields;
      this.updateProcesses(processes);
    }
  }

  updateProcessWorkflow(processId, newWorkflowJSON) {
    console.log(`NotionService: updateProcessWorkflow called for processId: ${processId}`, newWorkflowJSON);
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    if (process) {
      process.workflow = newWorkflowJSON;
      this.updateProcesses(processes);
    }
  }
  
  updateProcessForms(processId, newForms) {
    console.log(`NotionService: updateProcessForms called for processId: ${processId}`, newForms);
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    if(process) {
      process.forms = newForms;
      this.updateProcesses(processes);
    }
  }
  
  getUserGroups() {
    console.log('NotionService: getUserGroups called');
    return this.config.enterprise.userGroups || [];
  }

  getUsers() {
    console.log('NotionService: getUsers called');
    return this.config.enterprise.users || [];
  }

  updateUserGroups(newUserGroups) {
    console.log('NotionService: updateUserGroups called', newUserGroups);
    this.config.enterprise.userGroups = newUserGroups;
    this.saveConfig();
  }

  updateUsers(newUsers) {
    console.log('NotionService: updateUsers called', newUsers);
    this.config.enterprise.users = newUsers;
    this.saveConfig();
  }

  // Add user to group by userId and groupId
  addUserToGroup(userId, groupId) {
    const groups = this.getUserGroups();
    const group = groups.find(g => g.id === groupId);
    if (group) {
      if (!group.userIds) group.userIds = [];
      if (!group.userIds.includes(userId)) {
        group.userIds.push(userId);
        this.updateUserGroups(groups);
      }
    }
  }

  // Remove user from group by userId and groupId
  removeUserFromGroup(userId, groupId) {
    const groups = this.getUserGroups();
    const group = groups.find(g => g.id === groupId);
    if (group && group.userIds) {
      group.userIds = group.userIds.filter(id => id !== userId);
      this.updateUserGroups(groups);
    }
  }

  // Get all groups a user belongs to
  getGroupsForUser(userId) {
    return this.getUserGroups().filter(g => g.userIds && g.userIds.includes(userId));
  }
  
  getConfig() {
    console.log('NotionService: getConfig called');
    return this.config;
  }

  // Get forms for a process from localStorage, fallback to config
  getForms(processId) {
    const key = `forms_${processId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse forms from localStorage', e);
      }
    }
    // fallback to config
    const process = this.getProcessById(processId);
    return process?.forms || [];
  }

  // Update forms for a process in localStorage
  updateForms(processId, forms) {
    const key = `forms_${processId}`;
    localStorage.setItem(key, JSON.stringify(forms));
  }

  // Get all processes from localStorage, fallback to config
  getProcesses() {
    const key = 'processes';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse processes from localStorage', e);
      }
    }
    // fallback to config
    return this.config.processes || [];
  }

  // Add a new process and save to localStorage
  addProcess(process) {
    const processes = this.getProcesses();
    processes.push(process);
    localStorage.setItem('processes', JSON.stringify(processes));
    this.config.processes = processes;
    this.saveConfig();
  }

  // Update all processes in localStorage and in-memory config
  updateProcesses(processes) {
    localStorage.setItem('processes', JSON.stringify(processes));
    this.config.processes = processes;
    this.saveConfig();
  }

  // DATASETS CRUD
  getDatasets(processId) {
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    return process?.datasets || [];
  }

  getDatasetById(datasetId) {
    const processes = this.getProcesses();
    for (const process of processes) {
      if (process.datasets) {
        const ds = process.datasets.find(d => d.id === datasetId);
        if (ds) return ds;
      }
    }
    return null;
  }

  addDataset(processId, dataset) {
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    if (process) {
      if (!process.datasets) process.datasets = [];
      process.datasets.push(dataset);
      this.updateProcesses(processes);
    }
  }

  updateDataset(processId, datasetId, newDataset) {
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    if (process && process.datasets) {
      const idx = process.datasets.findIndex(d => d.id === datasetId);
      if (idx !== -1) {
        process.datasets[idx] = newDataset;
        this.updateProcesses(processes);
      }
    }
  }

  deleteDataset(processId, datasetId) {
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    if (process && process.datasets) {
      process.datasets = process.datasets.filter(d => d.id !== datasetId);
      this.updateProcesses(processes);
    }
  }

  addDatasetItem(processId, datasetId, item) {
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    if (process && process.datasets) {
      const dataset = process.datasets.find(d => d.id === datasetId);
      if (dataset) {
        if (!dataset.items) dataset.items = [];
        dataset.items.push(item);
        this.updateProcesses(processes);
      }
    }
  }

  updateDatasetItem(processId, datasetId, itemId, newItem) {
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    if (process && process.datasets) {
      const dataset = process.datasets.find(d => d.id === datasetId);
      if (dataset && dataset.items) {
        const idx = dataset.items.findIndex(i => i.id === itemId);
        if (idx !== -1) {
          dataset.items[idx] = newItem;
          this.updateProcesses(processes);
        }
      }
    }
  }

  deleteDatasetItem(processId, datasetId, itemId) {
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    if (process && process.datasets) {
      const dataset = process.datasets.find(d => d.id === datasetId);
      if (dataset && dataset.items) {
        dataset.items = dataset.items.filter(i => i.id !== itemId);
        this.updateProcesses(processes);
      }
    }
  }

  // RULES CRUD
  getRules(processId) {
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    return process?.rules || [];
  }

  addRule(processId, rule) {
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    if (process) {
      if (!process.rules) process.rules = [];
      process.rules.push(rule);
      this.updateProcesses(processes);
    }
  }

  updateRule(processId, ruleId, newRule) {
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    if (process && process.rules) {
      const idx = process.rules.findIndex(r => r.id === ruleId);
      if (idx !== -1) {
        process.rules[idx] = newRule;
        this.updateProcesses(processes);
      }
    }
  }

  deleteRule(processId, ruleId) {
    const processes = this.getProcesses();
    const process = processes.find(p => p.id === processId);
    if (process && process.rules) {
      process.rules = process.rules.filter(r => r.id !== ruleId);
      this.updateProcesses(processes);
    }
  }
}

const notionService = new NotionService();
export default notionService; 