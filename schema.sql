-- SubTrack Database Schema
CREATE TABLE IF NOT EXISTS subscriptions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    category      TEXT    NOT NULL DEFAULT 'Other',
    cost          REAL    NOT NULL,
    currency      TEXT    NOT NULL DEFAULT 'INR',
    billing_cycle TEXT    NOT NULL DEFAULT 'monthly',
    next_renewal  TEXT,
    status        TEXT    NOT NULL DEFAULT 'active',
    notes         TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_status       ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_next_renewal ON subscriptions(next_renewal);
