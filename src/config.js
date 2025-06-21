export const config = {
  processes: [
    {
      id: 'process1',
      name: 'Customer Onboarding',
      description: 'Complete customer onboarding workflow including data collection, validation, and account setup',
      version: '1.0.0',
      settings: {
        autoStart: true,
        timeout: 30,
        priority: 'Medium',
        enabled: true
      },
      submenus: [
        {
          id: 'metadata1',
          name: 'Metadata',
          path: '/processes/process1/metadata',
          description: 'Manage process configuration and metadata'
        },
        {
          id: 'forms1',
          name: 'Forms',
          path: '/processes/process1/forms',
          description: 'Manage forms and data collection'
        },
        {
          id: 'workflow1',
          name: 'Workflow',
          path: '/processes/process1/workflow',
          description: 'Design and manage process workflow'
        }
      ],
      metadataFields: [
        {
          id: 'field1',
          name: 'Full Name',
          type: 'text',
          required: true,
          description: 'Customer full name',
          placeholder: 'Enter your full name',
          validation: {
            minLength: 2,
            maxLength: 100
          }
        },
        {
          id: 'field2',
          name: 'Email',
          type: 'email',
          required: true,
          description: 'Customer email address',
          placeholder: 'Enter your email',
          validation: {
            pattern: 'email'
          }
        },
        {
          id: 'field3',
          name: 'Phone Number',
          type: 'tel',
          required: false,
          description: 'Customer phone number',
          placeholder: 'Enter your phone number',
          validation: {
            pattern: 'phone'
          }
        },
        {
          id: 'field4',
          name: 'Department',
          type: 'select',
          required: false,
          description: 'Relevant department',
          options: [
            { value: '', label: 'Select department' },
            { value: 'engineering', label: 'Engineering' },
            { value: 'marketing', label: 'Marketing' },
            { value: 'sales', label: 'Sales' },
            { value: 'support', label: 'Support' }
          ]
        },
        {
          id: 'field5',
          name: 'Assigned User',
          type: 'user',
          required: false,
          description: 'User responsible for this step',
          placeholder: 'Select user'
        }
      ],
      forms: [
        {
          id: 'form1',
          name: 'Customer Intake Form',
          description: 'Initial data collection for new customers.',
          layout: [
            { metadataFieldId: 'field1' },
            { metadataFieldId: 'field2' },
            { metadataFieldId: 'field3' },
            { metadataFieldId: 'field4' },
          ]
        }
      ],
      workflow: {
        forms: [
          { formId: 'form1', order: 1 }
        ],
        steps: [
          {
            id: 'step1',
            name: 'Data Collection',
            description: 'Collect required information from user',
            order: 1,
            type: 'form',
            required: true,
            user: null
          },
          {
            id: 'step2',
            name: 'Validation',
            description: 'Validate collected data',
            order: 2,
            type: 'validation',
            required: true,
            user: null
          },
          {
            id: 'step3',
            name: 'Processing',
            description: 'Process the validated data',
            order: 3,
            type: 'processing',
            required: true,
            user: null
          },
          {
            id: 'step4',
            name: 'Completion',
            description: 'Complete the process',
            order: 4,
            type: 'completion',
            required: true,
            user: null
          }
        ]
      },
    },
    {
      id: 'process2',
      name: 'Order Processing',
      description: 'Handle order processing workflow from receipt to fulfillment',
      version: '1.2.0',
      settings: {
        autoStart: true,
        timeout: 45,
        priority: 'High',
        enabled: true
      },
      submenus: [
        {
          id: 'metadata2',
          name: 'Metadata',
          path: '/processes/process2/metadata',
          description: 'Manage process configuration and metadata'
        },
        {
          id: 'forms2',
          name: 'Forms',
          path: '/processes/process2/forms',
          description: 'Manage forms and data collection'
        },
        {
          id: 'workflow2',
          name: 'Workflow',
          path: '/processes/process2/workflow',
          description: 'Design and manage process workflow'
        }
      ],
      metadataFields: [
        {
          id: 'field1',
          type: 'text',
          name: 'Order Number',
          required: true,
          placeholder: 'Enter order number',
          validation: {
            pattern: 'alphanumeric'
          }
        },
        {
          id: 'field2',
          type: 'text',
          name: 'Customer Name',
          required: true,
          placeholder: 'Enter customer name',
          validation: {
            minLength: 2,
            maxLength: 100
          }
        },
        {
          id: 'field3',
          type: 'textarea',
          name: 'Order Details',
          required: true,
          placeholder: 'Enter order details',
          validation: {
            minLength: 10
          }
        },
        {
          id: 'field4',
          type: 'number',
          name: 'Quantity',
          required: true,
          placeholder: 'Enter quantity',
          validation: {
            min: 1,
            max: 1000
          }
        },
        {
          id: 'field5',
          type: 'user',
          name: 'Assigned User',
          required: false,
          placeholder: 'Select user'
        }
      ],
      forms: [
        {
          id: 'form1',
          name: 'Main Order Form',
          description: 'The primary form for capturing order details.',
          layout: [
            { metadataFieldId: 'field1' },
            { metadataFieldId: 'field2' },
            { metadataFieldId: 'field3' },
            { metadataFieldId: 'field4' },
          ]
        }
      ],
      workflow: {
        forms: [
          { formId: 'form1', order: 1 }
        ],
        steps: [
          {
            id: 'step1',
            name: 'Order Receipt',
            description: 'Receive and validate order information',
            order: 1,
            type: 'receipt',
            required: true,
            user: null
          },
          {
            id: 'step2',
            name: 'Inventory Check',
            description: 'Check product availability',
            order: 2,
            type: 'inventory',
            required: true,
            user: null
          },
          {
            id: 'step3',
            name: 'Payment Processing',
            description: 'Process payment and confirm transaction',
            order: 3,
            type: 'payment',
            required: true,
            user: null
          },
          {
            id: 'step4',
            name: 'Fulfillment',
            description: 'Prepare and ship order',
            order: 4,
            type: 'fulfillment',
            required: true,
            user: null
          }
        ]
      },
    },
    {
      id: 'process3',
      name: 'Invoice Approval',
      description: 'Invoice review and approval workflow for expense management',
      version: '1.1.0',
      settings: {
        autoStart: false,
        timeout: 60,
        priority: 'Medium',
        enabled: true
      },
      submenus: [
        {
          id: 'metadata3',
          name: 'Metadata',
          path: '/processes/process3/metadata',
          description: 'Manage process configuration and metadata'
        },
        {
          id: 'forms3',
          name: 'Forms',
          path: '/processes/process3/forms',
          description: 'Manage forms and data collection'
        },
        {
          id: 'workflow3',
          name: 'Workflow',
          path: '/processes/process3/workflow',
          description: 'Design and manage process workflow'
        }
      ],
      metadataFields: [
        {
          id: 'field1',
          type: 'text',
          name: 'Invoice Number',
          required: true,
          placeholder: 'Enter invoice number',
          validation: {
            pattern: 'alphanumeric'
          }
        },
        {
          id: 'field2',
          type: 'number',
          name: 'Amount',
          required: true,
          placeholder: 'Enter invoice amount',
          validation: {
            min: 0.01
          }
        },
        {
          id: 'field3',
          type: 'text',
          name: 'Vendor',
          required: true,
          placeholder: 'Enter vendor name',
          validation: {
            minLength: 2,
            maxLength: 100
          }
        },
        {
          id: 'field4',
          type: 'date',
          name: 'Invoice Date',
          required: true,
          validation: {
            maxDate: 'today'
          }
        },
        {
          id: 'field5',
          type: 'textarea',
          name: 'Description',
          required: false,
          placeholder: 'Enter invoice description',
          validation: {
            maxLength: 500
          }
        },
        {
          id: 'field6',
          type: 'user',
          name: 'Assigned User',
          required: false,
          placeholder: 'Select user'
        }
      ],
      forms: [
        {
          id: 'form1',
          name: 'Standard Invoice Form',
          description: 'Form for submitting standard invoices for approval.',
          layout: [
            { metadataFieldId: 'field1' },
            { metadataFieldId: 'field2' },
            { metadataFieldId: 'field3' },
            { metadataFieldId: 'field4' },
            { metadataFieldId: 'field5' },
          ]
        }
      ],
      workflow: {
        forms: [
          { formId: 'form1', order: 1 }
        ],
        steps: [
          {
            id: 'step1',
            name: 'Invoice Submission',
            description: 'Submit invoice for review',
            order: 1,
            type: 'submission',
            required: true,
            user: null
          },
          {
            id: 'step2',
            name: 'Initial Review',
            description: 'Review invoice details and documentation',
            order: 2,
            type: 'review',
            required: true,
            user: null
          },
          {
            id: 'step3',
            name: 'Manager Approval',
            description: 'Manager approval for invoice payment',
            order: 3,
            type: 'approval',
            required: true,
            user: null
          },
          {
            id: 'step4',
            name: 'Payment Processing',
            description: 'Process approved invoice payment',
            order: 4,
            type: 'payment',
            required: true,
            user: null
          }
        ]
      },
    }
  ],
  app: {
    name: 'Lotion',
    version: '1.0.0',
    theme: {
      primary: '#2e75cc',
      secondary: '#787774',
      background: '#ffffff',
      surface: '#fbfbfa',
      border: '#e3e2e0',
      text: '#37352f',
      textSecondary: '#787774'
    },
    settings: {
      defaultTimeout: 30,
      maxProcesses: 100,
      enableNotifications: true,
      autoSave: true
    }
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