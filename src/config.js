export const config = {
  // App configuration
  app: {
    name: 'Lotion',
    version: '1.0.0',
    description: 'Process management and workflow automation platform'
  },
  // Enterprise-level user management
  enterprise: {
    userGroups: [
      {
        id: 'group1',
        name: 'HR Manager',
        description: 'Human Resources management team',
        color: '#28a745'
      },
      {
        id: 'group2',
        name: 'Accounting',
        description: 'Finance and accounting team',
        color: '#007bff'
      },
      {
        id: 'group3',
        name: 'Sales Manager',
        description: 'Sales and business development team',
        color: '#ffc107'
      },
      {
        id: 'group4',
        name: 'IT Support',
        description: 'Technical support and IT operations',
        color: '#6f42c1'
      },
      {
        id: 'group5',
        name: 'Operations',
        description: 'General operations and coordination',
        color: '#fd7e14'
      }
    ],
    users: [
      {
        id: 'user1',
        name: 'John Smith',
        email: 'john.smith@company.com',
        role: 'Manager',
        department: 'Sales',
        userGroupId: 'group3'
      },
      {
        id: 'user2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        role: 'Coordinator',
        department: 'Operations',
        userGroupId: 'group5'
      },
      {
        id: 'user3',
        name: 'Mike Davis',
        email: 'mike.davis@company.com',
        role: 'Specialist',
        department: 'Support',
        userGroupId: 'group4'
      },
      {
        id: 'user4',
        name: 'Lisa Wilson',
        email: 'lisa.wilson@company.com',
        role: 'Supervisor',
        department: 'Customer Service',
        userGroupId: 'group1'
      },
      {
        id: 'user5',
        name: 'David Chen',
        email: 'david.chen@company.com',
        role: 'Accountant',
        department: 'Finance',
        userGroupId: 'group2'
      },
      {
        id: 'user6',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@company.com',
        role: 'HR Specialist',
        department: 'Human Resources',
        userGroupId: 'group1'
      }
    ],
    metadataFields: [
      {
        id: 'enterprise_id',
        name: 'ID',
        type: 'number',
        required: true,
        description: 'Unique process instance ID',
        placeholder: 'Auto-generated',
        readOnly: true
      },
      {
        id: 'enterprise_title',
        name: 'Title',
        type: 'text',
        required: true,
        description: 'Title or name of the process instance',
        placeholder: 'Enter a descriptive title'
      },
      {
        id: 'enterprise_assigned_to',
        name: 'Assigned To',
        type: 'user',
        required: true,
        description: 'User responsible for this process',
        placeholder: 'Select assigned user'
      },
      {
        id: 'enterprise_create_date',
        name: 'Create Date',
        type: 'date',
        required: true,
        description: 'Date the process was created',
        placeholder: 'Auto-generated',
        readOnly: true
      },
      {
        id: 'enterprise_status',
        name: 'Status',
        type: 'select',
        required: true,
        description: 'Status of Flow',
        placeholder: '...',
        readOnly: true,
        datasetId: 'enterprise_status'
      },
      {
        id: 'enterprise_priority',
        name: 'Priority',
        type: 'select',
        required: false,
        description: 'Priority level of the process',
        placeholder: 'Select priority...',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' }
        ]
      },
    ]
  },
  processes: [],
  appSettings: {
    theme: 'light',
    sidebarCollapsed: false,
    notifications: true,
    autoSave: true
  }
};

// Helper functions to work with config
export const getProcessById = (id) => {
  return config.processes.find(process => process.id === id);
};

export const getProcessByPath = (path) => {
  return config.processes.find(process => 
    process.submenus.some(submenu => submenu.path === path)
  );
};

export const getSubmenuByPath = (path) => {
  for (const process of config.processes) {
    const submenu = process.submenus.find(submenu => submenu.path === path);
    if (submenu) {
      return { process, submenu };
    }
  }
  return null;
};

// Enterprise-level helper functions
export const getUserGroupById = (id) => {
  return config.enterprise.userGroups.find(group => group.id === id);
};

export const getUserById = (id) => {
  return config.enterprise.users.find(user => user.id === id);
};

export const getUsersByGroup = (groupId) => {
  return config.enterprise.users.filter(user => user.userGroupId === groupId);
}; 