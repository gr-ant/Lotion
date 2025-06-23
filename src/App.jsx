import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { config } from './config.js';
import Sidebar from './components/Sidebar.jsx';
import ProcessMetadataPage from './pages/ProcessMetadataPage.jsx';
import ProcessWorkflowPage from './pages/ProcessWorkflowPage.jsx';
import ProcessFormsListPage from './pages/ProcessFormsListPage.jsx';
import ProcessDynamicPage from './pages/ProcessDynamicPage.jsx';
import FormBuilderPage from './pages/FormBuilderPage.jsx';
import UserGroupsPage from './pages/UserGroupsPage2.jsx';
import UsersPage from './pages/UsersPage.jsx';
import './styles/Global.css';
import './styles/AppLayout.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/processes/:processId/:submenu" element={<ProcessDynamicPage />} />
            <Route path="/processes/:processId/forms/:formId" element={<FormBuilderPage />} />
            <Route path="/user-groups" element={<UserGroupsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="*" element={<ProcessMetadataPage processId="process1" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
