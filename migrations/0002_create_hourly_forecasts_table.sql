-- Migration number: 0002
CREATE TABLE IF NOT EXISTS hourly_forecasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id TEXT NOT NULL,
    display_at TEXT NOT NULL,
    display_at_local_label TEXT NOT NULL,
    temp REAL,
    pop REAL,
    precip_type INTEGER,
    precip_accum REAL,
    precip_snow REAL,
    precip_mix REAL,
    precip_rain REAL,
    precip_swe REAL,
    snow_level INTEGER,
    slr REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(location_id, display_at, display_at_local_label)
);

CREATE INDEX idx_hourly_forecasts_location ON hourly_forecasts(location_id);
CREATE INDEX idx_hourly_forecasts_display_at ON hourly_forecasts(display_at);

