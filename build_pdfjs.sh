#!/bin/bash

# Copyright (c) 2024 Alex313031.

YEL='\033[1;33m' # Yellow
CYA='\033[1;96m' # Cyan
RED='\033[1;31m' # Red
GRE='\033[1;32m' # Green
c0='\033[0m' # Reset Text
bold='\033[1m' # Bold Text
underline='\033[4m' # Underline Text

# Error handling
yell() { echo "$0: $*" >&2; }
die() { yell "$*"; exit 111; }
try() { "$@" || die "${RED}Failed $*"; }

# --help
displayHelp () {
	printf "\n" &&
	printf "${bold}${GRE}Script to build PDF.js.${c0}\n" &&
	printf "${underline}${YEL}Usage:${c0} build.sh --build | --dist${c0}\n" &&
	printf "The --build flag will build PDF.js${c0}\n" &&
	printf "The --dist flag will build and copy the built files into ./app/lib${c0}\n" &&
	printf "The --help flag will show this help${c0}\n" &&
	printf "${bold}${RED}Remember to use \`nvm install 18\` first!${c0}\n" &&
	printf "\n"
}
case $1 in
	--help) displayHelp; exit 0;;
esac

buildPDFjs () {
	printf "\n" &&
	printf "${bold}${GRE}Building PDF.js...${c0}\n" &&
	printf "\n" &&

	cd ./pdf.js &&
	npm install &&
	npm run build &&

	printf "\n" &&
	printf "${bold}${GRE}Done!${c0}\n" &&
	printf "\n"
}
case $1 in
	--build) buildPDFjs; exit 0;;
esac

distPDFjs () {
	printf "\n" &&
	printf "${bold}${GRE}Building PDF.js...${c0}\n" &&
	printf "\n" &&

	cd ./pdf.js &&
	npm install &&
	npm run build &&
	cd .. &&

	rm -r -v -f ./app/lib/* &&
	cp -r -v ./pdf.js/build/generic/. ./app/lib/ &&

	printf "\n" &&
	printf "${bold}${GRE}Done!${c0}\n" &&
	printf "\n"
}
case $1 in
	--dist) distPDFjs; exit 0;;
esac

printf "\n" &&
printf "${bold}${GRE}Script to build PDF.js.${c0}\n" &&
printf "${underline}${YEL}Usage:${c0} build.sh --build | --dist${c0}\n" &&
printf "The --build flag will build PDF.js${c0}\n" &&
printf "The --dist flag will build and copy the built files into ./app/lib${c0}\n" &&
printf "The --help flag will show this help${c0}\n" &&
printf "${bold}${RED}Remember to use \`nvm install 18\` first!${c0}\n" &&
printf "\n" &&
tput sgr0
