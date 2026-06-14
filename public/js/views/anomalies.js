// public/js/views/anomalies.js
import { api } from '../api.js';
import { ui } from '../ui.js';
import { router } from '../router.js';

export async function render({ id, importId }) {
  return `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
      <div>
        <a href="/groups/${id}/imports" data-link style="color:var(--text-muted); text-decoration:none; font-size:0.875rem;">← Back to Imports</a>
        <h2 class="page-title" style="margin: 0.5rem 0 0 0;">Review Anomalies</h2>
      </div>
      <div>
        <span class="badge badge-warning" id="count-pending">0 Pending</span>
        <span class="badge badge-success" id="count-approved">0 Approved</span>
        <span class="badge badge-danger" id="count-rejected">0 Rejected</span>
      </div>
    </div>

    <div class="card">
      <div id="anomalies-container">
        <div class="loader-container"><div class="spinner"></div></div>
      </div>
    </div>
  `;
}

export async function init({ id, importId }) {
  const loadAnomalies = async () => {
    try {
      const res = await api.get(`/groups/${id}/imports/${importId}/anomalies`);
      const anomalies = res.data || [];
      const container = document.getElementById('anomalies-container');
      
      let pending = 0;
      let approved = 0;
      let rejected = 0;

      anomalies.forEach(a => {
        if (a.resolutionStatus === 'PENDING') pending++;
        else if (a.resolutionStatus === 'APPROVED') approved++;
        else rejected++;
      });

      document.getElementById('count-pending').innerText = `${pending} Pending`;
      document.getElementById('count-approved').innerText = `${approved} Approved`;
      document.getElementById('count-rejected').innerText = `${rejected} Rejected`;

      if (anomalies.length === 0) {
        ui.showEmptyState('anomalies-container', 'No anomalies found for this import.');
        return;
      }

      container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:1rem;">
          ${anomalies.map(a => `
            <div style="padding:1rem; border:1px solid var(--border-color); border-radius:var(--radius); background:var(--bg-color);">
              <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <div style="font-weight:600; font-size:1.1rem;">${a.anomalyType}</div>
                <span class="badge ${a.severity === 'HIGH' ? 'badge-danger' : a.severity === 'MEDIUM' ? 'badge-warning' : 'badge-success'}">${a.severity}</span>
              </div>
              <p style="margin-bottom:0.5rem;"><strong>Description:</strong> ${a.description}</p>
              <p style="margin-bottom:1rem;"><strong>Suggested Action:</strong> ${a.suggestedAction || 'None'}</p>
              
              ${a.resolutionStatus === 'PENDING' ? `
                <div style="display:flex; gap:0.5rem;">
                  <button class="btn btn-success btn-sm btn-approve" data-id="${a.id}">Approve</button>
                  <button class="btn btn-danger btn-sm btn-reject" data-id="${a.id}">Reject</button>
                </div>
              ` : `
                <div style="font-weight:600; color:${a.resolutionStatus === 'APPROVED' ? 'var(--success)' : 'var(--danger)'}">
                  Resolved: ${a.resolutionStatus}
                </div>
              `}
            </div>
          `).join('')}
        </div>
      `;

      container.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const anomalyId = e.target.getAttribute('data-id');
          try {
            await api.patch(`/anomalies/${anomalyId}/review`, { action: 'APPROVE' });
            ui.toast('Anomaly approved');
            await loadAnomalies();
          } catch (err) {
            ui.toast(err.message, 'error');
          }
        });
      });

      container.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const anomalyId = e.target.getAttribute('data-id');
          try {
            await api.patch(`/anomalies/${anomalyId}/review`, { action: 'REJECT' });
            ui.toast('Anomaly rejected');
            await loadAnomalies();
          } catch (err) {
            ui.toast(err.message, 'error');
          }
        });
      });

    } catch (err) {
      ui.toast('Failed to load anomalies', 'error');
    }
  };

  await loadAnomalies();
}
