-- Schema for Vehicle Expense, Fillup & Service Tracker with Multi-User Authentication

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    trim TEXT,
    engine TEXT,
    vin TEXT,
    license_plate TEXT,
    fuel_type TEXT NOT NULL DEFAULT 'Gasoline', -- Gasoline, Diesel, Hybrid, Electric, E85
    tank_capacity REAL, -- in fuel_unit (gal or L)
    odometer_unit TEXT NOT NULL DEFAULT 'mi', -- mi, km
    fuel_unit TEXT NOT NULL DEFAULT 'gal', -- gal, L
    currency TEXT NOT NULL DEFAULT 'USD', -- USD, EUR, CAD, GBP, etc.
    purchase_date TEXT,
    purchase_price REAL,
    purchase_odometer REAL,
    is_active INTEGER NOT NULL DEFAULT 1,
    photo_url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user ON vehicles (user_id);

CREATE TABLE IF NOT EXISTS fillups (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    date TEXT NOT NULL,
    odometer REAL NOT NULL,
    gallons REAL NOT NULL,
    price_per_unit REAL NOT NULL,
    total_cost REAL NOT NULL,
    is_full_tank INTEGER NOT NULL DEFAULT 1,
    is_missed INTEGER NOT NULL DEFAULT 0,
    fuel_grade TEXT DEFAULT 'Regular', -- Regular, Midgrade, Premium, Diesel, E85
    station TEXT,
    latitude REAL,
    longitude REAL,
    notes TEXT,
    receipt_image TEXT,
    calculated_mpg REAL,
    calculated_cost_per_unit_distance REAL,
    distance_traveled REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fillups_vehicle_date ON fillups (vehicle_id, odometer ASC);

CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    date TEXT NOT NULL,
    odometer REAL NOT NULL,
    service_type TEXT NOT NULL, -- Oil Change, Brake Service, Tire Rotation, Spark Plugs, Battery, Transmission, Coolant, Inspection, Repair, Other
    title TEXT NOT NULL,
    description TEXT,
    parts_cost REAL NOT NULL DEFAULT 0,
    labor_cost REAL NOT NULL DEFAULT 0,
    total_cost REAL NOT NULL DEFAULT 0,
    is_diy INTEGER NOT NULL DEFAULT 0,
    service_provider TEXT,
    receipt_image TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_services_vehicle_date ON services (vehicle_id, date DESC);

-- User parts inventory (oil, filters, fluids, etc.)
CREATE TABLE IF NOT EXISTS parts_inventory (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    unit TEXT NOT NULL DEFAULT 'each',
    package_size TEXT,
    unit_cost REAL NOT NULL DEFAULT 0,
    quantity_on_hand REAL NOT NULL DEFAULT 0,
    low_stock_threshold REAL,
    part_number TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parts_inventory_user ON parts_inventory (user_id);

-- Parts consumed on a service record (from inventory or ad-hoc)
CREATE TABLE IF NOT EXISTS service_parts (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    inventory_item_id TEXT,
    name TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit_cost REAL NOT NULL DEFAULT 0,
    total_cost REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES parts_inventory(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_service_parts_service ON service_parts (service_id);

CREATE TABLE IF NOT EXISTS service_reminders (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    service_type TEXT NOT NULL,
    title TEXT NOT NULL,
    interval_miles REAL,
    interval_months INTEGER,
    last_serviced_odometer REAL,
    last_serviced_date TEXT,
    next_due_odometer REAL,
    next_due_date TEXT,
    is_dismissed INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminders_vehicle ON service_reminders (vehicle_id);

CREATE TABLE IF NOT EXISTS upgrades (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    date TEXT NOT NULL,
    odometer REAL,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- Performance, Suspension, Exterior, Interior, Lighting, Audio/Tech, Exhaust, Wheels/Tires, Other
    brand_part_number TEXT,
    vendor TEXT,
    part_cost REAL NOT NULL DEFAULT 0,
    labor_cost REAL NOT NULL DEFAULT 0,
    total_cost REAL NOT NULL DEFAULT 0,
    is_installed INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    photo_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_upgrades_vehicle ON upgrades (vehicle_id, date DESC);

CREATE TABLE IF NOT EXISTS other_expenses (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL, -- Insurance, Registration, Tolls, Parking, Detailing, Tax, Financing/Lease, Other
    amount REAL NOT NULL,
    notes TEXT,
    receipt_image TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expenses_vehicle ON other_expenses (vehicle_id, date DESC);

CREATE TABLE IF NOT EXISTS app_releases (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL UNIQUE,
    version_code INTEGER NOT NULL UNIQUE,
    release_notes TEXT,
    apk_filename TEXT NOT NULL,
    apk_size INTEGER NOT NULL,
    release_date TEXT NOT NULL DEFAULT (datetime('now'))
);
