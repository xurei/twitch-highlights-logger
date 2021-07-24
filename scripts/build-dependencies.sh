#!/usr/bin/env bash
set -e

myrealpath() {
    [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"
}

BASEPATH=$(myrealpath $(dirname $0))

# Build production package.json
node $BASEPATH/build_package_json.js

# Add non-dev js dependencies
cd $BASEPATH/../build
npm install

# Node rebuild
npm rebuild --runtime=electron --target=11.2.3 --disturl=https://atom.io/download/atom-shell --abi=$(../node_modules/.bin/electron -a)

cd $BASEPATH/..
