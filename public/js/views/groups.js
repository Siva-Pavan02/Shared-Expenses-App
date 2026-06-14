import { api } from '../api.js';
import { ui } from '../ui.js';
import { router } from '../router.js';
import { loadSidebarGroups } from '../main.js';

export async function render() {
  document.getElementById('app-navbar').style.display = 'flex';
  document.getElementById('app-sidebar').style.display = 'flex';

  return `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
      <h2 class="page-title" style="margin:0;">Groups</h2>
      <button class="btn btn-primary" id="btn-create-group">Create Group</button>
    </div>

    <div class="card">
      <div id="groups-container">
        <div class="loader-container"><div class="spinner"></div></div>
      </div>
    </div>

    <!-- Create Group Modal -->
    <div class="modal" id="modal-create-group">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Create New Group</h3>
          <button class="modal-close" id="btn-close-modal">&times;</button>
        </div>
        <form id="form-create-group">
          <div class="form-group">
            <label>Group Name</label>
            <input type="text" id="group-name" class="form-control" required placeholder="e.g. Trip to Paris">
          </div>
          <div class="form-group">
            <label>Base Currency</label>
            <select id="group-currency" class="form-control">
              <option value="INR">INR - Indian Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;">Create</button>
        </form>
      </div>
    </div>
  `;
}

export async function init() {
  const loadGroups = async () => {
    try {
      const res = await api.get('/groups');
      const groups = res.data || [];
      const container = document.getElementById('groups-container');
      
      if (groups.length === 0) {
        ui.showEmptyState('groups-container', 'You are not part of any groups yet.');
        return;
      }

      container.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Base Currency</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${groups.map(g => `
              <tr>
                <td style="font-weight:600;">${g.name}</td>
                <td><span class="badge badge-success">${g.baseCurrency}</span></td>
                <td>${new Date(g.createdAt).toLocaleDateString()}</td>
                <td>
                  <a href="/groups/${g.id}" data-link class="btn btn-outline btn-sm">View</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      ui.toast('Failed to load groups', 'error');
    }
  };

  await loadGroups();

  document.getElementById('btn-create-group').addEventListener('click', () => {
    ui.showModal('modal-create-group');
  });

  document.getElementById('btn-close-modal').addEventListener('click', () => {
    ui.hideModal('modal-create-group');
  });

  document.getElementById('form-create-group').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('group-name').value;
    const baseCurrency = document.getElementById('group-currency').value;

    try {
      await api.post('/groups', { name, baseCurrency });
      ui.toast('Group created successfully');
      ui.hideModal('modal-create-group');
      e.target.reset();
      await loadGroups();
      await loadSidebarGroups();
    } catch (err) {
      ui.toast(err.message, 'error');
    }
  });
}
