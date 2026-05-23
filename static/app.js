// ═══════════════════════════════════════════════
//  SubTrack — app.js  (Day 2: UI wiring)
//  API calls will be added Day 5.
//  For now: mock data so the UI looks real.
// ═══════════════════════════════════════════════

// ── Mock data (replaced by API on Day 5) ────────
const MOCK_SUBS = [
    { id: 1, name: 'Netflix',    category: 'Streaming',    cost: 649,  currency: 'INR', billing_cycle: 'monthly', next_renewal: '2026-06-05', status: 'active'   },
    { id: 2, name: 'Spotify',    category: 'Music',        cost: 119,  currency: 'INR', billing_cycle: 'monthly', next_renewal: '2026-05-28', status: 'active'   },
    { id: 3, name: 'iCloud',     category: 'Cloud',        cost: 75,   currency: 'INR', billing_cycle: 'monthly', next_renewal: '2026-05-25', status: 'active'   },
    { id: 4, name: 'Notion',     category: 'Productivity', cost: 1600, currency: 'INR', billing_cycle: 'yearly',  next_renewal: '2027-01-10', status: 'active'   },
    { id: 5, name: 'Amazon Prime',category:'Streaming',    cost: 1499, currency: 'INR', billing_cycle: 'yearly',  next_renewal: '2026-11-20', status: 'paused'   },
];

// ── State ────────────────────────────────────────
let subscriptions = [...MOCK_SUBS];
let editingId = null;

// ── Init ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    renderAll();
    bindEvents();
});

// ── Date helper ──────────────────────────────────
function setCurrentDate() {
    const now = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent =
        now.toLocaleDateString('en-IN', opts);
}

// ── Render everything ────────────────────────────
function renderAll() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const cat    = document.getElementById('filter-category').value;

    const filtered = subscriptions.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search) ||
                            s.category.toLowerCase().includes(search);
        const matchCat    = cat === 'all' || s.category === cat;
        return matchSearch && matchCat;
    });

    renderList(filtered);
    updateSummary(subscriptions);   // summary always uses full list
}

