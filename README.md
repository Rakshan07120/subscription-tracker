# SubTrack — Subscription Tracker

A web app to track all your subscriptions, monitor monthly spend, and never miss a renewal.

Built with **HTML · CSS · JavaScript** on the frontend and **Python Flask + SQLite** on the backend — designed to later be ported into a mobile app.

---

## Features (roadmap)

- [x] Project scaffold & database schema
- [ ] Dashboard UI with subscription cards
- [ ] Add / edit / delete subscriptions
- [ ] Monthly & yearly spend summary
- [ ] Renewal date tracking & alerts
- [ ] Search, filter, and sort
- [ ] CSV / JSON export

---

## Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | HTML, CSS, JavaScript   |
| Backend  | Python 3, Flask         |
| Database | SQLite                  |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/subscription-tracker.git
cd subscription-tracker
```

### 2. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate        # Mac / Linux
venv\Scripts\activate           # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the app

```bash
python app.py
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## Project Structure

```
subscription-tracker/
├── app.py           # Flask app & route handlers
├── database.py      # DB connection & init helpers
├── schema.sql       # SQLite table definitions
├── requirements.txt
├── static/
│   ├── style.css    # All styles
│   └── app.js       # Frontend logic
└── templates/
    └── index.html   # Main dashboard page
```

---

## Database Schema

```sql
subscriptions (
  id, name, category, cost, currency,
  billing_cycle, next_renewal, status, notes,
  created_at, updated_at
)
```

---

## License

MIT
