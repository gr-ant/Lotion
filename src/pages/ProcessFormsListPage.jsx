import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Trash2, ChevronRight } from 'lucide-react';
import notionService from '../services/NotionService.js';
import InlineAddRow from '../components/InlineAddRow.jsx';
import './ProcessFormsListPage.css';

function ProcessFormsListPage() {
  const { processId } = useParams();
  const navigate = useNavigate();
  const process = notionService.getProcessById(processId);

  const [forms, setForms] = useState(() => notionService.getForms(processId));

  const [hoveredFormId, setHoveredFormId] = useState(null);

  useEffect(() => {
    notionService.updateForms(processId, forms);
  }, [forms, processId]);

  const createNewForm = () => {
    const newFormId = `form${Date.now()}`;
    const newForm = { id: newFormId, name: 'New Form', description: 'A new empty form.', layout: [] };
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
                    <div className="delete-warning">Click to delete permanently</div>
                  )}
                  <ChevronRight size={20} className="form-list-arrow" />
                </div>
              </Link>
            ))
          )}
          <InlineAddRow
            active={false}
            onActivate={createNewForm}
            label={
              <div className="form-info">
                <h4>Create a new form</h4>
              </div>
            }
            className="form-list-item"
          />
        </div>
      </div>
    </div>
  );
}

export default ProcessFormsListPage;
