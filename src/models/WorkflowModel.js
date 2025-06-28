class WorkflowModel {
  constructor(workflowData = {}) {
    this.name = workflowData.name || 'Workflow';
    this.description = workflowData.description || '';
    this.steps = [...(workflowData.steps || [])];
    this.settings = {
      autoAssign: false,
      requireApproval: false,
      allowParallel: false,
      timeoutMinutes: 1440,
      ...workflowData.settings
    };
  }

  // Step management
  addStep(step) {
    const newStep = {
      id: `step${Date.now()}`,
      order: this.steps.length + 1,
      required: true,
      assignedTo: [], // Array of {type: 'user'|'group', id: string}
      assignedToUserGroup: null, // Keep for backward compatibility
      status: 'pending',
      mappings: {
        routing: [],
        data: []
      },
      ...step
    };
    this.steps.push(newStep);
    this._sortSteps();
    return newStep;
  }

  removeStep(stepId) {
    this.steps = this.steps.filter(s => s.id !== stepId);
    this._sortSteps();
  }

  moveStep(stepId, newIndex) {
    const index = this.steps.findIndex(s => s.id === stepId);
    if (index === -1 || newIndex < 0 || newIndex >= this.steps.length) return;
    const [step] = this.steps.splice(index, 1);
    this.steps.splice(newIndex, 0, step);
    this._sortSteps();
  }

  updateStep(stepId, updates) {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      Object.assign(step, updates);
    }
    return step;
  }

  assignStepToUserGroup(stepId, userGroupId) {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.assignedToUserGroup = userGroupId;
      step.status = 'assigned';
    }
    return step;
  }

  // Form management
  addFormToStep(stepId, formId) {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.formId = formId;
    }
    return step;
  }

  removeFormFromStep(stepId) {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      delete step.formId;
    }
    return step;
  }

  // Workflow execution
  getNextStep(currentStepId = null) {
    if (!currentStepId) {
      return this.steps.find(s => s.status === 'pending');
    }
    
    const currentStep = this.steps.find(s => s.id === currentStepId);
    if (!currentStep) return null;
    
    return this.steps.find(s => s.order === currentStep.order + 1);
  }

  getStepByForm(formId) {
    return this.steps.find(s => s.formId === formId);
  }

  getStepById(stepId) {
    return this.steps.find(s => s.id === stepId);
  }

  getOrderedSteps() {
    return [...this.steps].sort((a, b) => a.order - b.order);
  }

  getStepsByStatus(status) {
    return this.steps.filter(s => s.status === status);
  }

  // Settings management
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  // Validation
  validate() {
    const errors = [];
    
    if (!this.name) {
      errors.push('Workflow name is required');
    }
    
    if (this.steps.length === 0) {
      errors.push('At least one step is required');
    }
    
    const formSteps = this.steps.filter(s => s.formId);
    const formIds = formSteps.map(s => s.formId);
    
    if (formIds.length !== new Set(formIds).size) {
      errors.push('Duplicate form assignments found');
    }
    
    return errors;
  }

  // Helper methods
  _sortSteps() {
    this.steps.forEach((step, idx) => {
      step.order = idx + 1;
    });
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      steps: this.steps,
      settings: this.settings
    };
  }
}

export default WorkflowModel;

