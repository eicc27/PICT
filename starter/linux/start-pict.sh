#!/bin/sh

. "./starter-git/linux/cstr.sh"
. "./starter-git/linux/detect-ports.sh"

echo "Using Linux shell.";
cstr "Trying to build from scratch..." "$fyellow";
cstr "Warning: On Linux there is no fixed graphic-interface shell that explicitly \
shows how the program is running. All outputs will be redirected to nohup.out." "$fyellow";
detect_ports 4200 3000 3001;
ret=$?;
if [ "$ret" ]; then
    exit 1;
fi
cstr "|---- Building ./front/**..." "$fblue";
cd front || exit 1;
nohup ember serve;
cstr "|---- Building ./back/**..." "$fblue";
cd ../back || exit 1;
nohup npm run dev;