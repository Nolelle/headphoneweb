-- Start with clean slate for testing
TRUNCATE TABLE contact_message, payment, order_items, "ORDER", cart_items, cart_session, admin, company, headphones CASCADE;

-- Reset sequences
ALTER SEQUENCE headphones_product_id_seq RESTART WITH 1;
ALTER SEQUENCE company_company_id_seq RESTART WITH 1;
ALTER SEQUENCE admin_admin_id_seq RESTART WITH 1;
ALTER SEQUENCE cart_session_session_id_seq RESTART WITH 1;
ALTER SEQUENCE cart_items_cart_item_id_seq RESTART WITH 1;
ALTER SEQUENCE "ORDER_order_id_seq" RESTART WITH 1;
ALTER SEQUENCE order_items_order_item_id_seq RESTART WITH 1;
ALTER SEQUENCE payment_payment_id_seq RESTART WITH 1;
ALTER SEQUENCE contact_message_message_id_seq RESTART WITH 1;

-- Insert company information
INSERT INTO company (company_name, company_description, contact_info) VALUES
    ('Headphone Plus', 
     'Premium headphone retailer offering the latest in audio technology.',
     '{"address": "123 Audio Lane, Sound City, SC 12345", "phone": "+1-555-123-4567", "email": "contact@headphoneplus.com"}'
    );

-- Insert admin users with bcrypt hashed passwords
-- Password for admin user is 'admin123'
INSERT INTO admin (username, password_hash, email, created_at, last_login) VALUES
    ('admin', 
     '$2b$10$HAfCblA9Rc8IA.FkjO7So.rAE817fNnEKD2ihqRo.PYWBhVyePa0S',
     'admin@headphoneplus.com',
     current_timestamp,
     NULL
    );

-- Insert sample headphones products
INSERT INTO headphones (name, price, description, model_name, image_url, stock_quantity, battery_life, weight, connectivity, color) VALUES
    ('QuietComfort 45', 299.99, 'Premium noise-cancelling headphones with exceptional comfort', 'QC45', '/images/qc45-black.webp', 50, 24, 240, 'Bluetooth 5.0', 'Black'),
    ('SoundSport Wireless', 129.99, 'Wireless sport earbuds for active lifestyles', 'SS-100', '/images/soundsport-blue.webp', 75, 12, 28, 'Bluetooth 5.0', 'Blue'),
    ('Studio Pro', 349.99, 'Professional studio monitoring headphones', 'SP-200', '/images/studio-pro-silver.webp', 25, NULL, 285, 'Wired', 'Silver'),
    ('AirPods Max', 549.99, 'High-fidelity audio with computational audio', 'APM-1', '/images/airpods-max-space.webp', 30, 20, 385, 'Bluetooth 5.0', 'Space Gray');

-- Insert sample cart sessions
INSERT INTO cart_session (user_identifier, metadata) VALUES
    ('guest_123', '{"device": "mobile", "browser": "chrome", "platform": "ios"}'),
    ('guest_456', '{"device": "desktop", "browser": "firefox", "platform": "windows"}');

-- Insert sample cart items
INSERT INTO cart_items (session_id, product_id, quantity) VALUES
    (1, 1, 1),
    (1, 2, 2),
    (2, 3, 1);

-- Insert sample orders
INSERT INTO "ORDER" (
    session_id,
    guest_info,
    total_price,
    status,
    payment_intent_id,
    stripe_customer_id,
    email,
    shipping_address,
    billing_address,
    metadata
) VALUES
    (
        1,
        '{"name": "John Doe", "phone": "+1-555-111-2222"}',
        299.99,
        'paid',
        'pi_1234567890',
        'cus_1234567890',
        'john.doe@example.com',
        '{"street": "123 Main St", "city": "Boston", "state": "MA", "zip": "02108"}',
        '{"street": "123 Main St", "city": "Boston", "state": "MA", "zip": "02108"}',
        '{"source": "web", "promo_code": "SUMMER2024"}'
    );

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES
    (1, 1, 1, 299.99);

-- Insert payments
INSERT INTO payment (
    order_id,
    payment_method,
    transaction_id,
    stripe_payment_id,
    payment_status,
    payment_method_details,
    amount_received,
    currency,
    metadata
) VALUES
    (
        1,
        'credit_card',
        'txn_1234567890',
        'py_1234567890',
        'succeeded',
        '{"type": "card", "card": {"brand": "visa", "last4": "4242"}}',
        299.99,
        'USD',
        '{"risk_score": "low"}'
    );

-- Insert contact messages with updated schema
INSERT INTO contact_message (
    name, 
    email, 
    message, 
    status, 
    message_date,
    updated_at
) VALUES
    (
        'John Doe',
        'john.doe@example.com',
        'Question about QuietComfort 45 battery life',
        'UNREAD',
        current_timestamp,
        current_timestamp
    ),
    (
        'Jane Smith',
        'jane.smith@example.com',
        'International shipping inquiry',
        'UNREAD',
        current_timestamp,
        current_timestamp
    );