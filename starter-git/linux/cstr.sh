#!/bin/sh

fblack=30;
fred=31;
fgreen=32;
fyellow=33;
fblue=34;
fmagenta=35;
fcyan=36;
fwhite=37;
color_rst="\033[0m";

cstr() {
    str=$1;
    fcolor=$2;
    echo -e "\033[${fcolor}m${str}${color_rst}";
}

# cstr "hello" $fmagenta;