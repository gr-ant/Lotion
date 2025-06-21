class WorkflowModel {
  constructor({ forms = [], steps = [] } = {}) {
    this.forms = [...forms];
    this.steps = [...steps];
  }

  addForm(formId, order = this.forms.length + 1) {
    this.forms.push({ formId, order });
    this._sortForms();
  }

  removeForm(formId) {
    this.forms = this.forms.filter(f => f.formId !== formId);
    this._sortForms();
  }

  moveForm(formId, newIndex) {
    const index = this.forms.findIndex(f => f.formId === formId);
    if (index === -1 || newIndex < 0 || newIndex >= this.forms.length) return;
    const [form] = this.forms.splice(index, 1);
    this.forms.splice(newIndex, 0, form);
    this._sortForms();
  }

  getOrderedForms() {
    return [...this.forms].sort((a, b) => a.order - b.order);
  }

  _sortForms() {
    this.forms.sort((a, b) => a.order - b.order);
    this.forms.forEach((f, idx) => {
      f.order = idx + 1;
    });
  }
}

export default WorkflowModel;

