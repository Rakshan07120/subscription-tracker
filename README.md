# SubTrack — Subscription Tracker

A clean, full-stack web app to track all your subscriptions, monitor monthly and yearly spend, and never miss a renewal date.

Built with **HTML · CSS · JavaScript** on the frontend and **Python Flask + SQLite** on the backend.

---

## Features

- **Dashboard** — summary cards showing monthly spend, yearly spend, active count, renewals due soon
- **Add / Edit / Delete** subscriptions with a smooth modal form
- **Search** by name, category, or notes in real time
- **Filter** by status (active / paused / cancelled)
- **Sort** by newest, name, cost, or renewal date
- **Analytics view** — category spend bars, upcoming renewals, full cost breakdown table
- **Export** — download all data as JSON or CSV
- **Renewal alerts** — highlights subscriptions renewing within 7 days
- Fully **responsive** — works on mobile

---

## Tech Stack

| Layer    | Technology            |
|----------|-----------------------|
| Frontend | HTML, CSS, JavaScript |
| Backend  | Python 3, Flask       |
| Database | SQLite                |

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

The database (`subscriptions.db`) is created automatically on first run.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | List all (supports `?status=`, `?search=`, `?sort=`) |
| POST | `/api/subscriptions` | Create a new subscription |
| GET | `/api/subscriptions/<id>` | Get one subscription |
| PUT | `/api/subscriptions/<id>` | Update a subscription |
| DELETE | `/api/subscriptions/<id>` | Delete a subscription |
| GET | `/api/summary` | Dashboard summary + category totals |
| GET | `/api/export/json` | Export all data as JSON |
| GET | `/api/export/csv` | Export all data as CSV |

---

## Project Structure

```
subscription-tracker/
├── app.py           # Flask app + all API routes
├── database.py      # DB connection & init
├── schema.sql       # SQLite table definitions
├── requirements.txt
├── static/
│   ├── style.css    # Complete design system
│   └── app.js       # Full frontend logic
└── templates/
    └── index.html   # Dashboard + Analytics UI
```

---

## License

MIT
