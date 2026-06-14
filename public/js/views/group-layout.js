// public/js/views/group-layout.js
import { api } from '../api.js';

let groupCache = {};

export async function getGroupLayout(groupId, activeTab) {
  let group = groupCache[groupId];
  if (!group) {
    try {
      const res = await api.get(`/groups/${groupId}`);
      group = res.data;
      groupCache[groupId] = group;
    } catch (err) {
      return `<div class="error-state">Group not found or access denied.</div>`;
    }
  }

  const tabs = [
    { id: 'members', label: 'Members', path: `/groups/${groupId}/members` },
    { id: 'expenses', label: 'Expenses', path: `/groups/${groupId}/expenses` },
    { id: 'settlements', label: 'Settlements', path: `/groups/${groupId}/settlements` },
    { id: 'balances', label: 'Balances', path: `/groups/${groupId}/balances` },
    { id: 'imports', label: 'CSV Imports', path: `/groups/${groupId}/imports` }
  ];

  const tabsHtml = tabs.map(t => 
    `<a href="${t.path}" data-link class="tab-item ${activeTab === t.id ? 'active' : ''}">${t.label}</a>`
  ).join('');

  return `
    <div class="page-header" style="margin-bottom: 1.5rem;">
      <a href="/groups" data-link style="color:var(--text-muted); text-decoration:none; font-size:0.875rem;">← Back to Groups</a>
      <h2 class="page-title" style="margin: 0.5rem 0 0 0;">${group.name} <span class="badge badge-success">${group.baseCurrency}</span></h2>
    </div>
    <div class="tabs">
      ${tabsHtml}
    </div>
  `;
}
