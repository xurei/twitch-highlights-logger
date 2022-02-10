import storage from 'electron-json-storage';
import fetch from 'node-fetch';

const clientID = 'kimne78kx3ncx6brgo4mv6wki5h1ko'; // From Twitch website (2022-02-09)
const payloadVersion = 1; // Version of the data to be compared with the cache. If different, a refetch is performed

class Chatlog {
    _videoMeta;
    _fetchedTime = 0;
    _comments = [];
    
    _fetchedCallbacks = [];
    _fetchProgressCallbacks = [];
    
    get fetchProgress() {
        return 100 * this._fetchedTime / this._videoMeta.length;
    }
    get videoID() {
        const id = this._videoMeta._id;
        if (id.charAt(0) === 'v') {
            return id.substr(1);
        }
        else {
            return id;
        }
    }
    
    get payload() {
        const out = {
            version: payloadVersion,
            meta: this._videoMeta,
            comments: this._comments
        };
        delete out.meta['thumbnails'];
        delete out.meta['fps'];
        
        return out;
    }
    
    static fromCache(cacheData) {
        const out = new Chatlog(cacheData.meta);
        out._comments = cacheData.comments;
        out._fetchedTime = out._videoMeta.length;
        return out;
    }
    
    constructor(videoMeta) {
        this._videoMeta = videoMeta;
    }
    
    async fetchComments() {
        const fetchSegment = async (cursor) => {
            console.log('Fetching at ' + cursor);
            let args = 'content_offset_seconds=0';
            if (cursor) {
                args = `cursor=${cursor}`;
            }
            const resp = await fetch(`https://api.twitch.tv/v5/videos/${this.videoID}/comments?${args}`, {
                headers: {
                    "Client-ID": clientID,
                    "Accept": "application/vnd.twitchtv.v5+json; charset=UTF-8"
                }
            });
            return await resp.json();
        }
        
        let shouldContinue = true;
        let cursor = null;
        while (shouldContinue) {
            const data = await fetchSegment(cursor);
            const comments = data.comments;
            comments.forEach(comment => {
                shortenComment(comment);
                this._comments.push(comment);
            });
            //noinspection JSUnresolvedVariable
            shouldContinue = !!data._next;
            //noinspection JSUnresolvedVariable
            cursor = data._next;
            
            if (this._comments.length > 0) {
                this._fetchedTime = this._comments[this._comments.length-1].content_offset_seconds;
                const progress = this.fetchProgress;
                this._fetchProgressCallbacks.forEach(callback => {
                    callback(progress);
                });
            }
        }
        this._fetchedTime = this._videoMeta.length;
    
        this._fetchProgressCallbacks.forEach(callback => {
            callback(100);
        });
        this._fetchedCallbacks.forEach(callback => {
            callback();
        });
    }
    
    onFetchComplete(/*function()*/ callback) {
        if (this.fetchProgress >= 100) {
            callback();
        }
        else {
            this._fetchedCallbacks.push(callback);
        }
    }
    
    onFetchProgress(/*function(number progress)*/ callback) {
        if (this.fetchProgress >= 100) {
            callback(100);
        }
        else {
            this._fetchProgressCallbacks.push(callback);
        }
    }
}

const provider = {
    loadChatlog: function(videoID) {
        return new Promise((resolve, reject) => {
            storage.get(`twitch_chatlog.${videoID}`, async function(error, cachedData) {
                if (error) {
                    reject(error);
                }
                else {
                    if (cachedData !== null && Object.keys(cachedData).length > 0 && cachedData.version === payloadVersion) {
                        console.log('FROM CACHE');
                        const chatlog = Chatlog.fromCache(cachedData);
                        console.log(chatlog);
                        resolve(chatlog);
                    }
                    else {
                        console.log('FETCHING...');
    
                        let videoMeta;
                        try {
                            videoMeta = await fetchVideoMeta(videoID);
                            console.log(videoMeta);
                        }
                        catch (e) {
                            reject(e);
                        }
                        
                        const chatlog = new Chatlog(videoMeta);
                        chatlog.onFetchComplete(() => {
                            storage.set(`twitch_chatlog.${videoID}`, chatlog.payload, function(error, data) {
                                if (error) {
                                    console.error(error);
                                }
                            });
                        });
                        //noinspection ES6MissingAwait
                        chatlog.fetchComments();
                        resolve(chatlog);
                    }
                }
            });
        });
    },
};

function shortenComment(comment) {
    // Twitch is sending an absolutely stupid amount of rendundant data FOR EACH MESSAGE
    // This function reduce each message data so we don't the the freaking Biography of each commenter each time
    // (among other things)
    
    //noinspection JSUnresolvedVariable
    delete comment['updated_at'];
    delete comment['channel_id'];
    delete comment['content_type'];
    delete comment['content_id'];
    comment['commenter'] = comment['commenter']['display_name'];
    delete comment['message']['emoticons'];
    delete comment['source'];
}

async function fetchVideoMeta(videoID) {
    const resp = await fetch(`https://api.twitch.tv/v5/videos/${videoID}`, {
        headers: {
            "Client-ID": clientID,
            "Accept": "application/vnd.twitchtv.v5+json; charset=UTF-8"
        }
    });
    return await resp.json();
}

module.exports = provider;
