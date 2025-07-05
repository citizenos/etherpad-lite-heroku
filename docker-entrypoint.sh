#!/bin/bash

# Run the start.js script to handle plugin installation
node /opt/etherpad-lite/start.js

# Start Etherpad
exec node --optimize_for_size --max_old_space_size=460 --gc_interval=100 /opt/etherpad-lite/node_modules/ep_etherpad-lite/node/server.js