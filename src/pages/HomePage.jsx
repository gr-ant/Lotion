import { useState, useEffect } from 'react';
import notionService from '../services/NotionService.js';
import './HomePage.css';

export default function HomePage() {
  const [assignedInstances, setAssignedInstances] = useState([]);

  useEffect(() => {
    const allProcesses = notionService.getProcesses();
    let allInstances = [];
    allProcesses.forEach(proc => {
      const instances = notionService.getProcessInstances(proc.id) || [];
      allInstances = allInstances.concat(instances.map(inst => ({ ...inst, process: proc })));
    });
    setAssignedInstances(allInstances);
  }, []);

  return (
    <div className="page-content">
      <h2>Process Tasks</h2>
      {assignedInstances.length === 0 ? (
        <p>No process tasks available.</p>
      ) : (
        <ul className="assigned-instances-list">
          {assignedInstances.map(inst => (
            <li key={inst.id} className="assigned-instance-item">
              <div>
                {inst.process?.name || 'Process'} — Instance {inst.id}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
