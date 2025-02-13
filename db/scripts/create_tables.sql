-- Drop existing tables in the correct order
DROP TABLE IF EXISTS contact_message CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS "ORDER" CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS cart_session CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS headphones CASCADE;

-- Create the HEADPHONES table - Simplified to match your frontend needs
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

-- Create the ADMIN table - Matches your admin authentication system
CREATE TABLE admin (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create the CART_SESSION table - Matches your CartContext implementation
CREATE TABLE cart_session (
    session_id SERIAL PRIMARY KEY,
    user_identifier VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the CART_ITEMS table - Matches your cart functionality
CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES cart_session(session_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES headphones(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, product_id)
);

-- Create the ORDER table - Matches your checkout process
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

-- Create the ORDER_ITEMS table - Matches your order processing
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES "ORDER"(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES headphones(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the PAYMENT table - Matches your Stripe integration
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

-- Create the CONTACT_MESSAGE table - Matches your contact form
CREATE TABLE contact_message (
    message_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
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

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

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