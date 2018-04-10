#!/usr/bin/env node

var kexec = require('kexec');

var childProcess = require('child_process');
childProcess.execSync('./installPackages.sh');

// Run the Etherpad itself. Using kexec so that the current process would get replaced with the new one
if (process.env.ETHERPAD_ALLOW_ROOT) {
    kexec('./etherpad-lite/bin/run.sh --root');
    kexec('kill node');
    kexec('node --optimize_for_size --max_old_space_size=460 --gc_interval=100 ./etherpad-lite/node_modules/ep_etherpad-lite/node/server.js ');
} else {
    kexec('./etherpad-lite/bin/run.sh');
    kexec('kill node');
    kexec('node --optimize_for_size --max_old_space_size=460 --gc_interval=100 ./etherpad-lite/node_modules/ep_etherpad-lite/node/server.js ');
} 
