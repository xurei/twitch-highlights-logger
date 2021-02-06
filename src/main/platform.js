function getPlatformName() {
    if (/^win/.test(process.platform)) {
        return 'windows';
    }
    if (/^osx|darwin/.test(process.platform)) {
        return 'mac';
    }
    if (/^linux/.test(process.platform)) {
        return 'linux';
    }
    return 'unknown';
}

function getPlatformArch() {
    return process.arch;
}

const isWin = (getPlatformName() === 'windows');
const platform = {
    name: getPlatformName(),
    arch: getPlatformArch(),
    
    isWin: isWin,
    isWin32: (isWin && getPlatformArch() === 'ia32'),
    isWin64: (isWin && getPlatformArch() === 'x64'),
    
    isMac: (getPlatformName() === 'mac'),
    isLinux: (getPlatformName() === 'linux'),
};

export default platform;
