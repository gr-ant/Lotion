import { useState, useRef } from 'react';
import notionService from '../services/NotionService.js';
import { Plus, Trash2, Edit, Users } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import InlineAddRow from '../components/InlineAddRow.jsx';
import './UserGroupsPage.css';

function UserGroupsPage2() {
  const [revision, setRevision] = useState(0);
  const forceUpdate = () => setRevision(r => r + 1);

  const userGroups = notionService.getUserGroups();
  const users = notionService.getUsers();

  const [editingGroup, setEditingGroup] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup = {
      id: `group${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDesc.trim(),
      color: '#007aff'
    };
    notionService.updateUserGroups([...userGroups, newGroup]);
    forceUpdate();
    setNewGroupName('');
    setNewGroupDesc('');
    setEditingGroup(null);
    setEditingProperty(null);
  };

  const handleDeleteGroup = (id) => {
    notionService.updateUserGroups(userGroups.filter(g => g.id !== id));
    notionService.updateUsers(users.map(u => u.userGroupId === id ? { ...u, userGroupId: '' } : u));
    forceUpdate();
  };

  const startEditing = (group, property) => {
    setEditingGroup(group);
    setEditingProperty(property);
    if (property === 'name') {
      setNewGroupName(group.name);
    } else if (property === 'description') {
      setNewGroupDesc(group.description);
    }
  };

  const stopEditing = () => {
    setEditingGroup(null);
    setEditingProperty(null);
    setNewGroupName('');
    setNewGroupDesc('');
  };

  const updateGroupProperty = (groupId, property, value) => {
    const newUserGroups = userGroups.map(g => g.id === groupId ? { ...g, [property]: value } : g);
    notionService.updateUserGroups(newUserGroups);
    forceUpdate();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (editingProperty === 'name') {
        updateGroupProperty(editingGroup.id, 'name', newGroupName);
      } else if (editingProperty === 'description') {
        updateGroupProperty(editingGroup.id, 'description', newGroupDesc);
      }
      stopEditing();
    } else if (e.key === 'Escape') {
      stopEditing();
    }
  };

  const handleAssignUser = (userId, groupId) => {
    notionService.addUserToGroup(userId, groupId);
    forceUpdate();
  };

  const handleRemoveUser = (userId, groupId) => {
    notionService.removeUserFromGroup(userId, groupId);
    forceUpdate();
  };

  const openUserModal = (group) => {
    setSelectedGroup(group);
    setShowUserModal(true);
  };

  const getUsersInGroup = (groupId) => {
    const group = userGroups.find(g => g.id === groupId);
    if (!group || !group.userIds) return [];
    return users.filter(u => group.userIds.includes(u.id));
  };

  const getUsersNotInGroup = (groupId) => {
    const group = userGroups.find(g => g.id === groupId);
    if (!group || !group.userIds) return users;
    return users.filter(u => !group.userIds.includes(u.id));
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>User Groups</h1>
        <p>Manage user groups and assign users to groups.</p>
      </div>

      {/* User Groups Section */}
      <div className="content-card full-width">
        <div className="card-header">
          <h3>User Groups</h3>
        </div>
        <div className="metadata-fields-grid user-groups-grid-container">
          <div className="metadata-grid-header">
            <div className="header-name">Group Name</div>
            <div className="header-desc">Description</div>
            <div className="header-actions">Actions</div>
          </div>
          {userGroups.map(group => (
            <div key={group.id} className="metadata-field-row">
              <div className="prop-cell prop-name">
                {editingGroup === group && editingProperty === 'name' ? (
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onBlur={() => {
                      updateGroupProperty(group.id, 'name', newGroupName);
                      stopEditing();
                    }}
                    onKeyDown={handleKeyDown}
                    className="seamless-input"
                    autoFocus
                  />
                ) : (
                  <span className="editable-prop" onClick={() => startEditing(group, 'name')}>{group.name}</span>
                )}
              </div>
              <div className="prop-cell prop-desc">
                {editingGroup === group && editingProperty === 'description' ? (
                  <input
                    type="text"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    onBlur={() => {
                      updateGroupProperty(group.id, 'description', newGroupDesc);
                      stopEditing();
                    }}
                    onKeyDown={handleKeyDown}
                    className="seamless-input"
                    autoFocus
                    placeholder="Enter description..."
                  />
                ) : (
                  <span className="editable-prop placeholder-text" onClick={() => startEditing(group, 'description')}>
                    {group.description || 'Click to add...'}
                  </span>
                )}
              </div>
              <div className="prop-cell prop-actions">
                <button 
                  className="action-button" 
                  onClick={() => openUserModal(group)}
                  title={`Manage users in ${group.name}`}
                >
                  <Users size={14} />
                  {group.userIds ? group.userIds.length : 0}
                </button>
                
                <button className="action-button delete" onClick={() => handleDeleteGroup(group.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          <InlineAddRow
            active={false}
            onActivate={() => {
              const newGroup = {
                id: `group${Date.now()}`,
                name: '',
                description: '',
                color: '#007aff'
              };
              notionService.updateUserGroups([...userGroups, newGroup]);
              setEditingGroup(newGroup);
              setEditingProperty('name');
              setNewGroupName('');
              setNewGroupDesc('');
            }}
            label="Add a group"
            className="metadata-field-row"
            cellClassName="prop-cell"
          />
        </div>
      </div>

      {/* User Management Modal */}
      {showUserModal && selectedGroup && (
        <Modal 
          title={`Manage Users - ${selectedGroup.name}`} 
          size="xlarge"
          onClose={() => {
            setShowUserModal(false);
            setSelectedGroup(null);
            setUserSearchTerm('');
          }}
        >
          <div className="modal-body-content">
            <div className="metadata-fields-grid user-management-modal-grid">
              <div className="metadata-grid-header">
                <div className="header-name">Name</div>
                <div className="header-type">Email</div>
                <div className="header-desc">Role</div>
                <div className="header-actions">Action</div>
              </div>
              {getUsersInGroup(selectedGroup.id).map(user => (
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
                    <div className="prop-cell prop-actions">
                        <button
                          className="action-button delete"
                          onClick={() => handleRemoveUser(user.id, selectedGroup.id)}
                          title="Remove from group"
                        >
                          <Trash2 size={14} />
                        </button>
                    </div>
                  </div>
              ))}
            </div>
            <div className="modal-footer" style={{ marginTop: '20px' }}>
              <div className="user-search-container">
                <input
                  type="text"
                  placeholder="Search for users..."
                  className="seamless-input"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
                {userSearchTerm.length > 0 && (
                  <div className="user-search-results" style={{ marginTop: '8px' }}>
                    {getUsersNotInGroup(selectedGroup.id)
                      .filter(user => 
                        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                      )
                      .map(user => (
                        <div 
                          key={user.id} 
                          className="metadata-field-row interactive" 
                          style={{ padding: '8px' }}
                          onClick={() => {
                            handleAssignUser(user.id, selectedGroup.id);
                            setUserSearchTerm('');
                          }}
                        >
                          <div className="prop-cell" style={{ flexGrow: 1 }}>{user.name} ({user.email})</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default UserGroupsPage2;

