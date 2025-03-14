#!/bin/bash

source .env

docker run -d \
    --name mongo-azzis \
    -p $MONGODB_PORT:27017 \
    -e MONGO_INITDB_ROOT_USERNAME="$MONGODB_USERNAME" \
    -e MONGO_INITDB_ROOT_PASSWORD="$MONGODB_PASSWORD" \
    -e MONGO_INITDB_DATABASE="$MONGODB_DATABASE" \
    mongo