// public/js/views/expenses.js
import { api } from '../api.js';
import { ui } from '../ui.js';
import { getGroupLayout } from './group-layout.js';

export async function render({ id }) {
  const layout = await getGroupLayout(id, 'expenses');

  return `
    ${layout}
    <div style="display:flex; justify-content:flex-end; margin-bottom: 1rem;">
      <button class="btn btn-primary" id="btn-add-expense">Create Expense</button>
    </div>

    <div class="card">
      <div id="expenses-container">
        <div class="loader-container"><div class="spinner"></div></div>
      </div>
    </div>

    <!-- Create Expense Modal -->
    <div class="modal" id="modal-add-expense">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Create Expense</h3>
          <button class="modal-close" id="btn-close-modal">&times;</button>
        </div>
        <form id="form-add-expense">
          <div class="form-group">
            <label>Description</label>
            <input type="text" id="expense-desc" class="form-control" required placeholder="e.g. Dinner">
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Amount</label>
              <input type="number" step="0.01" id="expense-amount" class="form-control" required>
            </div>
            <div class="form-group">
              <label>Currency</label>
              <select id="expense-currency" class="form-control">
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="expense-date" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Paid By</label>
            <select id="expense-paid-by" class="form-control" required>
              <option value="">Loading...</option>
            </select>
          </div>
          <div class="form-group">
            <label>Split Type</label>
            <select id="expense-split" class="form-control" disabled>
              <option value="EQUAL">Equally</option>
            </select>
            <small style="color:var(--text-muted);">Only EQUAL split is supported in this demo UI.</small>
          </div>
          <div class="form-group">
            <label>Participants</label>
            <div id="expense-participants" style="max-height: 150px; overflow-y:auto; border:1px solid var(--border-color); padding:0.5rem; border-radius:var(--radius);">
              Loading participants...
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;">Create</button>
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
    console.error('Failed to load members for expense form');
  }

  const loadExpenses = async () => {
    try {
      const res = await api.get(`/groups/${id}/expenses`);
      const expenses = res.data || [];
      const container = document.getElementById('expenses-container');
      
      if (expenses.length === 0) {
        ui.showEmptyState('expenses-container', 'No expenses have been added yet.');
        return;
      }

      container.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Paid By</th>
              <th>Date</th>
              <th>Split Type</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map(e => `
              <tr>
                <td style="font-weight:500;">${e.description}</td>
                <td style="font-weight:600; color:var(--secondary);">${e.amount}</td>
                <td><span class="badge badge-success">${e.currency}</span></td>
                <td>${e.paidBy?.name || 'Unknown'}</td>
                <td>${new Date(e.date).toLocaleDateString()}</td>
                <td>${e.splitType}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      ui.toast('Failed to load expenses', 'error');
    }
  };

  await loadExpenses();

  const updateParticipants = () => {
    const participantsContainer = document.getElementById('expense-participants');
    const paidBySelect = document.getElementById('expense-paid-by');
    
    // Add time to date to cover full day (23:59:59.999Z)
    const dateVal = document.getElementById('expense-date').value;
    if (!dateVal) return;
    
    const d = new Date(dateVal);
    d.setUTCHours(23, 59, 59, 999);
    
    const activeMembers = members.filter(m => {
      const joinedAt = new Date(m.joinedAt);
      const leftAt = m.leftAt ? new Date(m.leftAt) : null;
      return joinedAt <= d && (!leftAt || leftAt >= d);
    });

    if (activeMembers.length === 0) {
      participantsContainer.innerHTML = 'No active members available on this date.';
      paidBySelect.innerHTML = '<option value="">No active members</option>';
    } else {
      participantsContainer.innerHTML = activeMembers.map(m => `
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
          <input type="checkbox" name="expense-participant" value="${m.userId}" checked>
          <label style="margin:0;">${m.user.name}</label>
        </div>
      `).join('');
      
      paidBySelect.innerHTML = activeMembers.map(m => `
        <option value="${m.userId}">${m.user.name}</option>
      `).join('');
    }
  };

  const btnAdd = document.getElementById('btn-add-expense');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      document.getElementById('expense-date').valueAsDate = new Date();
      updateParticipants();
      ui.showModal('modal-add-expense');
    });
  }
  
  const dateInput = document.getElementById('expense-date');
  if (dateInput) {
    dateInput.addEventListener('change', updateParticipants);
  }

  const btnClose = document.getElementById('btn-close-modal');
  if (btnClose) {
    btnClose.addEventListener('click', () => ui.hideModal('modal-add-expense'));
  }

  const form = document.getElementById('form-add-expense');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const description = document.getElementById('expense-desc').value;
      const amount = parseFloat(document.getElementById('expense-amount').value);
      const currency = document.getElementById('expense-currency').value;
      
      const d = new Date(document.getElementById('expense-date').value);
      d.setUTCHours(23, 59, 59, 999);
      const date = d.toISOString();
      
      const splitType = document.getElementById('expense-split').value;
      const paidById = document.getElementById('expense-paid-by').value;
      
      const participantCheckboxes = document.querySelectorAll('input[name="expense-participant"]:checked');
      const participants = Array.from(participantCheckboxes).map(cb => ({ userId: cb.value }));

      if (participants.length === 0) {
        ui.toast('Please select at least one participant', 'error');
        return;
      }
      
      if (!paidById) {
        ui.toast('Please select who paid', 'error');
        return;
      }

      try {
        await api.post(`/groups/${id}/expenses`, {
          description,
          amount,
          currency,
          date,
          splitType,
          paidById,
          participants
        });
        ui.toast('Expense created successfully');
        ui.hideModal('modal-add-expense');
        e.target.reset();
        await loadExpenses();
      } catch (err) {
        ui.toast(err.message, 'error');
      }
    });
  }
}
