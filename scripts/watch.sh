#!/usr/bin/env bash
set -e

BASEPATH=$(realpath $(dirname $0))

# Build app
webpack --watch


