#!/bin/sh

#Move to the folder where ep-lite is installed
cd etherpad-lite

echo "Copy all ep_* packages from the /app/node_modules to etherpad_lite/node_modules"
echo "To install ep-plugins, add them to package.json"
(
  `ls -d ../node_modules/ep_* | grep -v "ep_etherpad-lite"` | while read line
  do
    pnpm run plugins i --path "$line"
  done
) || {
  exit 1
}
exit 0
