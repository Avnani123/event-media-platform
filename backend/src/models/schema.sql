-- Enums for Roles and Access Control
CREATE TYPE user_role AS ENUM ('Admin', 'Photographer', 'Club Member', 'Viewer');
CREATE TYPE access_level AS ENUM ('Public', 'Private');

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role DEFAULT 'Viewer',
    face_embedding VECTOR(128), -- For facial recognition matching (requires pgvector)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Events Table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- e.g., 'Workshop', 'Fest', 'Photoshoot'
    event_date TIMESTAMP NOT NULL,
    access_control access_level DEFAULT 'Public',
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Media Items Table
CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    uploader_id INT REFERENCES users(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL, -- S3 Clean URL
    thumbnail_url TEXT, -- Optimized preview URL
    media_type VARCHAR(20) NOT NULL, -- 'image' or 'video'
    ai_tags TEXT[], -- Automatically generated tags array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for highly efficient searching and sorting
CREATE INDEX idx_events_name ON events(name);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_category ON events(category);