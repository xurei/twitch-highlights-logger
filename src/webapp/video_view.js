import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import Styled from 'styled-components';
import { LocalStorage } from './local_storage';
import { FlexLayout, FlexChild} from 'xureact/lib/cjs/components/layout/flex-layout';

function slidingWindow(items, windowLength) {
    const max_t = Math.round(items[items.length-1].content_offset_seconds);
    items = items.map(item => {
        item = {...item};
        item.content_offset_seconds = Math.round(item.content_offset_seconds);
        return item;
    });
    const out = new Array(max_t+windowLength).fill(0);
    items.forEach(item => {
        for (let t2=0; t2<windowLength;++t2) {
            out[item.content_offset_seconds + t2]++;
        }
    });
    return out;
}

function secondsToTime(t) {
    t = Math.floor(t);
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
        chatlog: null,
        ranges: null,
        time: 0,
        filterValue: '',
        filterMatchingCount: 0,
        filterThreshold: 15,
        windowLength: 120,
        rollback: 20,
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
        this.videoInterval = setInterval(this.updatePlayer.bind(this), 500);
    
        const lastFilter = LocalStorage.get('LAST_FILTER_USED', 'copainLUL');
        const lastThreshold = LocalStorage.get('LAST_THRESHOLD_USED', 3);
        const lastWindowLength = LocalStorage.get('LAST_WINDOW_LENGTH', 120);
        const lastRollback = LocalStorage.get('LAST_ROLLBACK', 20);
        this.setState(state => ({
            ...state,
            filterValue: lastFilter,
            filterThreshold: lastThreshold,
            windowLength: lastWindowLength,
            rollback: lastRollback,
        }));
        
        global.ipc.on('chatlog', (event, chatlog) => {
            this.setState(state => ({
                ...state,
                chatlog_ready: true,
                chatlog: chatlog,
            }));
            this.applyFilter();
        });
        
        global.ipc.send('load_chatlog', props.video_id);
    }
    
    componentDidUpdate(prevProps, prevState) {
        const state = this.state;
        if (state.chatlog_ready) {
            if (prevState.filterValue !== state.filterValue
            ||  prevState.filterThreshold !== state.filterThreshold
            //||  prevState.rollback !== state.rollback
            ||  prevState.windowLength !== state.windowLength) {
                this.applyFilter();
            }
        }
    }
    
    componentWillUnmount() {
        clearInterval(this.videoInterval);
    }
    
    applyFilter() {
        const state = this.state;
        const THRESHOLD = state.filterThreshold;
        const chatlog = state.chatlog.filter((chatline) => {
            if (!chatline.message || !chatline.message.body) {
                return false;
            }
            else {
                const msg = chatline.message.body;
                return (!state.filterValue || state.filterValue === '' || msg.indexOf(state.filterValue) !== -1);
            }
        });
        console.log('Filtered chatlog', chatlog);
        LocalStorage.set('LAST_FILTER_USED', state.filterValue);
        LocalStorage.set('LAST_THRESHOLD_USED', state.filterThreshold);
        LocalStorage.set('LAST_WINDOW_LENGTH', state.windowLength);
        const chatWindow = slidingWindow(chatlog, state.windowLength);
        const ranges = [];
        let currentRange = null;
        chatWindow.forEach((v,i) => {
            if (v >= THRESHOLD) {
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
            ranges: ranges,
            filterMatchingCount: chatlog.length,
        }));
    }
    
    updatePlayer() {
        const time = this.player.getCurrentTime();
        this.setState(state => ({
            ...state,
            time: time,
        }));
    }
    
    renderPlayback() {
        const state = this.state;
        return (
            <div key="playback" className="highlight_range">
                <span className={`playback-state visible`}>▶</span>
                {secondsToTime(state.time)}
            </div>
        );
    }
    
    render() {
        const props = this.props;
        const state = this.state;
        const start_delay = state.rollback;
        const end_delay = state.rollback;
        const ranges = state.ranges || [];
        
        let playbackShown = false;
        const rangeWidgets = [];
        ranges.forEach(range => {
            const rstart = Math.max(0, range.start - start_delay);
            const rend = Math.max(rstart, range.end - end_delay);
            const isRangePlaying = (rstart <= state.time && state.time <= rend);
            if (!playbackShown && state.time < rstart) {
                playbackShown = true;
                rangeWidgets.push(this.renderPlayback());
            }
            else if (!playbackShown && rstart <= state.time && state.time <= rend) {
                playbackShown = true;
            }
            rangeWidgets.push(
                <a key={range.start} href="javascript:" className={`highlight_range ${isRangePlaying ? 'active' : ''}`}
                   onClick={() => {
                       this.player.seek(rstart);
                   }}
                >
                    <span className={`playback-state`}>▶</span>
                    {`${secondsToTime(rstart)} - ${secondsToTime(rend)}`}
                    {isRangePlaying && (
                        <div key="playback"><span className={`playback-state`}/>{secondsToTime(state.time)}</div>
                    )}
                </a>
            );
        });
        if (!playbackShown) {
            rangeWidgets.unshift(this.renderPlayback());
            playbackShown = true;
        }
        
        return (
            <div className={props.className} id="video_view">
                <div className="flex-main">
                    <div className="flew-child" style={{width: '85%', flexGrow: 1}}>
                        <div id="main-player"/>
                    </div>
                    <div className="sidebar">
                        <div className="filters-box">
                            <div>
                                Filter:
                                <input type="text" value={state.filterValue} placeholder="all" onChange={(e) => {
                                    e.preventDefault();
                                    const val = e.currentTarget.value;
                                    this.setState(state => ({
                                        ...state,
                                        filterValue: val,
                                    }))
                                }}/>
                            </div>
                            <div>
                                <FlexLayout direction="row" style={{width: '100%', overflow: 'hidden'}}>
                                    <FlexChild>Threshold:&nbsp;</FlexChild>
                                    <FlexChild grow={1}>
                                        <div style={{position: 'absolute', width: '100%'}}>
                                            <input type="number" value={state.filterThreshold} onChange={(e) => {
                                                e.preventDefault();
                                                const val = e.currentTarget.value;
                                                this.setState(state => ({
                                                    ...state,
                                                    filterThreshold: Math.max(1, parseInt(val)),
                                                }));
                                            }} />
                                        </div>
                                    </FlexChild>
                                </FlexLayout>
                            </div>
                            <div>
                                <FlexLayout direction="row" style={{width: '100%', overflow: 'hidden'}}>
                                    <FlexChild>Window length:&nbsp;</FlexChild>
                                    <FlexChild grow={1}>
                                        <div className="input-seconds" style={{position: 'absolute', width: '100%'}}>
                                            <input type="number" value={state.windowLength} onChange={(e) => {
                                                e.preventDefault();
                                                const val = e.currentTarget.value;
                                                this.setState(state => ({
                                                    ...state,
                                                    windowLength: Math.max(10, parseInt(val)),
                                                }));
                                            }} />
                                        </div>
                                    </FlexChild>
                                </FlexLayout>
                            </div>
                            <div>
                                <FlexLayout direction="row" style={{width: '100%', overflow: 'hidden'}}>
                                    <FlexChild>Rollback:&nbsp;</FlexChild>
                                    <FlexChild grow={1}>
                                        <div className="input-seconds" style={{position: 'absolute', width: '100%'}}>
                                            <input type="number" value={state.rollback} onChange={(e) => {
                                                e.preventDefault();
                                                const val = e.currentTarget.value;
                                                const rollback = Math.max(0, parseInt(val));
                                                this.setState(state => ({
                                                    ...state,
                                                    rollback: rollback,
                                                }));
                                                LocalStorage.set('LAST_ROLLBACK', rollback);
                                            }} />
                                        </div>
                                    </FlexChild>
                                </FlexLayout>
                            </div>
                            <div>{state.filterMatchingCount} messages matching</div>
                            <div>{(state.ranges || []).length} ranges found</div>
                        </div>
                        
                        <div className="ranges-box">
                            {!state.chatlog_ready ? (
                                <div>Loading chatlog...</div>
                            ) : (
                                <div>
                                    {rangeWidgets}
                                </div>
                            )}
                        </div>
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
  overflow: hidden;
  
  #main-player {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .sidebar {
    overflow-y: scroll;
    height: 100%;
    width: 230px;
    flex-grow: 0;
  }

  .filters-box, .ranges-box {
    padding: 10px;
  }

  .filters-box {
    background: rgba(0,0,0, 0.1);
    line-height: 1.45em;
    input {
      max-width: 100%;
    }
    .input-seconds {
      &:after {
        content: "s";
        display: inline-block;
        position: absolute;
        right: 22px;
        color: #aaa;
        font-size: 0.8em;
      }
    }
  }
  
  .playback-state {
    width: 20px;
    display: inline-block;
    position: relative;
    top: -2px;
    visibility: hidden;
    &.visible {
      visibility: visible;
    }
  }
  
  .highlight_range {
    display: block;
    line-height: 1.3em;
    margin-left: -10px;
    margin-right: -10px;
    padding: 0 10px;
    
    &.active {
      background: #d56cc9;
      color: #fff;

      .playback-state {
        visibility: visible;
      }
    }
  }
}
`;

export { VideoView };
