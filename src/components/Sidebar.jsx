import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Menu, ChevronRight, ChevronDown } from 'lucide-react';
import { config } from '../config.js';
import notionService from '../services/NotionService.js';
import './Sidebar.css';

function Sidebar() {
  const location = useLocation();
  const [expandedProcess, setExpandedProcess] = useState(null);
  const [processes, setProcesses] = useState(() => notionService.getProcesses());
  const [addingProcess, setAddingProcess] = useState(false);
  const [newProcessName, setNewProcessName] = useState('');

  const toggleProcess = (processId) => {
    setExpandedProcess(expandedProcess === processId ? null : processId);
  };

  const handleAddProcess = () => {
    if (!newProcessName.trim()) return;
    const newId = `process${Date.now()}`;
    const newProcess = {
      id: newId,
      name: newProcessName.trim(),
      description: '',
      version: '1.0.0',
      submenus: [
        { id: `metadata-${newId}`, name: 'Metadata', path: `/processes/${newId}/metadata`, description: 'Manage process configuration and metadata' },
        { id: `forms-${newId}`, name: 'Forms', path: `/processes/${newId}/forms`, description: 'Manage forms and data collection' },
        { id: `workflow-${newId}`, name: 'Workflow', path: `/processes/${newId}/workflow`, description: 'Design and manage process workflow' },
        { id: `datasets-${newId}`, name: 'Datasets', path: `/processes/${newId}/datasets`, description: 'Reusable lists of options for select/dropdown fields.' },
        { id: `rules-${newId}`, name: 'Rules', path: `/processes/${newId}/rules`, description: 'Define logic rules for metadata fields' }
      ],
      metadataFields: [],
      forms: [],
      workflow: { steps: [], settings: {} },
      rules: []
    };
    notionService.addProcess(newProcess);
    setProcesses(notionService.getProcesses());
    setNewProcessName('');
    setAddingProcess(false);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">{config.app.name}</h1>
        <button className="menu-button">
          <Menu size={20} />
        </button>
      </div>

      <div className="sidebar-content">
        <div className="nav-section">
          <nav className="nav-menu">
            <Link
              to="/"
              className={`nav-item${location.pathname === '/' ? ' active' : ''}`}
            >
              <span>Home</span>
            </Link>
          </nav>
        </div>
        <div className="nav-section">
          <div className="nav-header">
            <span>User Management</span>
          </div>
          <nav className="nav-menu">
            <Link
              to="/users"
              className={`nav-item${location.pathname.startsWith('/users') ? ' active' : ''}`}
            >
              <span>Users</span>
            </Link>
            <Link
              to="/user-groups"
              className={`nav-item${location.pathname.startsWith('/user-groups') ? ' active' : ''}`}
            >
              <span>User Groups</span>
            </Link>
          </nav>
        </div>
        <div className="nav-section">
          <div className="nav-header">
            <span>Processes</span>
          </div>
          <nav className="nav-menu">
            {processes.map((process) => {
              const isExpanded = expandedProcess === process.id;
              const isActive = location.pathname.startsWith(`/processes/${process.id}`);

              return (
                <div key={process.id} className="process-item">
                  <button
                    className={`nav-item process-header ${isActive ? 'active' : ''}`}
                    onClick={() => toggleProcess(process.id)}
                  >
                    <div className="process-icon">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    <span>{process.name}</span>
                  </button>

                  {isExpanded && (
                    <div className="process-submenu">
                      {/* Always show Datasets and Rules submenus, even if missing from submenus */}
                      {(() => {
                        // Ensure Datasets submenu is present
                        const submenus = process.submenus ? [...process.submenus] : [];
                        if (!submenus.some(sm => sm.name === 'Datasets')) {
                          submenus.push({
                            id: `datasets-${process.id}`,
                            name: 'Datasets',
                            path: `/processes/${process.id}/datasets`,
                            description: 'Reusable lists of options for select/dropdown fields.'
                          });
                        }
                        if (!submenus.some(sm => sm.name === 'Rules')) {
                          submenus.push({
                            id: `rules-${process.id}`,
                            name: 'Rules',
                            path: `/processes/${process.id}/rules`,
                            description: 'Define logic rules for metadata fields'
                          });
                        }
                        return submenus.map((submenu) => {
                          const isSubActive = location.pathname.startsWith(submenu.path);
                          return (
                            <Link
                              key={submenu.id}
                              to={submenu.path}
                              className={`nav-item submenu-item ${isSubActive ? 'active' : ''}`}
                            >
                              <span>{submenu.name}</span>
                            </Link>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="process-item">
              {addingProcess ? (
                <input
                  className="nav-item process-header seamless-input"
                  style={{ margin: '8px 0', width: '90%' }}
                  value={newProcessName}
                  onChange={e => setNewProcessName(e.target.value)}
                  onBlur={handleAddProcess}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddProcess();
                    if (e.key === 'Escape') { setAddingProcess(false); setNewProcessName(''); }
                  }}
                  autoFocus
                  placeholder="New process name..."
                />
              ) : (
                <button
                  className="nav-item process-header"
                  style={{ opacity: 0.7, fontStyle: 'italic' }}
                  onClick={() => setAddingProcess(true)}
                >
                  <Plus size={16} /> Add Process
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
