import sqlite3
import os

DB_PATH     = os.path.join(os.path.dirname(__file__), 'subscriptions.db')
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), 'schema.sql')


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_connection() as conn:
        with open(SCHEMA_PATH, 'r') as f:
            conn.executescript(f.read())
    print(f"[DB] Initialized at {DB_PATH}")


if __name__ == '__main__':
    init_db()
