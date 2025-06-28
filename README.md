# Lotion - Process Management Platform

A comprehensive workflow automation and process management platform built with React and Vite.

## 🚀 Features

### Workflow Management
- **Interactive Workflow Builder**: Create and manage complex workflow processes
- **Step-by-Step Navigation**: Click through workflow items to edit individual steps
- **Multi-User Assignment**: Assign workflow steps to multiple users and groups
- **Conditional Routing**: Route workflow based on dynamic rules and conditions

### Rule System
- **Visual Rule Builder**: Create complex rules with AND/OR logic
- **Field vs Value Comparisons**: Smart toggle between field and static value comparisons
- **Dropdown Field Support**: Full support for dropdown/select fields in rule conditions
- **Reusable Rules**: Create rules once, use across multiple workflows

### Data Mapping
- **Smart Field Mapping**: Copy, transform, and manipulate data between fields
- **Type-Aware Transformations**: Field-type specific operations (add/subtract for numbers, etc.)
- **Conditional Mappings**: Execute data transformations based on rule conditions
- **User Assignment Mapping**: Map user/group assignments with searchable selector

### Enterprise Features
- **User & Group Management**: Comprehensive user and group assignment system
- **Metadata Fields**: Enterprise-wide fields with dropdown options
- **Form Builder**: Dynamic form creation with drag-and-drop interface
- **Dataset Management**: Centralized dropdown option management

## 🛠️ Technical Stack

- **Frontend**: React 19 + Vite
- **Routing**: React Router DOM
- **Styling**: CSS Modules with CSS Variables
- **Icons**: Lucide React
- **Drag & Drop**: React Beautiful DnD
- **State Management**: React Context + LocalStorage

## 📦 Installation & Development

```bash
# Clone the repository
git clone https://github.com/gr-ant/Lotion.git
cd Lotion

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages.

### Automatic Deployment
- **Triggers**: Pushes to `main` or `master` branch
- **URL**: `https://gr-ant.github.io/Lotion/`
- **Status**: Check the Actions tab for deployment status

### Manual Deployment
```bash
# Install gh-pages (if not already installed)
npm install --save-dev gh-pages

# Deploy to GitHub Pages
npm run deploy
```

### Configuration Details
- **Base Path**: Configured for `/Lotion/` subpath
- **SPA Routing**: Full client-side routing support on GitHub Pages
- **Build Optimization**: Code splitting and asset optimization
- **GitHub Actions**: Automated CI/CD pipeline

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── DataMappingModal.jsx    # Data mapping configuration
│   ├── RuleModal.jsx           # Rule builder interface
│   ├── UserSelector.jsx        # User/group selection
│   ├── WorkflowMappings.jsx    # Workflow routing & data mapping
│   └── ...
├── pages/               # Page components
│   ├── WorkflowStepPage.jsx    # Individual workflow step editing
│   ├── ConfigurationPage.jsx   # Settings and configuration
│   └── ...
├── models/              # Data models
│   └── WorkflowModel.js        # Workflow data structure
├── services/            # Business logic
│   └── NotionService.js        # Data persistence service
└── styles/              # Global styles
```

## 🔧 Key Components

### WorkflowMappings
Handles routing rules and data mappings for workflow steps:
- **Routing Rules**: Define conditional paths through workflow
- **Data Mappings**: Transform and copy data between fields
- **Rule Integration**: Connect with centralized rule system

### RuleModal
Advanced rule builder with:
- **Multi-condition Support**: Complex AND/OR logic
- **Field Type Detection**: Smart input controls based on field types
- **Dropdown Integration**: Full support for select fields with datasets

### DataMappingModal
Popup-based data mapping configuration:
- **Field Selection**: Source and target field mapping
- **Transformation Types**: Copy, add, subtract, set value
- **User Field Support**: Special handling for user/group assignments
- **Conditional Execution**: Link mappings to rule conditions

## 📊 Data Flow

1. **Process Creation**: Define metadata fields and forms
2. **Workflow Design**: Create workflow steps with assignments
3. **Rule Configuration**: Build reusable business rules
4. **Mapping Setup**: Configure data transformations and routing
5. **Execution**: Process flows through steps based on conditions

## 🚀 Deployment Status

- **Production URL**: [https://gr-ant.github.io/Lotion/](https://gr-ant.github.io/Lotion/)
- **Build Status**: [![Deploy to GitHub Pages](https://github.com/gr-ant/Lotion/actions/workflows/deploy.yml/badge.svg)](https://github.com/gr-ant/Lotion/actions/workflows/deploy.yml)
- **Last Updated**: Automatically updated on each push to main branch

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

---

Built with ❤️ using React, Vite, and modern web technologies.