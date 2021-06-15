import twitchChatlog from 'twitch-chatlog/lib';
import storage from 'electron-json-storage';

const provider = {
    loadChatlog: function(video_id) {
        return new Promise((resolve, reject) => {
            storage.getAll({}, function(error, data) {
                console.log('ALL DATA');
                console.log(data);
            });
            storage.get(`twitch_chatlog.${video_id}`, async function(error, data) {
                if (error) {
                    reject(error);
                }
                else {
                    if (data !== null && Object.keys(data).length > 0) {
                        console.log('FROM CACHE');
                        resolve(data);
                    }
                    else {
                        console.log('FETCHING...');
                        const client_id = 'hdaoisxhhrc9h3lz3k24iao13crkkq8'; // From original code
                        const chatlog = await twitchChatlog.getChatlog({
                            vodId: video_id,
                            clientId: client_id,
                            progress: true,
                            //start: argv.start,
                            //end: argv.end,
                            length: 0,
                        });
                        storage.set(`twitch_chatlog.${video_id}`, chatlog, function(error, data) {
                            if (error) {
                                console.error(error);
                            }
                        });
                        resolve(chatlog);
                    }
                }
            });
        });
    },
};

module.exports = provider;
