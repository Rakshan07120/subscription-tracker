-- Subscription Tracker Database Schema
-- Run once to initialize the database

CREATE TABLE IF NOT EXISTS subscriptions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'Other',
    cost        REAL NOT NULL,
    currency    TEXT NOT NULL DEFAULT 'INR',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',  -- monthly, yearly, weekly
    next_renewal  TEXT,                              -- ISO date: YYYY-MM-DD
    status      TEXT NOT NULL DEFAULT 'active',     -- active, paused, cancelled
    notes       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for fast lookups by status and renewal date
CREATE INDEX IF NOT EXISTS idx_status       ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_next_renewal ON subscriptions(next_renewal);
