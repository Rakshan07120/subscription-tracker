// SubTrack — app.js  (complete)
// Features: CRUD, search, filter, sort, analytics, export, toast, modal

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
const state = {
  subscriptions: [],
  summary: {},
  currentView: 'dashboard',
  editingId: null,
  deletingId: null,
  searchTerm: '',
  filterStatus: 'all',
  sortBy: 'created_at',
};

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  setMonthBadge();
  initNav();
  initModal();
  initConfirmModal();
  initSearch();
  initExport();
  loadAll();
});

/* ═══════════════════════════════════════════
   DATA LOADING
═══════════════════════════════════════════ */
async function loadAll() {
  await Promise.all([loadSubscriptions(), loadSummary()]);
}

async function loadSubscriptions() {
  const params = new URLSearchParams({
    status: state.filterStatus,
    search: state.searchTerm,
    sort:   state.sortBy,
  });

  try {
    const res  = await fetch(`/api/subscriptions?${params}`);
    const data = await res.json();
    state.subscriptions = data;
    renderSubscriptions();
  } catch (e) {
    showToast('Failed to load subscriptions', 'error');
  }
}

async function loadSummary() {
  try {
    const res  = await fetch('/api/summary');
    state.summary = await res.json();
    renderSummary();
  } catch (e) {
    console.error('Summary load failed', e);
  }
}

/* ═══════════════════════════════════════════
   RENDER — SUMMARY CARDS
═══════════════════════════════════════════ */
function renderSummary() {
  const s = state.summary;
  setText('monthly-total', `₹${fmt(s.monthly_total ?? 0)}`);
  setText('yearly-total',  `₹${fmt(s.yearly_total  ?? 0)}`);
  setText('active-count',  s.active_count   ?? 0);
  setText('renewing-soon', s.renewing_soon  ?? 0);
}

