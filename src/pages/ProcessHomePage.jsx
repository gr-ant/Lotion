import { Link, useParams } from 'react-router-dom';
import notionService from '../services/NotionService.js';
import './HomePage.css';

function ProcessHomePage() {
  const { processId } = useParams();
  const process = notionService.getProcessById(processId);
  if (!process) {
    return <div className="page-content">Process not found</div>;
  }

  // Gather quick stats
  const metadataFields = process.metadataFields || [];
  const workflow = process.workflow || {};
  const forms = notionService.getForms(processId) || [];
  const datasets = notionService.getDatasets(processId) || [];
  const rules = notionService.getRules(processId) || [];
  const userGroups = notionService.getUserGroups() || [];

  const cards = [
    {
      name: 'Metadata Fields',
      path: `/processes/${processId}/metadata`,
      description: 'Define and manage metadata fields for this process.',
      count: metadataFields.length,
    },
    {
      name: 'Workflow',
      path: `/processes/${processId}/workflow`,
      description: 'Configure the workflow steps and assignments.',
      count: workflow?.steps ? workflow.steps.length : 0,
    },
    {
      name: 'Forms',
      path: `/processes/${processId}/forms`,
      description: 'Manage forms for this process.',
      count: forms.length,
    },
    {
      name: 'Datasets',
      path: `/processes/${processId}/datasets`,
      description: 'Reusable lists of options for select/dropdown fields.',
      count: datasets.length,
    },
    {
      name: 'Rules',
      path: `/processes/${processId}/rules`,
      description: 'Define rules for process automation and validation.',
      count: rules.length,
    },
    {
      name: 'User Groups',
      path: `/user-groups`,
      description: 'Manage user groups and assignments.',
      count: userGroups.length,
    },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{process.name} - Dashboard</h1>
        <p>{process.description || 'No description provided.'}</p>
      </div>
      <div className="content-card full-width">
        <div className="card-header">
          <h3>Configuration</h3>
        </div>
        <div className="process-cards">
          {cards.map(card => (
            <Link key={card.name} to={card.path} className="process-card">
              <h4>{card.name}</h4>
              <p>{card.description}</p>
              <div style={{ marginTop: 8, color: '#787774', fontSize: 13 }}>
                {card.count !== undefined && <span>{card.count} {card.name === 'Workflow' ? 'steps' : card.name.toLowerCase()}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProcessHomePage; 