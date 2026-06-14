// public/js/main.js
import { router } from './router.js';
import { api } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  // Global interceptor for link clicks to use SPA router
  document.body.addEventListener('click', e => {
    if (e.target.matches('[data-link]')) {
      e.preventDefault();
      router.navigate(e.target.getAttribute('href'));
    } else if (e.target.closest('[data-link]')) {
      e.preventDefault();
      router.navigate(e.target.closest('[data-link]').getAttribute('href'));
    }
  });

  // Global logout handler
  document.body.addEventListener('click', e => {
    if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
      e.preventDefault();
      api.setToken(null);
      router.navigate('/login');
    }
  });

// Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    router.handleRoute();
  });

  document.getElementById('sidebar-group-selector').addEventListener('change', (e) => {
    if (e.target.value) {
      router.navigate(`/groups/${e.target.value}`);
    }
  });

  // Initial route
  router.handleRoute();
  loadSidebarGroups();
});

export async function loadSidebarGroups() {
  if (!api.getToken()) return;
  try {
    const res = await api.get('/groups');
    const select = document.getElementById('sidebar-group-selector');
    const currentVal = select.value;
    select.innerHTML = '<option value="">Select a group...</option>' + 
      (res.data || []).map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    select.value = currentVal;
  } catch (err) {}
}
