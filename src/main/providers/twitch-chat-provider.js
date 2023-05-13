import process from 'node:process';
import storage from 'electron-json-storage';
import fetch from 'node-fetch';
import {twitchClientId} from './twitch-client-id';

const payloadVersion = 2; // Version of the data to be compared with the cache. If different, a refetch is performed

class Chatlog {
    _videoMeta;
    _fetchedTime = 0;
    _comments = [];
    
    _fetchedCallbacks = [];
    _fetchProgressCallbacks = [];
    _fetchErrorCallbacks = [];
    _hasError = false;
    
    get fetchProgress() {
        return 100 * this._fetchedTime / this._videoMeta.length;
    }
    get videoID() {
        const id = this._videoMeta.id;
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
            comments: this._comments,
        };
        delete out.meta['thumbnails'];
        delete out.meta['fps'];
        
        return out;
    }

    static updateCache(cacheData) {
        //Version update from 1 to 2 - commenter rewrite
        if (cacheData.version === 1) {
            cacheData.comments.forEach(comment => {
                comment.commenter = {
                    id: -1,
                    login: comment.commenter.toLowerCase(),
                    displayName: comment.commenter,
                }
            });
            cacheData.version = 2;
        }
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
        const fetchSegment = async(cursor) => {
            console.log(`Fetching at ${cursor}`);
            const vars = {'videoID': `${this.videoID}`};
            if (cursor) {
                vars.cursor = cursor;
            }
            else {
                vars.contentOffsetSeconds = 0;
            }
            
            const body = JSON.stringify([{
                'operationName': 'VideoCommentsByOffsetOrCursor',
                'variables': vars,
                'extensions': {
                    'persistedQuery': {
                        'version': 1,
                        'sha256Hash': 'b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a'
                    }
                }
            }]);
            
            console.log(`Request body : ${body}`);

            const resp = await fetch(`https://gql.twitch.tv/gql`, {
                method: 'POST',
                body: body,
                headers: {
                    'Client-ID': twitchClientId,
                    'Accept': 'application/vnd.twitchtv.v5+json; charset=UTF-8',
                },
            });
            return (await resp.json())[0].data.video;
        };
        
        let shouldContinue = true;
        let cursor = null;
        try {
            while (shouldContinue) {
                const data = await fetchSegment(cursor);
                console.log(data);
                const comments = data.comments.edges;
                const pageInfo = data.comments.pageInfo;
                comments.forEach(comment => {
                    try {
                        comment = shortenComment(comment.node);
                    }
                    catch(e) {
                        console.error('comment is malformed');
                        console.error(JSON.stringify(comment.node, null, '  '))
                        console.error(e);
                    }
                    this._comments[this._comments.length] = comment;
                });
                //noinspection JSUnresolvedVariable
                shouldContinue = pageInfo.hasNextPage;
                //noinspection JSUnresolvedVariable
                cursor = comments[0].cursor;
                
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
        catch (e) {
            this._hasError = true;
            this._fetchErrorCallbacks.forEach(callback => {
                callback();
            });
        }
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
    
    onFetchError(callback) {
        if (this._hasError) {
            callback();
        }
        else {
            this._fetchErrorCallbacks.push(callback);
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
                    if (cachedData !== null && Object.keys(cachedData).length > 0) {
                        Chatlog.updateCache(cachedData);
                    }
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
    // This function reduce each message data, so we don't write the freaking Biography of each commenter each time
    // (among other things)

    // //noinspection JSUnresolvedVariable
    // delete comment['updated_at'];
    // delete comment['channel_id'];
    // delete comment['content_type'];
    // delete comment['content_id'];
    // comment['commenter'] = comment['commenter']['display_name'];
    // delete comment['message']['emoticons'];
    // delete comment['source'];

    if (!comment.message.fragments) {
        console.error('No fragments !');
        process.exit(1);
    }

    const out = {
        _id: comment.id,
        created_at: comment.createdAt,
        content_offset_seconds: comment.contentOffsetSeconds,
        commenter: comment.commenter,
        state: comment.state,
        message: {
            body: comment.message.fragments.map(fragment => fragment.text).join(''),
            fragments: comment.message.fragments.map(fragment => {
                const out = {
                    text: fragment.text,
                };
                if (fragment.emote) {
                    out.emoticon = {
                        emoticon_id: fragment.emote.emoteID,
                    };
                }
                return out;
            }),
            user_color: comment.message.userColor,
        }
    };

    if (out.commenter === null) {
        out.commenter = {
          id: '0',
          login: '[deleted_user]',
          displayName: '[deleted_user]'
        };
    }
    else {
        delete out.commenter.__typename;
    }
    return out;
}

async function fetchVideoMeta(videoID) {
    console.log(`Fetching metadata for ${videoID}`);
    const vars = {
        channel: '',
        clipSlug: '',
        isClip: false,
        isLive: false,
        isVodOrCollection: true,
        vodID: `${videoID}`
    };
    
    const body = JSON.stringify([{
        'operationName': 'ComscoreStreamingQuery',
        'variables': vars,
        'extensions': {
            'persistedQuery': {
                'version': 1,
                'sha256Hash': 'e1edae8122517d013405f237ffcc124515dc6ded82480a88daef69c83b53ac01'
            }
        }
    }]);
    
    console.log(`Request body : ${body}`);

    const resp = await fetch(`https://gql.twitch.tv/gql`, {
        method: 'POST',
        body: body,
        headers: {
            'Client-ID': twitchClientId,
            'Accept': 'application/vnd.twitchtv.v5+json; charset=UTF-8',
        },
    });
    
    const meta = (await resp.json())[0].data.video;
    meta.length = meta.lengthSeconds;
    delete meta.lengthSeconds;
    delete meta.game;
    
    return meta;
}

module.exports = provider;
