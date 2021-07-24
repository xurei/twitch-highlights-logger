#!/usr/bin/env bash
set -e

myrealpath() {
    [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"
}

BASEPATH=$(myrealpath $(dirname $0))

if [[ $1 != '' ]]; then
	echo "Building $1 ONLY"
	compile_module $1
	exit 0;
else
	# Build main
	echo "-- Building Main"
	node_modules/.bin/babel --config-file $BASEPATH/../.babelrc.main src/main -d build --copy-files

	# Build package.json
	node $BASEPATH/build_package_json.js

	# Build app
	webpack
fi



