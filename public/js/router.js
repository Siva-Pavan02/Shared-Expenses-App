// public/js/router.js
import { api } from './api.js';

const routes = {
  '/': { view: 'login', protected: false },
  '/login': { view: 'login', protected: false },
  '/dashboard': { view: 'dashboard', protected: true },
  '/groups': { view: 'groups', protected: true },
};

// Patterns for dynamic routes
const dynamicRoutes = [
  { pattern: /^\/groups\/([a-zA-Z0-9-]+)$/, view: 'group-details', protected: true },
  { pattern: /^\/groups\/([a-zA-Z0-9-]+)\/members$/, view: 'members', protected: true },
  { pattern: /^\/groups\/([a-zA-Z0-9-]+)\/expenses$/, view: 'expenses', protected: true },
  { pattern: /^\/groups\/([a-zA-Z0-9-]+)\/settlements$/, view: 'settlements', protected: true },
  { pattern: /^\/groups\/([a-zA-Z0-9-]+)\/balances$/, view: 'balances', protected: true },
  { pattern: /^\/groups\/([a-zA-Z0-9-]+)\/imports$/, view: 'imports', protected: true },
  { pattern: /^\/groups\/([a-zA-Z0-9-]+)\/imports\/([a-zA-Z0-9-]+)\/anomalies$/, view: 'anomalies', protected: true },
];

export const router = {
  async navigate(path) {
    window.history.pushState({}, '', path);
    await this.handleRoute();
  },

  async handleRoute() {
    const path = window.location.pathname;
    let match = routes[path];
    let params = {};

    if (!match) {
      for (const route of dynamicRoutes) {
        const regexMatch = path.match(route.pattern);
        if (regexMatch) {
          match = route;
          // Capture ID (e.g. groupId or importId)
          params.id = regexMatch[1];
          if (regexMatch[2]) {
             params.importId = regexMatch[2];
          }
          break;
        }
      }
    }

    if (!match) {
      // Fallback
      match = routes['/dashboard'];
    }

    const token = api.getToken();
    if (match.protected && !token) {
      this.navigate('/login');
      return;
    }

    if (path === '/login' && token) {
      this.navigate('/dashboard');
      return;
    }

    await this.loadView(match.view, params);
  },

  async loadView(viewName, params) {
    const appContainer = document.getElementById('app');
    
    // Clear current content
    appContainer.innerHTML = `<div class="loader-container"><div class="spinner"></div></div>`;

    try {
      // Dynamically import the view module
      const module = await import(`./views/${viewName}.js`);
      
      // Render HTML template
      appContainer.innerHTML = await module.render(params);
      
      // Execute logic (event listeners, API fetching)
      if (module.init) {
        await module.init(params);
      }
      
      // Update sidebar active states
      this.updateSidebar(viewName);

    } catch (err) {
      console.error('Error loading view:', err);
      appContainer.innerHTML = `<div class="error-state">Failed to load view.</div>`;
    }
  },

  updateSidebar(viewName) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('active');
      if (el.getAttribute('data-view') === viewName || 
          (viewName !== 'dashboard' && viewName !== 'groups' && el.getAttribute('data-view') === 'groups' && viewName !== 'login')) {
        // Just highlighting the Groups tab if we are in group details
        // We will make it simpler: exactly match data-view
      }
    });

    const activeEl = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeEl) {
      activeEl.classList.add('active');
    } else if (viewName !== 'login' && viewName !== 'dashboard') {
      const groupsEl = document.querySelector(`.nav-item[data-view="groups"]`);
      if (groupsEl) groupsEl.classList.add('active');
    }
  }
};
