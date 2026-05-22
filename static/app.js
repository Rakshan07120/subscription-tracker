// app.js — SubTrack frontend logic
// Day 5 will wire this to the Flask API. For now, placeholder structure.

document.addEventListener('DOMContentLoaded', () => {
    console.log('[SubTrack] App initialised');

    // Entry point — will call API in Day 5
    initDashboard();
});

function initDashboard() {
    // Placeholder: will fetch from /api/subscriptions
    updateSummary({ monthly: 0, yearly: 0, active: 0, renewingSoon: 0 });
}

function updateSummary({ monthly, yearly, active, renewingSoon }) {
    document.getElementById('monthly-total').textContent = `₹${monthly.toLocaleString('en-IN')}`;
    document.getElementById('yearly-total').textContent  = `₹${yearly.toLocaleString('en-IN')}`;
    document.getElementById('active-count').textContent  = active;
    document.getElementById('renewing-soon').textContent = renewingSoon;
}
