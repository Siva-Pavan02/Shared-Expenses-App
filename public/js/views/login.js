// public/js/views/login.js
import { api } from '../api.js';
import { router } from '../router.js';
import { ui } from '../ui.js';

export async function render() {
  document.getElementById('app-navbar').style.display = 'none';
  document.getElementById('app-sidebar').style.display = 'none';

  return `
    <div style="max-width: 400px; margin: 4rem auto; background: var(--card-bg); padding: 2rem; border-radius: var(--radius); box-shadow: var(--shadow-md);">
      <h2 style="text-align: center; color: var(--primary); margin-bottom: 2rem;">Shared Expenses App</h2>
      
      <form id="login-form">
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="email" class="form-control" required placeholder="aisha@example.com">
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="password" class="form-control" required placeholder="password123">
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
      </form>

      <div style="margin-top: 2rem; padding: 1rem; background: var(--bg-color); border-radius: var(--radius); font-size: 0.875rem;">
        <strong>Demo Account:</strong><br>
        Email: aisha@example.com<br>
        Password: password123
      </div>
    </div>
  `;
}

export async function init() {
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await api.post('/auth/login', { email, password });
      api.setToken(res.data.token);
      ui.toast('Login successful');
      router.navigate('/dashboard');
    } catch (err) {
      ui.toast(err.message, 'error');
    }
  });
}
