// public/js/ui.js

export const ui = {
  toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;

    container.appendChild(toast);

    // Fade out after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('active');
    }
  },

  hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
    }
  },

  showLoader(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `<div class="loader-container"><div class="spinner"></div></div>`;
    }
  },

  showEmptyState(containerId, message, actionText = null, actionCallback = null) {
    const container = document.getElementById(containerId);
    if (container) {
      let html = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <h3>No data found</h3>
          <p>${message}</p>
      `;
      if (actionText) {
        html += `<button class="btn btn-primary mt-4" id="empty-action-btn">${actionText}</button>`;
      }
      html += `</div>`;
      container.innerHTML = html;

      if (actionText && actionCallback) {
        document.getElementById('empty-action-btn').addEventListener('click', actionCallback);
      }
    }
  },

  renderTable(containerId, columns, data, renderRow) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0) {
      this.showEmptyState(containerId, "There's nothing here yet.");
      return;
    }

    let html = `
      <table class="table">
        <thead>
          <tr>
            ${columns.map(c => `<th>${c}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach(item => {
      html += renderRow(item);
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }
};
