import { useState, useRef, useEffect } from 'react';
import { X, Users, User, ChevronDown } from 'lucide-react';
import notionService from '../services/NotionService.js';
import './MultiAssignSelector.css';

function MultiAssignSelector({ value = [], onChange, placeholder = "Select users or groups..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const userGroups = notionService.getUserGroups();
  const users = notionService.getUsers();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setSearchTerm('');
  };

  const handleAddAssignee = (type, id) => {
    const newAssignee = { type, id };
    const alreadySelected = value.some(item => item.type === type && item.id === id);
    
    if (!alreadySelected) {
      onChange([...value, newAssignee]);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleRemoveAssignee = (index) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const getDisplayName = (assignee) => {
    if (assignee.type === 'group') {
      const group = userGroups.find(g => g.id === assignee.id);
      return group ? group.name : 'Unknown Group';
    } else {
      const user = users.find(u => u.id === assignee.id);
      return user ? user.name : 'Unknown User';
    }
  };

  const getFilteredOptions = () => {
    const filteredGroups = userGroups.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return { groups: filteredGroups, users: filteredUsers };
  };

  const { groups, users: filteredUsers } = getFilteredOptions();

  return (
    <div className="multi-assign-selector" ref={dropdownRef}>
      <div className="selector-container" onClick={handleToggle}>
        <div className="selected-items">
          {value.length === 0 ? (
            <span className="placeholder">{placeholder}</span>
          ) : (
            <div className="selected-list">
              {value.map((assignee, index) => (
                <div key={`${assignee.type}-${assignee.id}`} className="selected-item">
                  {assignee.type === 'group' ? (
                    <Users size={14} className="item-icon" />
                  ) : (
                    <User size={14} className="item-icon" />
                  )}
                  <span className="item-name">{getDisplayName(assignee)}</span>
                  <button
                    className="remove-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAssignee(index);
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="search-section">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users or groups..."
              className="search-input"
            />
          </div>

          <div className="options-container">
            {groups.length > 0 && (
              <div className="option-section">
                <div className="section-header">
                  <Users size={14} />
                  Groups
                </div>
                {groups.map(group => {
                  const isSelected = value.some(item => item.type === 'group' && item.id === group.id);
                  return (
                    <div
                      key={group.id}
                      className={`option-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => !isSelected && handleAddAssignee('group', group.id)}
                    >
                      <div className="option-content">
                        <Users size={14} className="option-icon" />
                        <div className="option-details">
                          <span className="option-name">{group.name}</span>
                          <span className="option-description">{group.description}</span>
                        </div>
                      </div>
                      {isSelected && <span className="selected-indicator">✓</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {filteredUsers.length > 0 && (
              <div className="option-section">
                <div className="section-header">
                  <User size={14} />
                  Users
                </div>
                {filteredUsers.map(user => {
                  const isSelected = value.some(item => item.type === 'user' && item.id === user.id);
                  return (
                    <div
                      key={user.id}
                      className={`option-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => !isSelected && handleAddAssignee('user', user.id)}
                    >
                      <div className="option-content">
                        <User size={14} className="option-icon" />
                        <div className="option-details">
                          <span className="option-name">{user.name}</span>
                          <span className="option-description">{user.email}</span>
                        </div>
                      </div>
                      {isSelected && <span className="selected-indicator">✓</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {groups.length === 0 && filteredUsers.length === 0 && (
              <div className="no-results">
                No users or groups found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiAssignSelector;