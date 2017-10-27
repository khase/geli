#!/bin/bash

# Variables
MODULE_PATH=".travis/node_modules"
# BIN_PATH="coveralls/bin"
BIN_PATH=".bin"

RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Functions
function npm_package_is_installed {
  local return_=1
  ls node_modules | grep $1 > /dev/null 2>&1 || { local return_=0; }
  echo "$return_"
}

# Begin of code
echo
echo "+++ Run coveralls send +++"
echo

echo "+ checking if coveralls is installed"
cd .travis
if [ $(npm_package_is_installed coveralls) == 0 ]; then
  echo -e "${RED}+ ERROR: coveralls is not installed, please add coveralls to the .travis/package.json${NC}"
  exit 1
fi
cd ..

sed "s/return 'warn';/return 'info';/g" .travis/node_modules/coveralls/lib/logger.js >> .travis/node_modules/coveralls/lib/logger.js.tmp
rm .travis/node_modules/coveralls/lib/logger.js
mv .travis/node_modules/coveralls/lib/logger.js.tmp .travis/node_modules/coveralls/lib/logger.js

echo "+ sending lcov file to coveralls"
#cat api/coverage/lcov.info
#echo "+ sed"
#sed -i 's/bin\///g' api/coverage/lcov.info
#cat api/coverage/lcov.info
#echo "+ sending"
cp api/coverage/lcov.info api/coverage/lcov.info.txt
cat api/coverage/lcov.info.txt | $MODULE_PATH/$BIN_PATH/coveralls -v
# cat api/coverage/lcov.info | $MODULE_PATH/$BIN_PATH/coveralls.js -v

echo "+ INFO: Currently only the api-coverdata are generated and send"

