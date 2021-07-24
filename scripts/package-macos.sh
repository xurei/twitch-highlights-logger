#!/usr/bin/env bash
set -e

myrealpath() {
    [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"
}

BASEPATH=$(myrealpath $(dirname $0)/..)
echo $BASEPATH

node_modules/.bin/electron-builder --dir --mac

# Remove unneeded libs
#echo "Purging useless libs..."
#rm -rf $BASEPATH/dist_packages/linux-unpacked/swiftshader || true
#rm -rf $BASEPATH/dist_packages/linux-unpacked/libGLESv2.so || true
#rm -rf $BASEPATH/dist_packages/linux-unpacked/libEGL2.so || true
#rm -rf $BASEPATH/dist_packages/linux-unpacked/libvulkan.so || true
#rm -rf $BASEPATH/dist_packages/linux-unpacked/libvk_swiftshader.so || true

# Create AppImage
node_modules/.bin/electron-builder --prepackaged=dist_packages/linux-unpacked --mac --p onTagOrDraft
