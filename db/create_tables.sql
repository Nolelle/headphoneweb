-- Create the HEADPHONES table
CREATE TABLE headphones(
    product_id serial PRIMARY KEY,
    name VARCHAR( 255 )NOT NULL,
    price DECIMAL NOT NULL,
    description text,
    model_name VARCHAR( 255 ),
    image_url text,
    stock_quantity INTEGER NOT NULL,
    battery_life INTEGER,
    weight real,
    connectivity VARCHAR( 255 ),
    color VARCHAR( 255 )
);

-- Create the COMPANY table
CREATE TABLE company(
    company_id serial PRIMARY KEY,
    company_name VARCHAR( 255 )NOT NULL,
    company_description text,
    contact_info text
);

-- Create the ADMIN table
CREATE TABLE admin(
    admin_id serial PRIMARY KEY,
    username VARCHAR( 255 )UNIQUE NOT NULL,
    password_hash text NOT NULL
);

-- Create the ORDER table
CREATE TABLE "ORDER"(
    order_id serial PRIMARY KEY,
    guest_info jsonb,
    total_price DECIMAL NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

-- Create the ORDER_ITEMS table
CREATE TABLE order_items(
    order_item_id serial PRIMARY KEY,
    order_id INTEGER REFERENCES "ORDER"( order_id )NOT NULL,
    product_id INTEGER REFERENCES headphones( product_id )NOT NULL,
    quantity INTEGER NOT NULL
);

-- Create the PAYMENT table
CREATE TABLE payment(
    payment_id serial PRIMARY KEY,
    order_id INTEGER REFERENCES "ORDER"( order_id )UNIQUE NOT NULL,
    payment_method VARCHAR( 255 ),
    transaction_id VARCHAR( 255 ),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

-- Create the CONTACT_MESSAGE table
CREATE TABLE contact_message(
    message_id serial PRIMARY KEY,
    name VARCHAR( 255 ),
    email VARCHAR( 255 ),
    message text NOT NULL,
    message_date TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);