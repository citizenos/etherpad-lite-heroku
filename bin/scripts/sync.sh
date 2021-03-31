#!/bin/bash

# Watches and Syncs 2 directories when changes are made to the SOURCE.
# In this projects contects, meant to sync local plugin development directory with Etherpads plugin directory.
# Example: ./bin/scripts/sync.sh /home/m/dev/ep_auth_citizeno

SOURCE=$1

if [ -n "$1" ]; then
  SOURCE=$1
else
  echo "First parameter SOURCE is required!"
  exit 1
fi

if [ -n "$2" ]; then
  DESTINATION=$2
else
  DESTINATION="./etherpad-lite/node_modules"
fi

echo "Syncing $SOURCE to destination $DESTINATION"

while inotifywait -r -e modify,create,delete,move $SOURCE; do
    rsync -avz $SOURCE $DESTINATION
done