/* ═══════════════════════════════════════════
   RENDER — SUBSCRIPTION CARDS
═══════════════════════════════════════════ */
function renderSubscriptions() {
  const list  = document.getElementById('subscription-list');
  const empty = document.getElementById('empty-state');
  const subs  = state.subscriptions;

  // Clear old cards (keep empty-state element)
  list.querySelectorAll('.sub-card').forEach(el => el.remove());

  if (subs.length === 0) {
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  subs.forEach((s, i) => {
    const card = buildCard(s);
    card.style.animationDelay = `${i * 0.04}s`;
    list.appendChild(card);
  });
}

function buildCard(s) {
  const card = document.createElement('div');
  card.className = 'sub-card';
  card.dataset.status = s.status;
  card.dataset.id = s.id;

  const color     = categoryColor(s.category);
  const initial   = s.name.charAt(0).toUpperCase();
  const badgeCls  = `badge-${s.category.toLowerCase()}`;
  const dotCls    = `dot-${s.status}`;
  const costFmt   = `₹${fmt(s.cost)}`;
  const renewalHtml = renewalDisplay(s.next_renewal);

  card.innerHTML = `
    <div class="sub-card-left">
      <div class="sub-avatar" style="--av-color:${color}">${initial}</div>
      <div class="sub-info">
        <p class="sub-name">${escHtml(s.name)}</p>
        <span class="sub-badge ${badgeCls}">${escHtml(s.category)}</span>
      </div>
    </div>
    <div class="sub-card-mid">
      <p class="sub-cycle">${s.billing_cycle}</p>
      ${renewalHtml}
    </div>
    <div class="sub-card-right">
      <p class="sub-cost">${costFmt}</p>
      <span class="status-dot ${dotCls}">${s.status}</span>
    </div>
    <div class="sub-card-actions">
      <button class="action-btn" data-action="edit" title="Edit">✎</button>
      <button class="action-btn action-del" data-action="delete" title="Delete">✕</button>
    </div>`;

  card.querySelector('[data-action="edit"]').addEventListener('click', () => openEditModal(s));
  card.querySelector('[data-action="delete"]').addEventListener('click', () => openConfirm(s));

  return card;
}

function renewalDisplay(dateStr) {
  if (!dateStr) return '<p class="sub-renewal">—</p>';
  const today    = new Date(); today.setHours(0,0,0,0);
  const renewal  = new Date(dateStr);
  const diffDays = Math.round((renewal - today) / 86400000);
  const label    = renewal.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  const cls      = diffDays <= 3 ? 'renewal-soon' : '';
  return `<p class="sub-renewal ${cls}">Renews ${label}</p>`;
}

/* ═══════════════════════════════════════════
   RENDER — ANALYTICS
═══════════════════════════════════════════ */
function renderAnalytics() {
  renderCategoryBars();
  renderRenewalList();
  renderBreakdownTable();
}

function renderCategoryBars() {
  const container = document.getElementById('cat-bars');
  const cats = state.summary.by_category || {};
  const entries = Object.entries(cats).sort((a,b) => b[1]-a[1]);
  const max = entries[0]?.[1] || 1;

  container.innerHTML = entries.map(([cat, val]) => `
    <div class="cat-bar-row">
      <div class="cat-bar-label">
        <span class="cat-bar-name">${cat}</span>
        <span class="cat-bar-val">₹${fmt(val)}/mo</span>
      </div>
      <div class="cat-bar-track">
        <div class="cat-bar-fill" style="width:${(val/max*100).toFixed(1)}%;background:${categoryColor(cat)}"></div>
      </div>
    </div>`).join('') || '<p style="color:var(--text-muted);font-size:13px">No data yet</p>';
}

function renderRenewalList() {
  const container = document.getElementById('renewal-list');
  const today = new Date(); today.setHours(0,0,0,0);

  const upcoming = state.subscriptions
    .filter(s => s.next_renewal && s.status === 'active')
    .map(s => {
      const d    = new Date(s.next_renewal);
      const diff = Math.round((d - today) / 86400000);
      return { ...s, diffDays: diff, dateObj: d };
    })
    .filter(s => s.diffDays >= 0)
    .sort((a,b) => a.diffDays - b.diffDays)
    .slice(0, 8);

  if (!upcoming.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No upcoming renewals</p>';
    return;
  }

  container.innerHTML = upcoming.map(s => {
    const label    = s.dateObj.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
    const daysCls  = s.diffDays <= 3 ? 'days-urgent' : s.diffDays <= 7 ? 'days-soon' : 'days-ok';
    const daysText = s.diffDays === 0 ? 'Today' : s.diffDays === 1 ? '1 day' : `${s.diffDays} days`;
    return `
      <div class="renewal-item">
        <div>
          <p class="renewal-name">${escHtml(s.name)}</p>
          <p class="renewal-date">${label} · ₹${fmt(s.cost)}</p>
        </div>
        <span class="renewal-days ${daysCls}">${daysText}</span>
      </div>`;
  }).join('');
}

function renderBreakdownTable() {
  const container = document.getElementById('breakdown-table');
  const subs = [...state.subscriptions].filter(s => s.status === 'active')
    .sort((a,b) => monthly(b) - monthly(a));

  if (!subs.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No active subscriptions</p>';
    return;
  }

  const header = `<div class="breakdown-row header">
    <span>Name</span><span class="bd-num">Cost</span>
    <span class="bd-num">Monthly</span><span class="bd-num">Yearly</span><span>Cycle</span>
  </div>`;

  const rows = subs.map(s => `
    <div class="breakdown-row">
      <span class="bd-name">${escHtml(s.name)}</span>
      <span class="bd-num">₹${fmt(s.cost)}</span>
      <span class="bd-num">₹${fmt(monthly(s))}</span>
      <span class="bd-num">₹${fmt(monthly(s)*12)}</span>
      <span>${s.billing_cycle}</span>
    </div>`).join('');

  container.innerHTML = header + rows;
}

function monthly(s) {
  if (s.billing_cycle === 'monthly') return s.cost;
  if (s.billing_cycle === 'yearly')  return s.cost / 12;
  if (s.billing_cycle === 'weekly')  return s.cost * 4.33;
  return s.cost;
}

/* ═══════════════════════════════════════════
   MODAL — ADD / EDIT
═══════════════════════════════════════════ */
function initModal() {
  document.getElementById('add-btn').addEventListener('click', openAddModal);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', handleSave);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeConfirm(); } });
}

function openAddModal() {
  state.editingId = null;
  document.getElementById('modal-title').textContent = 'Add Subscription';
  clearForm();
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('f-name').focus();
}

function openEditModal(s) {
  state.editingId = s.id;
  document.getElementById('modal-title').textContent = 'Edit Subscription';
  document.getElementById('f-id').value       = s.id;
  document.getElementById('f-name').value     = s.name;
  document.getElementById('f-category').value = s.category;
  document.getElementById('f-cost').value     = s.cost;
  document.getElementById('f-cycle').value    = s.billing_cycle;
  document.getElementById('f-renewal').value  = s.next_renewal || '';
  document.getElementById('f-status').value   = s.status;
  document.getElementById('f-notes').value    = s.notes || '';
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('f-name').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  clearForm();
  state.editingId = null;
}

function clearForm() {
  ['f-id','f-name','f-cost','f-renewal','f-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const cat = document.getElementById('f-category');
  if (cat) cat.value = 'Entertainment';
  const cyc = document.getElementById('f-cycle');
  if (cyc) cyc.value = 'monthly';
  const st = document.getElementById('f-status');
  if (st) st.value = 'active';
  document.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
}

async function handleSave() {
  const name  = document.getElementById('f-name').value.trim();
  const cost  = document.getElementById('f-cost').value.trim();
  let valid = true;

  if (!name) { document.getElementById('f-name').classList.add('error'); valid = false; }
  else         document.getElementById('f-name').classList.remove('error');

  if (!cost || isNaN(cost) || Number(cost) < 0) {
    document.getElementById('f-cost').classList.add('error'); valid = false;
  } else {
    document.getElementById('f-cost').classList.remove('error');
  }

  if (!valid) { showToast('Please fill all required fields', 'error'); return; }

  const payload = {
    name,
    category:      document.getElementById('f-category').value,
    cost:          parseFloat(cost),
    billing_cycle: document.getElementById('f-cycle').value,
    next_renewal:  document.getElementById('f-renewal').value || null,
    status:        document.getElementById('f-status').value,
    notes:         document.getElementById('f-notes').value.trim(),
  };

  try {
    const isEdit = !!state.editingId;
    const url    = isEdit ? `/api/subscriptions/${state.editingId}` : '/api/subscriptions';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.error || 'Save failed', 'error');
      return;
    }

    closeModal();
    showToast(isEdit ? 'Subscription updated' : 'Subscription added', 'success');
    await loadAll();
    if (state.currentView === 'analytics') renderAnalytics();
  } catch (e) {
    showToast('Network error', 'error');
  }
}

