#!/bin/bash

# Create data directory if it doesn't exist
mkdir -p ~/data/db

# Start MongoDB
echo "Starting MongoDB..."
mongod --dbpath ~/data/db --fork --logpath ~/data/mongodb.log

echo "MongoDB started. Logs are in ~/data/mongodb.log"
echo "To stop MongoDB, run: mongod --shutdown --dbpath ~/data/db"