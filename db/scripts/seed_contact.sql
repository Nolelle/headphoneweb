-- First add an admin user for testing
INSERT INTO admin(
    username,
    password_hash,
    email
) VALUES (
    'admin',
    '$2b$10$p8TsY9Zrh2xbZm6CJI2uMumgvwEb117TXHLgPQE5/F.C1QsRu4zFm',
    'admin@headphoneplus.com'
);

-- Insert contact messages with status and some with admin responses
INSERT INTO contact_message(
    name,
    email,
    message,
    status,
    admin_response,
    admin_id
) VALUES (
    'John Doe',
    'john.doe@example.com',
    'I have a question about your headphones.',
    'READ',
    'Thank you for your inquiry. Please let me know what specific questions you have about our headphones.',
    1
),
(
    'Jane Smith',
    'jane.smith@example.com',
    'I would like to know more about your company.',
    'UNREAD',
    NULL,
    NULL
),
(
    'Peter Jones',
    'peter.jones@example.com',
    'I am interested in purchasing your product.',
    'READ',
    'Thanks for your interest! You can purchase our headphones directly through our website using the Buy Now button.',
    1
);