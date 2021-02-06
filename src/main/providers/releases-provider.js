import fetch from 'node-fetch';

let _latestRelease;

const provider = {
    loadLatestRelease: function() {
        if (!_latestRelease) {
            return fetch(`https://api.github.com/repos/xurei/hyperkeys/releases?per_page=10&page=0`, {
                method: 'GET',
                headers: {
                    Accept: 'application/vnd.github.v3+json',
                    'User-Agent': 'Hyperkeys-App',
                },
            })
            .then(res => res.json())
            .then((releases) => {
                return releases.filter(r => !r.prerelease);
            })
            .then((releases) => {
                _latestRelease = releases[0];
                return _latestRelease;
            })
            .catch(e => {
                console.error(e);
                return null;
            });
        }
        else {
            return Promise.resolve(_latestRelease);
        }
    },
};

module.exports = provider;