/* ═══════════════════════════════════════════
   MODAL — DELETE CONFIRM
═══════════════════════════════════════════ */
function initConfirmModal() {
  document.getElementById('confirm-close').addEventListener('click', closeConfirm);
  document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
  document.getElementById('confirm-delete').addEventListener('click', handleDelete);
  document.getElementById('confirm-overlay').addEventListener('click', e => {
    if (e.target.id === 'confirm-overlay') closeConfirm();
  });
}

function openConfirm(s) {
  state.deletingId = s.id;
  document.getElementById('confirm-name').textContent = s.name;
  document.getElementById('confirm-overlay').classList.add('open');
}

function closeConfirm() {
  document.getElementById('confirm-overlay').classList.remove('open');
  state.deletingId = null;
}

async function handleDelete() {
  if (!state.deletingId) return;
  try {
    const res = await fetch(`/api/subscriptions/${state.deletingId}`, { method: 'DELETE' });
    if (!res.ok) { showToast('Delete failed', 'error'); return; }
    closeConfirm();
    showToast('Subscription deleted', 'success');
    await loadAll();
    if (state.currentView === 'analytics') renderAnalytics();
  } catch (e) {
    showToast('Network error', 'error');
  }
}

/* ═══════════════════════════════════════════
   SEARCH, FILTER, SORT
═══════════════════════════════════════════ */
function initSearch() {
  const searchInput  = document.getElementById('search-input');
  const filterSelect = document.getElementById('filter-status');
  const sortSelect   = document.getElementById('sort-select');

  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.searchTerm = searchInput.value.trim();
      loadSubscriptions();
    }, 300);
  });

  filterSelect.addEventListener('change', () => {
    state.filterStatus = filterSelect.value;
    loadSubscriptions();
  });

  sortSelect.addEventListener('change', () => {
    state.sortBy = sortSelect.value;
    loadSubscriptions();
  });
}

/* ═══════════════════════════════════════════
   NAVIGATION (Dashboard / Analytics)
═══════════════════════════════════════════ */
function initNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const view = link.dataset.view;
      switchView(view);
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function switchView(view) {
  state.currentView = view;
  document.getElementById('view-dashboard').classList.toggle('hidden', view !== 'dashboard');
  document.getElementById('view-analytics').classList.toggle('hidden', view !== 'analytics');
  if (view === 'analytics') renderAnalytics();
}

/* ═══════════════════════════════════════════
   EXPORT
═══════════════════════════════════════════ */
function initExport() {
  const btn  = document.getElementById('export-btn');
  const menu = document.getElementById('export-menu');

  btn.addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => menu.classList.add('hidden'));

  document.getElementById('export-json').addEventListener('click', () => {
    window.location.href = '/api/export/json';
    menu.classList.add('hidden');
  });

  document.getElementById('export-csv').addEventListener('click', () => {
    window.location.href = '/api/export/csv';
    menu.classList.add('hidden');
  });
}

/* ═══════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════ */
function setMonthBadge() {
  const el = document.getElementById('current-month');
  if (el) el.textContent = new Date().toLocaleDateString('en-IN', { month:'long', year:'numeric' });
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function fmt(n) {
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const CAT_COLORS = {
  entertainment: '#3d8ef0', music: '#1db954', tools: '#e8a838',
  cloud: '#a78bfa', news: '#f97316', fitness: '#2ec97a',
  education: '#06b6d4', other: '#64748b',
};

function categoryColor(cat) {
  return CAT_COLORS[cat?.toLowerCase()] || '#64748b';
}

let toastTimer;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast${type ? ' ' + type : ''}`;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}
