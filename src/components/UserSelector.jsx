import { useState, useRef, useEffect } from 'react';
import { Users, User, ChevronDown } from 'lucide-react';
import notionService from '../services/NotionService.js';
import './UserSelector.css';

function UserSelector({ value, onChange, placeholder = "Select user or group..." }) {
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

  const handleSelect = (type, id) => {
    onChange(`${type}:${id}`);
    setSearchTerm('');
    setIsOpen(false);
  };

  const getDisplayName = (value) => {
    if (!value) return null;
    
    const [type, id] = value.split(':');
    if (type === 'group') {
      const group = userGroups.find(g => g.id === id);
      return group ? { name: group.name, type: 'group' } : null;
    } else if (type === 'user') {
      const user = users.find(u => u.id === id);
      return user ? { name: user.name, type: 'user' } : null;
    }
    return null;
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
  const displayValue = getDisplayName(value);

  return (
    <div className="user-selector" ref={dropdownRef}>
      <div className="selector-container" onClick={handleToggle}>
        <div className="selected-item">
          {!displayValue ? (
            <span className="placeholder">{placeholder}</span>
          ) : (
            <div className="selected-content">
              {displayValue.type === 'group' ? (
                <Users size={14} className="item-icon" />
              ) : (
                <User size={14} className="item-icon" />
              )}
              <span className="item-name">{displayValue.name}</span>
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
            <div className="option-item clear-option" onClick={() => handleSelect('', '')}>
              <span className="option-name">No assignment</span>
            </div>

            {groups.length > 0 && (
              <div className="option-section">
                <div className="section-header">
                  <Users size={14} />
                  Groups
                </div>
                {groups.map(group => (
                  <div
                    key={group.id}
                    className="option-item"
                    onClick={() => handleSelect('group', group.id)}
                  >
                    <div className="option-content">
                      <Users size={14} className="option-icon" />
                      <div className="option-details">
                        <span className="option-name">{group.name}</span>
                        <span className="option-description">{group.description}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredUsers.length > 0 && (
              <div className="option-section">
                <div className="section-header">
                  <User size={14} />
                  Users
                </div>
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="option-item"
                    onClick={() => handleSelect('user', user.id)}
                  >
                    <div className="option-content">
                      <User size={14} className="option-icon" />
                      <div className="option-details">
                        <span className="option-name">{user.name}</span>
                        <span className="option-description">{user.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {groups.length === 0 && filteredUsers.length === 0 && searchTerm && (
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

export default UserSelector;