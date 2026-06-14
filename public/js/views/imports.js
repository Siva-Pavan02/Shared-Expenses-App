// public/js/views/imports.js
import { api } from '../api.js';
import { ui } from '../ui.js';
import { getGroupLayout } from './group-layout.js';

export async function render({ id }) {
  const layout = await getGroupLayout(id, 'imports');

  return `
    ${layout}
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
      <h3 class="section-title" style="margin:0;">Import Jobs</h3>
      <button class="btn btn-primary" id="btn-start-import">Start New Import</button>
    </div>

    <div class="card">
      <div id="imports-container">
        <div class="loader-container"><div class="spinner"></div></div>
      </div>
    </div>

    <!-- Import Wizard Modal -->
    <div class="modal" id="modal-import-wizard">
      <div class="modal-content" style="max-width:600px;">
        <div class="modal-header">
          <h3 class="modal-title">CSV Import Wizard</h3>
          <button class="modal-close" id="btn-close-wizard">&times;</button>
        </div>
        
        <div id="wizard-step-1">
          <h4>Step 1: Upload CSV</h4>
          <p style="color:var(--text-muted); margin-bottom:1rem;">Select a CSV file containing expenses to import.</p>
          <form id="form-upload-csv">
            <div class="form-group">
              <input type="file" id="csv-file" accept=".csv" required class="form-control">
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;">Upload & Analyze</button>
          </form>
        </div>

        <div id="wizard-step-2" style="display:none;">
          <h4>Step 2: Import Report</h4>
          <div id="import-report-content" style="margin:1rem 0; padding:1rem; background:var(--bg-color); border-radius:var(--radius);">
            Analyzing...
          </div>
          <button id="btn-wizard-next-anomalies" class="btn btn-warning" style="width:100%; display:none;">Review Anomalies</button>
          <button id="btn-wizard-next-finalize" class="btn btn-success" style="width:100%; display:none;">Finalize Import</button>
        </div>

        <div id="wizard-step-5" style="display:none; text-align:center;">
          <h4>Step 5: Completion Summary</h4>
          <div style="font-size:3rem; margin:1rem 0;">✅</div>
          <p id="summary-text" style="color:var(--text-muted); margin-bottom:1rem;">Import completed successfully.</p>
          <button id="btn-wizard-finish" class="btn btn-primary" style="width:100%;">Done</button>
        </div>
      </div>
    </div>
  `;
}

export async function init({ id }) {
  const loadImports = async () => {
    try {
      const res = await api.get(`/groups/${id}/imports`);
      const jobs = res.data || [];
      const container = document.getElementById('imports-container');
      
      if (jobs.length === 0) {
        ui.showEmptyState('imports-container', 'No CSV imports have been run yet.');
        return;
      }

      container.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${jobs.map(j => `
              <tr>
                <td style="font-weight:500;">${j.filename}</td>
                <td>
                  <span class="badge ${j.status === 'COMPLETED' ? 'badge-success' : j.status === 'FAILED' ? 'badge-danger' : 'badge-warning'}">
                    ${j.status}
                  </span>
                </td>
                <td>${new Date(j.createdAt).toLocaleDateString()}</td>
                <td>
                  ${j.status === 'PENDING_REVIEW' ? `<a href="/imports/${j.id}/anomalies" data-link class="btn btn-outline btn-sm">Review Anomalies</a>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      ui.toast('Failed to load imports', 'error');
    }
  };

  await loadImports();

  const modal = document.getElementById('modal-import-wizard');
  const s1 = document.getElementById('wizard-step-1');
  const s2 = document.getElementById('wizard-step-2');
  const s5 = document.getElementById('wizard-step-5');

  const resetWizard = () => {
    s1.style.display = 'block';
    s2.style.display = 'none';
    s5.style.display = 'none';
    document.getElementById('form-upload-csv').reset();
  };

  document.getElementById('btn-start-import').addEventListener('click', () => {
    resetWizard();
    ui.showModal('modal-import-wizard');
  });

  document.getElementById('btn-close-wizard').addEventListener('click', () => {
    ui.hideModal('modal-import-wizard');
    loadImports();
  });

  let currentJobId = null;

  document.getElementById('form-upload-csv').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('csv-file');
    if (!fileInput.files[0]) return;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
      const res = await api.post(`/groups/${id}/imports/upload`, formData);
      currentJobId = res.data.importJobId;
      ui.toast('Upload successful. Analyzing...');
      
      // Move to step 2
      s1.style.display = 'none';
      s2.style.display = 'block';
      
      // Fetch report
      const reportRes = await api.get(`/groups/${id}/imports/${currentJobId}/report`);
      const report = reportRes.data;
      
      const content = document.getElementById('import-report-content');
      content.innerHTML = `
        <p><strong>Total Rows:</strong> ${report.totalRows}</p>
        <p><strong>Valid Rows:</strong> ${report.validRows}</p>
        <p><strong>Anomalies Found:</strong> ${report.anomaliesCount}</p>
      `;

      const btnAnomalies = document.getElementById('btn-wizard-next-anomalies');
      const btnFinalize = document.getElementById('btn-wizard-next-finalize');

      if (report.anomaliesCount > 0) {
        btnAnomalies.style.display = 'block';
        btnFinalize.style.display = 'none';
        btnAnomalies.onclick = () => {
          ui.hideModal('modal-import-wizard');
          import('../router.js').then(({ router }) => router.navigate(`/imports/${currentJobId}/anomalies`));
        };
      } else {
        btnAnomalies.style.display = 'none';
        btnFinalize.style.display = 'block';
        btnFinalize.onclick = async () => {
          try {
            const finalRes = await api.post(`/groups/${id}/imports/${currentJobId}/finalize`);
            s2.style.display = 'none';
            s5.style.display = 'block';
            document.getElementById('summary-text').innerText = `Successfully created ${finalRes.data.createdExpenses} expenses and ${finalRes.data.createdSettlements} settlements.`;
          } catch (err) {
            ui.toast(err.message, 'error');
          }
        };
      }
    } catch (err) {
      ui.toast(err.message, 'error');
    }
  });

  document.getElementById('btn-wizard-finish').addEventListener('click', () => {
    ui.hideModal('modal-import-wizard');
    loadImports();
  });
}
