// public/js/views/dashboard.js
import { api } from '../api.js';
import { ui } from '../ui.js';
import { router } from '../router.js';

export async function render() {
  document.getElementById('app-navbar').style.display = 'flex';
  document.getElementById('app-sidebar').style.display = 'flex';

  return `
    <div class="page-header">
      <h2 class="page-title">Dashboard</h2>
    </div>

    <div class="grid-4">
      <div class="card stat-card">
        <div class="label">Total Groups</div>
        <div class="value" id="stat-groups">...</div>
      </div>
      <div class="card stat-card">
        <div class="label">Total Members</div>
        <div class="value" id="stat-members">...</div>
      </div>
      <div class="card stat-card">
        <div class="label">Total Expenses</div>
        <div class="value" id="stat-expenses">...</div>
      </div>
      <div class="card stat-card">
        <div class="label">Total Settlements</div>
        <div class="value" id="stat-settlements">...</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3 class="section-title">System Status</h3>
        <table class="table" style="margin-top:1rem;">
          <tbody>
            <tr><td>API Status</td><td id="status-api">Checking...</td></tr>
            <tr><td>Database Status</td><td id="status-db">Checking...</td></tr>
            <tr><td>Environment</td><td id="status-env">Checking...</td></tr>
            <tr><td>Version</td><td id="status-version">Checking...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h3 class="section-title">Quick Actions</h3>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;">
          <a href="/groups" data-link class="btn btn-outline" style="text-align:center; display:block;">View Groups</a>
        </div>
      </div>
    </div>
  `;
}

export async function init() {
  try {
    // Fetch system status
    const health = await api.get('/health').catch(() => null);
    if (health) {
      document.getElementById('status-api').innerText = health.status === 'ok' ? '✅ Online' : '❌ Offline';
      document.getElementById('status-db').innerText = health.database === 'connected' ? '✅ Connected' : '❌ Disconnected';
      document.getElementById('status-version').innerText = health.version || '1.0.0';
    }

    const info = await api.get('/info').catch(() => null);
    if (info) {
      document.getElementById('status-env').innerText = info.environment || 'Production';
    }

    // Fetch user groups
    const res = await api.get('/groups');
    const groups = res.data || [];
    document.getElementById('stat-groups').innerText = groups.length;

    // To get totals, we fetch details for each group
    let totalMembers = 0;
    let totalExpenses = 0;
    let totalSettlements = 0;

    // Limit concurrent requests if there are too many groups
    for (const group of groups) {
      const [members, expenses, settlements] = await Promise.all([
        api.get(`/groups/${group.id}/members`).catch(() => ({ data: [] })),
        api.get(`/groups/${group.id}/expenses`).catch(() => ({ data: [] })),
        api.get(`/groups/${group.id}/settlements`).catch(() => ({ data: [] }))
      ]);
      totalMembers += (members.data || []).length;
      totalExpenses += (expenses.data || []).length;
      totalSettlements += (settlements.data || []).length;
    }

    document.getElementById('stat-members').innerText = totalMembers;
    document.getElementById('stat-expenses').innerText = totalExpenses;
    document.getElementById('stat-settlements').innerText = totalSettlements;

  } catch (err) {
    ui.toast('Failed to load dashboard stats', 'error');
  }
}
