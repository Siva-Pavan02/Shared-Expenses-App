// public/js/views/members.js
import { api } from '../api.js';
import { ui } from '../ui.js';
import { getGroupLayout } from './group-layout.js';

export async function render({ id }) {
  const layout = await getGroupLayout(id, 'members');

  return `
    ${layout}
    <div style="display:flex; justify-content:flex-end; margin-bottom: 1rem;">
      <button class="btn btn-primary" id="btn-add-member">Add Member</button>
    </div>

    <div class="card">
      <div id="members-container">
        <div class="loader-container"><div class="spinner"></div></div>
      </div>
    </div>

    <!-- Add Member Modal -->
    <div class="modal" id="modal-add-member">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Add Member</h3>
          <button class="modal-close" id="btn-close-modal">&times;</button>
        </div>
        <form id="form-add-member">
          <div class="form-group">
            <label>User ID</label>
            <input type="text" id="member-userId" class="form-control" required placeholder="User UUID">
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;">Add Member</button>
        </form>
      </div>
    </div>
  `;
}

export async function init({ id }) {
  const loadMembers = async () => {
    try {
      const res = await api.get(`/groups/${id}/members`);
      const members = res.data || [];
      const container = document.getElementById('members-container');
      
      if (members.length === 0) {
        ui.showEmptyState('members-container', 'No members found in this group.');
        return;
      }

      container.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${members.map(m => `
              <tr>
                <td style="font-weight:500;">
                  ${m.user.name}
                  ${m.isAdmin ? '<span class="badge badge-success" style="margin-left:0.5rem;">Admin</span>' : ''}
                  ${m.leftAt ? '<span class="badge badge-danger" style="margin-left:0.5rem;">Left</span>' : ''}
                </td>
                <td>${m.user.email}</td>
                <td>${new Date(m.joinedAt).toLocaleDateString()}</td>
                <td>
                  ${!m.leftAt ? `<button class="btn btn-outline btn-sm btn-remove" data-userid="${m.userId}">Remove</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      container.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          if (confirm('Are you sure you want to remove this member?')) {
            const userId = e.target.getAttribute('data-userid');
            try {
              await api.delete(`/groups/${id}/members/${userId}`);
              ui.toast('Member removed');
              await loadMembers();
            } catch (err) {
              ui.toast(err.message, 'error');
            }
          }
        });
      });

    } catch (err) {
      ui.toast('Failed to load members', 'error');
    }
  };

  await loadMembers();

  const btnAdd = document.getElementById('btn-add-member');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => ui.showModal('modal-add-member'));
  }

  const btnClose = document.getElementById('btn-close-modal');
  if (btnClose) {
    btnClose.addEventListener('click', () => ui.hideModal('modal-add-member'));
  }

  const form = document.getElementById('form-add-member');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userId = document.getElementById('member-userId').value;

      try {
        await api.post(`/groups/${id}/members`, { userId });
        ui.toast('Member added successfully');
        ui.hideModal('modal-add-member');
        e.target.reset();
        await loadMembers();
      } catch (err) {
        ui.toast(err.message, 'error');
      }
    });
  }
}
