-- First, drop existing tables in the correct order to handle dependencies
DROP TABLE IF EXISTS contact_message CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS "ORDER" CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS cart_session CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS company CASCADE;
DROP TABLE IF EXISTS headphones CASCADE;

-- Create the HEADPHONES table
CREATE TABLE headphones (
    product_id serial PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL NOT NULL,
    description text,
    model_name VARCHAR(255),
    image_url text,
    stock_quantity INTEGER NOT NULL,
    battery_life INTEGER,
    weight real,
    connectivity VARCHAR(255),
    color VARCHAR(255)
);

-- Create the COMPANY table
CREATE TABLE company (
    company_id serial PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_description text,
    contact_info text
);

-- Enhanced ADMIN table with additional security fields
CREATE TABLE admin (
    admin_id serial PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash text NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked BOOLEAN DEFAULT false,
    reset_token text,
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create the CART_SESSION table
CREATE TABLE cart_session (
    session_id serial PRIMARY KEY,
    user_identifier VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    metadata jsonb
);

-- Create the CART_ITEMS table
CREATE TABLE cart_items (
    cart_item_id serial PRIMARY KEY,
    session_id INTEGER REFERENCES cart_session(session_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES headphones(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    UNIQUE(session_id, product_id)
);

-- Enhanced ORDER table
CREATE TABLE "ORDER" (
    order_id serial PRIMARY KEY,
    session_id INTEGER REFERENCES cart_session(session_id),
    guest_info jsonb,
    total_price DECIMAL NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_intent_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    email VARCHAR(255),
    shipping_address jsonb,
    billing_address jsonb,
    metadata jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'))
);

-- Create the ORDER_ITEMS table
CREATE TABLE order_items (
    order_item_id serial PRIMARY KEY,
    order_id INTEGER REFERENCES "ORDER"(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES headphones(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price_at_time DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

-- Enhanced PAYMENT table
CREATE TABLE payment (
    payment_id serial PRIMARY KEY,
    order_id INTEGER REFERENCES "ORDER"(order_id) UNIQUE NOT NULL,
    payment_method VARCHAR(255),
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    stripe_payment_id VARCHAR(255) UNIQUE,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method_details jsonb,
    amount_received DECIMAL,
    currency VARCHAR(3) DEFAULT 'USD',
    error_message text,
    refund_status VARCHAR(50),
    refund_amount DECIMAL,
    metadata jsonb,
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded'))
);

-- Enhanced CONTACT_MESSAGE table with updated_at tracking
CREATE TABLE contact_message (
    message_id serial PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    message text NOT NULL,
    message_date TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    status VARCHAR(20) DEFAULT 'UNREAD',
    admin_response text,
    responded_at TIMESTAMP WITH TIME ZONE,
    admin_id INTEGER REFERENCES admin(admin_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    CONSTRAINT valid_message_status CHECK (status IN ('UNREAD', 'READ', 'RESPONDED'))
);

-- Create function to update cart session last_modified
CREATE OR REPLACE FUNCTION update_cart_last_modified()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE cart_session 
    SET last_modified = current_timestamp 
    WHERE session_id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to update order timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = current_timestamp;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to log admin login attempts
CREATE OR REPLACE FUNCTION log_admin_login()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_login IS NOT NULL AND (OLD.last_login IS NULL OR NEW.last_login != OLD.last_login) THEN
        NEW.failed_login_attempts = 0;
        NEW.account_locked = false;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to update contact message updated_at
CREATE OR REPLACE FUNCTION update_contact_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = current_timestamp;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_cart_last_modified
    AFTER INSERT OR UPDATE OR DELETE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_last_modified();

CREATE TRIGGER update_order_updated_at
    BEFORE UPDATE ON "ORDER"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER admin_login_trigger
    BEFORE UPDATE ON admin
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_login();

CREATE TRIGGER update_contact_message_timestamp
    BEFORE UPDATE ON contact_message
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_message_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_cart_items_session ON cart_items(session_id);
CREATE INDEX idx_cart_session_identifier ON cart_session(user_identifier);
CREATE INDEX idx_order_payment_intent_id ON "ORDER"(payment_intent_id);
CREATE INDEX idx_order_status ON "ORDER"(status);
CREATE INDEX idx_order_email ON "ORDER"(email);
CREATE INDEX idx_payment_stripe_payment_id ON payment(stripe_payment_id);
CREATE INDEX idx_payment_status ON payment(payment_status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_admin_username ON admin(username);
CREATE INDEX idx_admin_email ON admin(email);
CREATE INDEX idx_contact_message_status ON contact_message(status);
CREATE INDEX idx_contact_message_updated_at ON contact_message(updated_at);

-- Add helpful comments
COMMENT ON TABLE admin IS 'Stores admin user information with enhanced security features';
COMMENT ON TABLE cart_session IS 'Stores shopping cart sessions for both guest and registered users';
COMMENT ON TABLE cart_items IS 'Stores items added to shopping carts';
COMMENT ON TABLE "ORDER" IS 'Stores order information with Stripe payment integration';
COMMENT ON TABLE payment IS 'Stores payment information with detailed Stripe payment tracking';
COMMENT ON TABLE contact_message IS 'Stores customer contact messages with status tracking';