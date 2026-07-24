-- SQL Schema for Cloudflare D1 Database

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS memberships (
    id TEXT PRIMARY KEY,
    name TEXT,
    price REAL,
    billing TEXT,
    features TEXT, -- JSON-stringified array
    popular INTEGER, -- 0 or 1
    badge TEXT
);

CREATE TABLE IF NOT EXISTS trainers (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    image TEXT,
    specialties TEXT,
    bio TEXT
);

CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    title TEXT,
    subtitle TEXT,
    price TEXT,
    badge TEXT,
    features TEXT, -- JSON-stringified array
    whatsappText TEXT,
    active INTEGER -- 0 or 1
);

CREATE TABLE IF NOT EXISTS testimonials (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    content TEXT,
    rating INTEGER,
    avatar TEXT
);

CREATE TABLE IF NOT EXISTS gallery (
    id TEXT PRIMARY KEY,
    url TEXT,
    category TEXT,
    title TEXT,
    type TEXT DEFAULT 'image',
    created_at INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT,
    time TEXT,
    location TEXT,
    posterUrl TEXT,
    category TEXT,
    type TEXT DEFAULT 'event',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vapid_keys (
    id TEXT PRIMARY KEY DEFAULT 'default',
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL,
    subject TEXT DEFAULT 'mailto:admin@anfitness.in'
);

CREATE TABLE IF NOT EXISTS admin_users (
    username TEXT PRIMARY KEY,
    passwordHash TEXT
);

-- Seed Initial Default Admin User
-- Username: admin, Password: admin123 (hashed with bcrypt)
INSERT OR REPLACE INTO admin_users (username, passwordHash) VALUES ('admin', '$2a$10$wo25IyiDxc3uq.hW1vCPseKKYE/4wVdHdKi7w3MqYoL8On9SCbFkS');

