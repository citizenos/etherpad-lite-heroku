#!/bin/sh

#Move to the folder where ep-lite is installed
cd etherpad-lite

echo "Copy all ep_* packages from the /app/node_modules to etherpad_lite/node_modules"
echo "To install ep-plugins, add them to package.json"
(
  mkdir -p node_modules
  cd node_modules
  cp -R ../../node_modules/ep_* .
) || {
  exit 1
}
exit 0
