import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Menu, ChevronRight, ChevronDown } from 'lucide-react';
import { config } from '../config.js';

function Sidebar() {
  const location = useLocation();
  const [expandedProcess, setExpandedProcess] = useState(null);

  const toggleProcess = (processId) => {
    setExpandedProcess(expandedProcess === processId ? null : processId);
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
          <div className="nav-header">
            <span>Processes</span>
            <button className="add-button">
              <Plus size={16} />
            </button>
          </div>
          <nav className="nav-menu">
            {config.processes.map((process) => {
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
                      {process.submenus.map((submenu) => {
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
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
