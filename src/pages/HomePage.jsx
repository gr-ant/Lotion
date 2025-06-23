import { Link } from 'react-router-dom';
import notionService from '../services/NotionService.js';
import './HomePage.css';

function HomePage() {
  const processes = notionService.getProcesses();

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Home</h1>
        <p>Overview of your processes.</p>
      </div>
      <div className="content-card full-width">
        <div className="card-header">
          <h3>Processes</h3>
        </div>
        {processes.length === 0 ? (
          <div className="empty-processes-placeholder">
            <p>No processes have been created yet.</p>
          </div>
        ) : (
          <div className="process-cards">
            {processes.map(process => (
              <Link
                key={process.id}
                to={`/processes/${process.id}/metadata`}
                className="process-card"
              >
                <h4>{process.name}</h4>
                <p>{process.description || 'No description provided.'}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
