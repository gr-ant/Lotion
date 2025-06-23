import { useState } from 'react';
import notionService from '../services/NotionService.js';
import { Trash2 } from 'lucide-react';
import './UserGroupsPage.css';

function UsersPage() {
  const [revision, setRevision] = useState(0);
  const forceUpdate = () => setRevision(r => r + 1);

  const users = notionService.getUsers();
  const userGroups = notionService.getUserGroups();

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Users</h1>
        <p>Manage all users in the system.</p>
      </div>
      <div className="content-card full-width">
        <div className="card-header">
          <h3>Users</h3>
        </div>
        <div className="metadata-fields-grid user-groups-grid-container">
          <div className="metadata-grid-header">
            <div className="header-name">Name</div>
            <div className="header-type">Email</div>
            <div className="header-desc">Role</div>
          </div>
          {users.map(user => (
            <div key={user.id} className="metadata-field-row">
              <div className="prop-cell prop-name">
                <span className="editable-prop">{user.name}</span>
              </div>
              <div className="prop-cell prop-type">
                <span className="editable-prop placeholder-text">{user.email}</span>
              </div>
              <div className="prop-cell prop-desc">
                <span className="editable-prop placeholder-text">{user.role}</span>
              </div>
            </div>
          ))}
          {/* TODO: Add inline add row for new users */}
        </div>
      </div>
    </div>
  );
}

export default UsersPage; 