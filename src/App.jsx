import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import HomePage from './pages/HomePage.jsx';
import ProcessDynamicPage from './pages/ProcessDynamicPage.jsx';
import FormBuilderPage from './pages/FormBuilderPage.jsx';
import UserGroupsPage from './pages/UserGroupsPage2.jsx';
import UsersPage from './pages/UsersPage.jsx';
import ConfigurationPage from './pages/ConfigurationPage.jsx';
import WorkflowStepPage from './pages/WorkflowStepPage.jsx';
import './styles/Global.css';
import './styles/AppLayout.css';

function App() {
  const basename = import.meta.env.MODE === 'production' ? '/Lotion' : '';
  
  return (
    <Router basename={basename}>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/config" element={<ConfigurationPage />} />
            <Route path="/processes/:processId/:submenu" element={<ProcessDynamicPage />} />
            <Route path="/processes/:processId/forms/:formId" element={<FormBuilderPage />} />
            <Route path="/processes/:processId/workflow/:stepId" element={<WorkflowStepPage />} />
            <Route path="/user-groups" element={<UserGroupsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
