-- setup_test_db.sql

-- Drop existing tables in the correct order
DROP TABLE IF EXISTS contact_message CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS "ORDER" CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS cart_session CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS headphones CASCADE;

-- Create the HEADPHONES table
CREATE TABLE headphones (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the ADMIN table
CREATE TABLE admin (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create the CART_SESSION table
CREATE TABLE cart_session (
    session_id SERIAL PRIMARY KEY,
    user_identifier VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the CART_ITEMS table
CREATE TABLE cart_items (
    cart_item_id BIGSERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES cart_session(session_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES headphones(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, product_id)
);

-- Create the ORDER table
CREATE TABLE "ORDER" (
    order_id SERIAL PRIMARY KEY,
    payment_intent_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled'))
);

-- Create the ORDER_ITEMS table
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES "ORDER"(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES headphones(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the PAYMENT table
CREATE TABLE payment (
    payment_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES "ORDER"(order_id) UNIQUE NOT NULL,
    stripe_payment_id VARCHAR(255) UNIQUE,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    amount_received DECIMAL(10,2),
    payment_method_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded'))
);

-- Create the CONTACT_MESSAGE table
CREATE TABLE contact_message (
    message_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'UNREAD',
    admin_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_message_status CHECK (status IN ('UNREAD', 'READ', 'RESPONDED'))
);

-- Create helpful indexes
CREATE INDEX idx_cart_items_session ON cart_items(session_id);
CREATE INDEX idx_order_payment_intent ON "ORDER"(payment_intent_id);
CREATE INDEX idx_payment_stripe_id ON payment(stripe_payment_id);
CREATE INDEX idx_contact_message_status ON contact_message(status);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp triggers
CREATE TRIGGER update_headphones_timestamp
    BEFORE UPDATE ON headphones
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_order_timestamp
    BEFORE UPDATE ON "ORDER"
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_payment_timestamp
    BEFORE UPDATE ON payment
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_contact_message_timestamp
    BEFORE UPDATE ON contact_message
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- SEED DATA

-- Clean existing data (if any)
TRUNCATE TABLE contact_message, payment, order_items, "ORDER", cart_items, cart_session, admin, headphones CASCADE;

-- Reset sequences
ALTER SEQUENCE headphones_product_id_seq RESTART WITH 1;
ALTER SEQUENCE admin_admin_id_seq RESTART WITH 1;
ALTER SEQUENCE cart_session_session_id_seq RESTART WITH 1;
ALTER SEQUENCE cart_items_cart_item_id_seq RESTART WITH 1;
ALTER SEQUENCE "ORDER_order_id_seq" RESTART WITH 1;
ALTER SEQUENCE order_items_order_item_id_seq RESTART WITH 1;
ALTER SEQUENCE payment_payment_id_seq RESTART WITH 1;
ALTER SEQUENCE contact_message_message_id_seq RESTART WITH 1;

-- Insert admin user (password: admin123)
INSERT INTO admin (username, password_hash, email) VALUES
    ('admin', '$2b$10$HAfCblA9Rc8IA.FkjO7So.rAE817fNnEKD2ihqRo.PYWBhVyePa0S', 'admin@boneplus.com');

-- Insert the Bone+ headphone product that matches your frontend
INSERT INTO headphones (name, price, description, image_url, stock_quantity) VALUES
    ('Bone+ Headphone', 
     199.99,
     'Premium headphones featuring super lightweight design, comfortable fit, long battery life, noise cancellation, Bluetooth support, and personalized audio spectrum adjustment.',
     '/h_1.png',
     50);

-- Insert sample contact messages with the new message_date column
INSERT INTO contact_message (name, email, message, message_date, status) VALUES
    ('John Smith', 'john.smith@example.com', 'I would like to know more about the battery life of your headphones.', CURRENT_TIMESTAMP, 'UNREAD'),
    ('Sarah Johnson', 'sarah.j@example.com', 'Do you ship internationally?', CURRENT_TIMESTAMP, 'UNREAD');

-- Insert a sample cart session
INSERT INTO cart_session (user_identifier) VALUES
    ('test-session-123');

-- Insert a sample cart item
INSERT INTO cart_items (session_id, product_id, quantity) VALUES
    (1, 1, 1);

-- Insert a sample order
INSERT INTO "ORDER" (
    payment_intent_id,
    email,
    total_price,
    status
) VALUES (
    'pi_test_123',
    'test@example.com',
    199.99,
    'pending'
);

-- Insert sample order items
INSERT INTO order_items (
    order_id,
    product_id,
    quantity,
    price_at_time
) VALUES (
    1,
    1,
    1,
    199.99
);

-- Insert sample payment
INSERT INTO payment (
    order_id,
    stripe_payment_id,
    payment_status,
    amount_received,
    payment_method_details
) VALUES (
    1,
    'py_test_123',
    'pending',
    199.99,
    '{"type": "card", "card": {"brand": "visa", "last4": "4242"}}'
);

-- Add Cypress test message
INSERT INTO contact_message (name, email, message, message_date, status)
VALUES (
    'Cypress Test User',
    'cypress@example.com',
    'This is a test message created specifically for Cypress E2E testing. Please respond to this message.',
    CURRENT_TIMESTAMP,
    'UNREAD'
);