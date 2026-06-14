// public/js/views/balances.js
import { api } from '../api.js';
import { ui } from '../ui.js';
import { getGroupLayout } from './group-layout.js';

export async function render({ id }) {
  const layout = await getGroupLayout(id, 'balances');

  return `
    ${layout}
    <div class="card">
      <h3 class="section-title">Simplified Balances</h3>
      <p style="color:var(--text-muted); margin-bottom:1.5rem; font-size:0.875rem;">
        This shows who owes whom to settle all debts with the minimum number of transactions.
      </p>
      <div id="balances-container">
        <div class="loader-container"><div class="spinner"></div></div>
      </div>
    </div>
  `;
}

export async function init({ id }) {
  try {
    const res = await api.get(`/groups/${id}/simplified-balances`);
    const balances = res.data || [];
    const container = document.getElementById('balances-container');
    
    if (balances.length === 0) {
      ui.showEmptyState('balances-container', 'All balances are settled up! 🎉');
      return;
    }

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:1rem;">
        ${balances.map(b => `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:1rem; border:1px solid var(--border-color); border-radius:var(--radius); background:var(--bg-color);">
            <div style="display:flex; align-items:center; gap:1rem;">
              <div class="avatar">${b.fromUserName.substring(0, 2).toUpperCase()}</div>
              <div>
                <div style="font-weight:600;">${b.fromUserName}</div>
                <div style="font-size:0.875rem; color:var(--text-muted);">Owes</div>
              </div>
            </div>
            
            <div style="display:flex; flex-direction:column; align-items:center; flex:1; padding:0 2rem;">
              <div style="font-weight:700; color:var(--danger); font-size:1.25rem;">${b.amount}</div>
              <div style="width:100%; height:2px; background:var(--border-color); position:relative; margin-top:0.5rem;">
                <div style="position:absolute; right:0; top:-4px; border-top:5px solid transparent; border-bottom:5px solid transparent; border-left:5px solid var(--border-color);"></div>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:1rem; flex-direction:row-reverse;">
              <div class="avatar" style="background:var(--secondary);">${b.toUserName.substring(0, 2).toUpperCase()}</div>
              <div style="text-align:right;">
                <div style="font-weight:600;">${b.toUserName}</div>
                <div style="font-size:0.875rem; color:var(--text-muted);">Gets back</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    ui.toast('Failed to load balances', 'error');
  }
}
