#!/bin/bash
# Reset the test database to a clean state

# Drop and recreate the database
echo "Dropping and recreating test database..."
dropdb -U myuser --if-exists headphoneweb_test
createdb -U myuser headphoneweb_test

# Run the setup script
echo "Setting up schema and test data..."
psql -U myuser -d headphoneweb_test -f db/scripts/setup_test_db.sql

echo "Test database reset complete!"
