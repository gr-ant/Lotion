import { useParams } from 'react-router-dom';
import notionService from '../services/NotionService.js';
import ProcessMetadataPage from './ProcessMetadataPage.jsx';
import ProcessFormsListPage from './ProcessFormsListPage.jsx';
import ProcessWorkflowPage from './ProcessWorkflowPage.jsx';
import ProcessDatasetsPage from './ProcessDatasetsPage.jsx';

function ProcessDynamicPage() {
  const { processId, submenu } = useParams();
  const process = notionService.getProcessById(processId);

  if (!process) {
    return <div className="page-content">Process not found</div>;
  }

  if (submenu === 'metadata') {
    return <ProcessMetadataPage processId={processId} />;
  }
  if (submenu === 'forms') {
    return <ProcessFormsListPage processId={processId} />;
  }
  if (submenu === 'workflow') {
    return <ProcessWorkflowPage processId={processId} />;
  }
  if (submenu === 'datasets') {
    return <ProcessDatasetsPage processId={processId} />;
  }

  return <div className="page-content">Page not found</div>;
}

export default ProcessDynamicPage; 