import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import Styled from 'styled-components';
import deepEqual from 'deep-eql';
import autobind from 'autobind-decorator';
import { VCenter } from 'xureact';
import ReactDOM from 'react-dom';
import MainView from './main_view';

function slidingWindow(items, windowLength) {
    const max_t = Math.round(items[items.length-1].content_offset_seconds);
    items = items.map(item => {
        item = {...item};
        item.content_offset_seconds = Math.round(item.content_offset_seconds);
        return item;
    })
    const out = new Array(max_t+windowLength).fill(0);
    items.forEach(item => {
        for (let t2=0; t2<windowLength;++t2) {
            out[item.content_offset_seconds + t2]++;
        }
    });
    return out;
}

function secondsToTime(t) {
    const seconds = (t%60);
    t -= seconds;
    t /= 60;
    const minutes = (t%60);
    t -= minutes;
    t /= 60;
    const hours = t;
    return `${hours}:${(minutes < 10 ? '0' : '') + minutes}:${(seconds < 10 ? '0' : '') + seconds}`
}

class VideoView extends React.Component {
    static propTypes = {
        video_id: PropTypes.string.isRequired,
    };
    state = {
        chatlog_ready: false,
        ranges: null,
        time: 0,
    };
    videoInterval = null;
    
    componentDidMount() {
        const props = this.props;
        const options = {
            width: '100%',
            height: '100%',
            autoplay: true,
            muted: true,
            //channel: "copainduweb",
            video: props.video_id,
            //collection: "<collection ID>",
            // only needed if your site is also embedded on embed.example.com and othersite.example.com
            parent: [ 'localhost' ]
        };
        this.player = new global.Twitch.Player('main-player', options);
        //this.player.setVolume(0.5);
        setTimeout(() => {
            this.player.setMuted(false);
        }, 2000);
        this.videoInterval = setInterval(this.updatePlayer.bind(this), 1000);
        
        global.ipc.on('chatlog', (event, chatlog) => {
            console.log('Got chatlog', chatlog);
    
            const chatWindow = slidingWindow(chatlog, 120);
            const ranges = [];
            let currentRange = null;
            const THRESHOLD = 15;
            chatWindow.forEach((v,i) => {
                if (v > THRESHOLD) {
                    if (currentRange === null) {
                        console.log(`${i}s: ${v}`);
                        currentRange = { start: i };
                    }
                }
                else {
                    if (currentRange !== null) {
                        currentRange.end = i - 1;
                        ranges.push(currentRange);
                        currentRange = null;
                    }
                }
            });
            this.setState(state => ({
                ...state,
                chatlog_ready: true,
                ranges: ranges,
            }));
        });
        
        global.ipc.send('load_chatlog', props.video_id);
    }
    
    componentWillUnmount() {
        clearInterval(this.videoInterval);
    }
    
    updatePlayer() {
        const time = this.player.getCurrentTime();
        this.setState(state => ({
            ...state,
            time: time,
        }));
    }
    
    render() {
        const props = this.props;
        const state = this.state;
        const start_delay = 10;
        const end_delay = 10;
        return (
            <div className={props.className} id="video_view">
                <div className="flex-main">
                    <div className="flew-child" style={{width: '85%', flexGrow: 1}}>
                        <div id="main-player"/>
                    </div>
                    <div className="sidebar" style={{width: 200, flexGrow: 0}}>
                        <div>Video ID: {props.video_id}</div>
                        <div>{state.time}</div>
                        {!state.chatlog_ready ? (
                            <div>Loading chatlog...</div>
                        ) : (
                            <div>
                                {state.ranges.map(range => (
                                    <a key={range.start} href="javascript:" className={`highlight_range ${range.start-start_delay <= state.time && state.time <= range.end-end_delay ? 'active':''}`}
                                       onClick={() => {
                                           this.player.seek(range.start-start_delay);
                                       }}
                                    >
                                        {secondsToTime(range.start-start_delay) + " - " + secondsToTime(range.end-end_delay)}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

//language=SCSS
VideoView = Styled(VideoView)`
& {
  height: 100%;
  position: relative;
  
  .highlight_range {
    display: block;
    line-height: 1.3em;
    
    &.active {
      background: #d56cc9;
      color: #fff;
    }
  }
}
`;

export { VideoView };
