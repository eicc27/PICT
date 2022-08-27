#!/bin/sh
echo "fetching remote update..."
(git pull https://github.com/eicc27/PICT.git) || (echo "git command not found. Have you installed git?" && exit 1)
echo "update complete."

cd front || (echo "front folder does not exist. Maybe it's due to a corrupted installation" && exit 1)
npm update || (echo "npm command not found. Have you installed NodeJS or npm?" && exit 1)
nohup ember serve &
echo "front started."
(cd .. && cd back ) || (echo "front folder does not exist. Maybe it's due to a corrupted installation" && exit 1)
npm update || (echo "npm command not found. Have you installed NodeJS or npm?" && exit 1)
nohup npm run serve & 
echo "back started."