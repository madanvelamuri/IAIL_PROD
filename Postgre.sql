CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password TEXT,
    role VARCHAR(20) DEFAULT 'user'
);

CREATE TABLE mistakes (
    id SERIAL PRIMARY KEY,
    claim_id VARCHAR(50),
    employee_name VARCHAR(100),
    mistake_type VARCHAR(100),
    description TEXT,
    screenshot_url TEXT,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);