#!/bin/sh

. ./starter-git/linux/cstr.sh

detect_ports () {
    ret=0;
    # arrays are ports
    for port in "$@"; do
        # echo "$port";
        occupied=$(lsof -i:"$port");
        if [ -n "$occupied" ]; then
            ret=1;
            cstr "Local port ${port} is in use." "$fmagenta";
        fi
    done

        return $ret; 
}

