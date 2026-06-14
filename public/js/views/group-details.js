// public/js/views/group-details.js
import { router } from '../router.js';

export async function render({ id }) {
  // Redirect to expenses by default when clicking "View" on a group
  setTimeout(() => {
    router.navigate(`/groups/${id}/expenses`);
  }, 0);
  return `<div class="loader-container"><div class="spinner"></div></div>`;
}

export async function init() {}