// ── Render subscription rows ─────────────────────
function renderList(subs) {
    const list  = document.getElementById('subscription-list');
    const empty = document.getElementById('empty-state');

    // Clear existing rows (keep empty-state element)
    [...list.querySelectorAll('.sub-row')].forEach(r => r.remove());

    if (subs.length === 0) {
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    subs.forEach(sub => {
        const row = buildRow(sub);
        list.appendChild(row);
    });
}

function buildRow(sub) {
    const row = document.createElement('div');
    row.className = 'sub-row';
    row.dataset.id = sub.id;

    const renewalLabel = formatRenewal(sub.next_renewal);
    const isSoon = daysUntil(sub.next_renewal) <= 7;

    row.innerHTML = `
        <div class="sub-name">
            <div class="sub-avatar">${sub.name.charAt(0)}</div>
            ${sub.name}
        </div>
        <div><span class="cat-pill">${sub.category}</span></div>
        <div class="sub-cost">₹${sub.cost.toLocaleString('en-IN')}</div>
        <div class="sub-text">${capitalise(sub.billing_cycle)}</div>
        <div class="sub-renewal ${isSoon ? 'soon' : ''}">${renewalLabel}</div>
        <div><span class="status-badge status-${sub.status}">${capitalise(sub.status)}</span></div>
        <div class="row-actions">
            <button class="icon-btn edit-btn" title="Edit">✎</button>
            <button class="icon-btn del delete-btn" title="Delete">✕</button>
        </div>
    `;

    row.querySelector('.edit-btn').addEventListener('click', () => openModal(sub.id));
    row.querySelector('.delete-btn').addEventListener('click', () => deleteSub(sub.id));

    return row;
}

// ── Summary cards ────────────────────────────────
function updateSummary(subs) {
    const active  = subs.filter(s => s.status === 'active');
    const soon    = subs.filter(s => s.status === 'active' && daysUntil(s.next_renewal) <= 7);

    // Normalise all costs to monthly equivalent
    const monthly = active.reduce((sum, s) => {
        if (s.billing_cycle === 'yearly')  return sum + s.cost / 12;
        if (s.billing_cycle === 'weekly')  return sum + s.cost * 4.33;
        return sum + s.cost;
    }, 0);

    const yearly = monthly * 12;

    document.getElementById('monthly-total').textContent = `₹${Math.round(monthly).toLocaleString('en-IN')}`;
    document.getElementById('yearly-total').textContent  = `₹${Math.round(yearly).toLocaleString('en-IN')}`;
    document.getElementById('active-count').textContent  = active.length;
    document.getElementById('renewing-soon').textContent = soon.length;
    document.getElementById('active-label').textContent  = `${active.length} active`;
}

// ── Modal ─────────────────────────────────────────
function openModal(id = null) {
    editingId = id;
    const overlay = document.getElementById('modal-overlay');
    const title   = document.getElementById('modal-title');

    if (id) {
        const sub = subscriptions.find(s => s.id === id);
        title.textContent = 'Edit Subscription';
        document.getElementById('f-name').value     = sub.name;
        document.getElementById('f-category').value = sub.category;
        document.getElementById('f-cost').value     = sub.cost;
        document.getElementById('f-billing').value  = sub.billing_cycle;
        document.getElementById('f-renewal').value  = sub.next_renewal || '';
        document.getElementById('f-status').value   = sub.status;
        document.getElementById('f-notes').value    = sub.notes || '';
    } else {
        title.textContent = 'Add Subscription';
        ['f-name','f-cost','f-renewal','f-notes'].forEach(id => {
            document.getElementById(id).value = '';
        });
        document.getElementById('f-category').value = 'Streaming';
        document.getElementById('f-billing').value  = 'monthly';
        document.getElementById('f-status').value   = 'active';
    }

    overlay.classList.add('open');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    editingId = null;
}

function saveSub() {
    const name = document.getElementById('f-name').value.trim();
    const cost = parseFloat(document.getElementById('f-cost').value);

    if (!name) { showToast('Service name is required'); return; }
    if (isNaN(cost) || cost < 0) { showToast('Enter a valid cost'); return; }

    const data = {
        name,
        category:     document.getElementById('f-category').value,
        cost,
        billing_cycle:document.getElementById('f-billing').value,
        next_renewal: document.getElementById('f-renewal').value || null,
        status:       document.getElementById('f-status').value,
        notes:        document.getElementById('f-notes').value.trim(),
    };

    if (editingId) {
        // Update existing
        const idx = subscriptions.findIndex(s => s.id === editingId);
        subscriptions[idx] = { ...subscriptions[idx], ...data };
        showToast('Subscription updated ✓');
    } else {
        // Add new
        const newId = Math.max(0, ...subscriptions.map(s => s.id)) + 1;
        subscriptions.push({ id: newId, currency: 'INR', ...data });
        showToast('Subscription added ✓');
    }

    closeModal();
    renderAll();
}

function deleteSub(id) {
    subscriptions = subscriptions.filter(s => s.id !== id);
    renderAll();
    showToast('Subscription removed');
}

// ── Event bindings ────────────────────────────────
function bindEvents() {
    document.getElementById('add-btn').addEventListener('click', () => openModal());
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-save').addEventListener('click', saveSub);
    document.getElementById('modal-overlay').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
    });
    document.getElementById('search-input').addEventListener('input', renderAll);
    document.getElementById('filter-category').addEventListener('change', renderAll);
}

// ── Utility ───────────────────────────────────────
function daysUntil(dateStr) {
    if (!dateStr) return Infinity;
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatRenewal(dateStr) {
    if (!dateStr) return '—';
    const d = daysUntil(dateStr);
    if (d < 0)  return 'Overdue';
    if (d === 0) return 'Today';
    if (d <= 7)  return `In ${d}d ⚡`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

function capitalise(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}