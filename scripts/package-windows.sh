#!/usr/bin/env bash
set -e

BASEPATH=$(realpath $(dirname $0)/..)

node_modules/.bin/electron-builder --dir --win

# Remove unneeded libs
echo "Purging useless libs..."
#rm -rf $BASEPATH/dist_packages/win-unpacked/swiftshader || true
#rm -rf $BASEPATH/dist_packages/win-unpacked/libGLESv2.dll || true
#rm -rf $BASEPATH/dist_packages/win-unpacked/d3dcompiler_47* || true
#rm -rf $BASEPATH/dist_packages/win-unpacked/libEGL.dll || true
#rm -rf $BASEPATH/dist_packages/win-unpacked/vk_swiftshader.dll || true
#rm -rf $BASEPATH/dist_packages/win-unpacked/vulkan-1.dll || true

## Create Setup file
node_modules/.bin/electron-builder --prepackaged=dist_packages/win-unpacked --win --p onTagOrDraft
