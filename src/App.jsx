import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { config } from './config.js';
import Sidebar from './components/Sidebar.jsx';
import ProcessMetadataPage from './pages/ProcessMetadataPage.jsx';
import ProcessWorkflowPage from './pages/ProcessWorkflowPage.jsx';
import ProcessFormsListPage from './pages/ProcessFormsListPage.jsx';
import FormBuilderPage from './pages/FormBuilderPage.jsx';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            {config.processes.map((process) => (
              <Route
                key={process.id}
                path={`/processes/${process.id}/metadata`}
                element={<ProcessMetadataPage processId={process.id} />}
              />
            ))}
            {config.processes.map((process) => (
              <Route
                key={process.id}
                path={`/processes/${process.id}/workflow`}
                element={<ProcessWorkflowPage processId={process.id} />}
              />
            ))}
            <Route path="/processes/:processId/forms" element={<ProcessFormsListPage />} />
            <Route path="/processes/:processId/forms/:formId" element={<FormBuilderPage />} />
            <Route path="*" element={<ProcessMetadataPage processId="process1" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
