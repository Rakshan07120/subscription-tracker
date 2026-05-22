from flask import Flask, render_template, jsonify
from database import init_db

app = Flask(__name__)


@app.route('/')
def index():
    """Serve the main dashboard page."""
    return render_template('index.html')


@app.route('/health')
def health():
    """Quick health check — useful for debugging later."""
    return jsonify({"status": "ok", "message": "Subscription Tracker is running"})


# ── API routes will be added from Day 4 onwards ──────────────────────────────
# GET    /api/subscriptions        → list all
# POST   /api/subscriptions        → create new
# PUT    /api/subscriptions/<id>   → update
# DELETE /api/subscriptions/<id>   → delete


if __name__ == '__main__':
    init_db()           # create DB + tables on first run
    app.run(debug=True, port=5000)
