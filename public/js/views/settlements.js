// public/js/views/settlements.js
import { api } from '../api.js';
import { ui } from '../ui.js';
import { getGroupLayout } from './group-layout.js';

export async function render({ id }) {
  const layout = await getGroupLayout(id, 'settlements');

  return `
    ${layout}
    <div style="display:flex; justify-content:flex-end; margin-bottom: 1rem;">
      <button class="btn btn-primary" id="btn-add-settlement">Create Settlement</button>
    </div>

    <div class="card">
      <div id="settlements-container">
        <div class="loader-container"><div class="spinner"></div></div>
      </div>
    </div>

    <!-- Create Settlement Modal -->
    <div class="modal" id="modal-add-settlement">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Create Settlement</h3>
          <button class="modal-close" id="btn-close-modal">&times;</button>
        </div>
        <form id="form-add-settlement">
          <div class="form-group">
            <label>From (Payer)</label>
            <select id="settlement-from" class="form-control" required></select>
          </div>
          <div class="form-group">
            <label>To (Receiver)</label>
            <select id="settlement-to" class="form-control" required></select>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Amount</label>
              <input type="number" step="0.01" id="settlement-amount" class="form-control" required>
            </div>
            <div class="form-group">
              <label>Currency</label>
              <select id="settlement-currency" class="form-control">
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="settlement-date" class="form-control" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;">Record Settlement</button>
        </form>
      </div>
    </div>
  `;
}

export async function init({ id }) {
  let members = [];
  try {
    const res = await api.get(`/groups/${id}/members`);
    members = res.data || [];
  } catch (err) {
    console.error('Failed to load members for settlement form');
  }

  const loadSettlements = async () => {
    try {
      const res = await api.get(`/groups/${id}/settlements`);
      const settlements = res.data || [];
      const container = document.getElementById('settlements-container');
      
      if (settlements.length === 0) {
        ui.showEmptyState('settlements-container', 'No settlements have been recorded yet.');
        return;
      }

      container.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${settlements.map(s => `
              <tr>
                <td style="font-weight:500;">${s.fromUser?.name || 'Unknown'}</td>
                <td style="font-weight:500;">${s.toUser?.name || 'Unknown'}</td>
                <td style="font-weight:600; color:var(--success);">${s.amount}</td>
                <td><span class="badge badge-success">${s.currency}</span></td>
                <td>${new Date(s.date).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn-outline btn-sm btn-delete" data-id="${s.id}">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          if (confirm('Are you sure you want to delete this settlement?')) {
            const settlementId = e.target.getAttribute('data-id');
            try {
              await api.delete(`/groups/${id}/settlements/${settlementId}`);
              ui.toast('Settlement deleted');
              await loadSettlements();
            } catch (err) {
              ui.toast(err.message, 'error');
            }
          }
        });
      });

    } catch (err) {
      ui.toast('Failed to load settlements', 'error');
    }
  };

  await loadSettlements();

  const btnAdd = document.getElementById('btn-add-settlement');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      const fromSelect = document.getElementById('settlement-from');
      const toSelect = document.getElementById('settlement-to');
      
      const optionsHtml = members.map(m => `<option value="${m.userId}">${m.user.name}</option>`).join('');
      fromSelect.innerHTML = optionsHtml;
      toSelect.innerHTML = optionsHtml;
      
      document.getElementById('settlement-date').valueAsDate = new Date();
      
      ui.showModal('modal-add-settlement');
    });
  }

  const btnClose = document.getElementById('btn-close-modal');
  if (btnClose) {
    btnClose.addEventListener('click', () => ui.hideModal('modal-add-settlement'));
  }

  const form = document.getElementById('form-add-settlement');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fromUserId = document.getElementById('settlement-from').value;
      const toUserId = document.getElementById('settlement-to').value;
      const amount = parseFloat(document.getElementById('settlement-amount').value);
      const currency = document.getElementById('settlement-currency').value;
      const date = new Date(document.getElementById('settlement-date').value).toISOString();

      if (fromUserId === toUserId) {
        ui.toast('Payer and Receiver cannot be the same person', 'error');
        return;
      }

      try {
        await api.post(`/groups/${id}/settlements`, {
          fromUserId,
          toUserId,
          amount,
          currency,
          date
        });
        ui.toast('Settlement recorded successfully');
        ui.hideModal('modal-add-settlement');
        e.target.reset();
        await loadSettlements();
      } catch (err) {
        ui.toast(err.message, 'error');
      }
    });
  }
}
