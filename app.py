from flask import Flask, render_template, jsonify, request
from database import init_db, get_connection
from datetime import datetime, timedelta
import math

app = Flask(__name__)


# ── Pages ─────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


# ── API: List & Create ─────────────────────────────────────────────────────────

@app.route('/api/subscriptions', methods=['GET'])
def get_subscriptions():
    status   = request.args.get('status', 'all')
    search   = request.args.get('search', '').strip()
    sort_by  = request.args.get('sort', 'created_at')
    order    = request.args.get('order', 'desc')

    allowed_sorts  = {'created_at', 'name', 'cost', 'next_renewal'}
    allowed_orders = {'asc', 'desc'}
    if sort_by not in allowed_sorts:  sort_by = 'created_at'
    if order   not in allowed_orders: order   = 'desc'

    query  = "SELECT * FROM subscriptions WHERE 1=1"
    params = []

    if status != 'all':
        query += " AND status = ?"
        params.append(status)

    if search:
        query += " AND (name LIKE ? OR category LIKE ? OR notes LIKE ?)"
        like = f"%{search}%"
        params.extend([like, like, like])

    query += f" ORDER BY {sort_by} {order.upper()}"

    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()

    return jsonify([dict(r) for r in rows])


@app.route('/api/subscriptions', methods=['POST'])
def create_subscription():
    data = request.get_json()

    required = ['name', 'cost', 'billing_cycle']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'"{field}" is required'}), 400

    try:
        cost = float(data['cost'])
        if cost < 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({'error': 'cost must be a positive number'}), 400

    with get_connection() as conn:
        cur = conn.execute(
            """INSERT INTO subscriptions
               (name, category, cost, currency, billing_cycle, next_renewal, status, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data['name'].strip(),
                data.get('category', 'Other'),
                cost,
                data.get('currency', 'INR'),
                data['billing_cycle'],
                data.get('next_renewal') or None,
                data.get('status', 'active'),
                data.get('notes', '').strip() or None,
            )
        )
        conn.commit()
        new = conn.execute("SELECT * FROM subscriptions WHERE id = ?", (cur.lastrowid,)).fetchone()

    return jsonify(dict(new)), 201


# ── API: Read, Update, Delete single ──────────────────────────────────────────

@app.route('/api/subscriptions/<int:sub_id>', methods=['GET'])
def get_subscription(sub_id):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM subscriptions WHERE id = ?", (sub_id,)).fetchone()
    if not row:
        return jsonify({'error': 'Subscription not found'}), 404
    return jsonify(dict(row))


@app.route('/api/subscriptions/<int:sub_id>', methods=['PUT'])
def update_subscription(sub_id):
    data = request.get_json()

    with get_connection() as conn:
        existing = conn.execute("SELECT * FROM subscriptions WHERE id = ?", (sub_id,)).fetchone()
        if not existing:
            return jsonify({'error': 'Subscription not found'}), 404

        fields = {
            'name':          data.get('name',          existing['name']),
            'category':      data.get('category',      existing['category']),
            'cost':          data.get('cost',          existing['cost']),
            'currency':      data.get('currency',      existing['currency']),
            'billing_cycle': data.get('billing_cycle', existing['billing_cycle']),
            'next_renewal':  data.get('next_renewal',  existing['next_renewal']),
            'status':        data.get('status',        existing['status']),
            'notes':         data.get('notes',         existing['notes']),
            'updated_at':    datetime.now().isoformat(),
        }

        conn.execute(
            """UPDATE subscriptions SET
               name=?, category=?, cost=?, currency=?, billing_cycle=?,
               next_renewal=?, status=?, notes=?, updated_at=?
               WHERE id=?""",
            (*fields.values(), sub_id)
        )
        conn.commit()
        updated = conn.execute("SELECT * FROM subscriptions WHERE id = ?", (sub_id,)).fetchone()

    return jsonify(dict(updated))


@app.route('/api/subscriptions/<int:sub_id>', methods=['DELETE'])
def delete_subscription(sub_id):
    with get_connection() as conn:
        existing = conn.execute("SELECT * FROM subscriptions WHERE id = ?", (sub_id,)).fetchone()
        if not existing:
            return jsonify({'error': 'Subscription not found'}), 404
        conn.execute("DELETE FROM subscriptions WHERE id = ?", (sub_id,))
        conn.commit()
    return jsonify({'message': 'Deleted successfully'})


# ── API: Summary / Analytics ───────────────────────────────────────────────────

@app.route('/api/summary')
def get_summary():
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM subscriptions WHERE status = 'active'"
        ).fetchall()

    monthly_total = 0
    for r in rows:
        if r['billing_cycle'] == 'monthly':
            monthly_total += r['cost']
        elif r['billing_cycle'] == 'yearly':
            monthly_total += r['cost'] / 12
        elif r['billing_cycle'] == 'weekly':
            monthly_total += r['cost'] * 4.33

    soon_cutoff = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
    today_str   = datetime.now().strftime('%Y-%m-%d')

    renewing_soon = sum(
        1 for r in rows
        if r['next_renewal'] and today_str <= r['next_renewal'] <= soon_cutoff
    )

    # Category breakdown
    cat_totals = {}
    for r in rows:
        cat = r['category']
        cost = r['cost']
        if r['billing_cycle'] == 'yearly':  cost /= 12
        elif r['billing_cycle'] == 'weekly': cost *= 4.33
        cat_totals[cat] = round(cat_totals.get(cat, 0) + cost, 2)

    return jsonify({
        'monthly_total':  round(monthly_total, 2),
        'yearly_total':   round(monthly_total * 12, 2),
        'active_count':   len(rows),
        'renewing_soon':  renewing_soon,
        'by_category':    cat_totals,
    })


# ── API: Export ────────────────────────────────────────────────────────────────

@app.route('/api/export/json')
def export_json():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM subscriptions").fetchall()
    return jsonify([dict(r) for r in rows])


@app.route('/api/export/csv')
def export_csv():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM subscriptions").fetchall()

    lines = ['id,name,category,cost,currency,billing_cycle,next_renewal,status,notes,created_at']
    for r in rows:
        lines.append(
            f'{r["id"]},"{r["name"]}","{r["category"]}",{r["cost"]},{r["currency"]},'
            f'{r["billing_cycle"]},{r["next_renewal"] or ""},"{r["status"]}","'
            f'{r["notes"] or ""}",{r["created_at"]}'
        )

    from flask import Response
    return Response(
        '\n'.join(lines),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=subscriptions.csv'}
    )


# ── Health ─────────────────────────────────────────────────────────────────────

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
