import fetch from 'node-fetch';

let _latestRelease;

const provider = {
    loadLatestRelease: function() {
        if (!_latestRelease) {
            return fetch(`https://api.github.com/repos/xurei/twitch-highlights-logger/releases?per_page=10&page=0`, {
                method: 'GET',
                headers: {
                    Accept: 'application/vnd.github.v3+json',
                    'User-Agent': 'Hyperkeys-App',
                },
            })
            .then(res => res.json())
            .then((releases) => {
                if (releases && Array.isArray(releases)) {
                    return releases.filter(r => !r.prerelease);
                }
                else {
                    throw new Error('no release yet');
                }
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
