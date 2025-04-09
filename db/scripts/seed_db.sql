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

-- Sample data below this line is optional and can be used for testing

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
