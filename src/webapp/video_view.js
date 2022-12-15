import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import Styled from 'styled-components';
import { LocalStorage } from './local_storage';
import { FlexLayout, FlexChild} from 'xureact/lib/module/components/layout/flex-layout';
import { slidingWindow } from './sliding-window';
import { Embed } from './natives/twitch_embed_v1';
import autobind from 'autobind-decorator';
import { Chatlog } from './chatlog';
import { secondsToTime } from './seconds_to_time';
import { InputMultipleValues } from './input_mutliple_values';
import deepEqual from 'deep-eql';

class VideoView extends React.Component {
    static propTypes = {
        video_id: PropTypes.string.isRequired,
    };
    state = {
        chatlogReady: false,
        chatlogError: false,
        chatlogProgress: 0,
        chatlog: null,
        matches: {},
        ranges: null,
        time: 0,
        filterValues: [''],
        filterUsers: [''],
        filterMatchingCount: 0,
        filterThreshold: 15,
        windowLength: 120,
        rollback: 20,
        chatVisible: true,
        autoscroll: true,
    };
    videoInterval = null;
    
    constructor(props) {
        super(props);
        let lastFilter = LocalStorage.get('LAST_FILTER_USED', ['LUL']);
        const lastFilterUsers = LocalStorage.get('LAST_FILTER_USED_USERS', ['']);
        const lastThreshold = LocalStorage.get('LAST_THRESHOLD_USED', 3);
        const lastWindowLength = LocalStorage.get('LAST_WINDOW_LENGTH', 120);
        const lastRollback = LocalStorage.get('LAST_ROLLBACK', 20);
        
        if (typeof(lastFilter) === 'string') {
            lastFilter = [ lastFilter ];
        }
        
        this.state = {
            ...this.state,
            filterValues: lastFilter,
            filterUsers: lastFilterUsers,
            filterThreshold: lastThreshold,
            windowLength: lastWindowLength,
            rollback: lastRollback,
        };
    }
    
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
            parent: [ 'localhost' ],
        };
        this.player = new Embed('main-player', options);
        //this.player.setVolume(0.5);
        setTimeout(() => {
            this.player.setMuted(false);
        }, 2000);
        this.videoInterval = setInterval(this.updatePlayer.bind(this), 500);
        
        global.ipc.on('chatlog', (event, chatlog) => {
            this.setState(state => ({
                ...state,
                chatlogReady: true,
                chatlog: chatlog,
            }));
            this.applyFilter();
        });
        global.ipc.on('chatlogProgress', (event, progress) => {
            this.setState(state => ({
                ...state,
                chatlogProgress: progress,
            }));
        });
        global.ipc.on('chatlogError', (event, progress) => {
            console.error('ERROR WHILE LOADING CHATLOG');
            this.setState(state => ({
                ...state,
                chatlogError: true,
            }));
        });
        
        global.postMessage({ action: 'load_chatlog', data: props.video_id }, '*');
    }
    
    componentDidUpdate(prevProps, prevState) {
        const state = this.state;
        if (state.chatlogReady) {
            if (!deepEqual(prevState.filterValues, state.filterValues)
            ||  !deepEqual(prevState.filterUsers, state.filterUsers)
            ||  prevState.filterThreshold !== state.filterThreshold
            ||  prevState.rollback !== state.rollback
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
        const filterValues = state.filterValues.filter(v => v.trim().length > 0).map(v => v.trim().toLowerCase());
        const filterUsers = state.filterUsers.filter(v => v.trim().length > 0).map(v => v.trim().toLowerCase());
        const emptyFilterValues = filterValues.length === 0;
        const emptyFilterUsers = filterUsers.length === 0;
        const chatlog = state.chatlog.filter((chatline) => {
            if (!chatline.message || !chatline.message.body) {
                return false;
            }
            else if (emptyFilterValues && emptyFilterUsers) {
                return false;
            }
            else {
                const msg = chatline.message.body.toLowerCase();
                const user = chatline.commenter.login;
                
                const foundMatchingUser = emptyFilterUsers || filterUsers.some(filterUser => {
                    return filterUser === '' || user.indexOf(filterUser) !== -1;
                });
                
                if (foundMatchingUser) {
                    const foundMatchingValue = emptyFilterValues || filterValues.some(filterValue => {
                        return filterValue === '' || msg.indexOf(filterValue) !== -1;
                    });
                    return (
                        //(!state.filterValues || state.filterValue === '' || msg.indexOf(state.filterValue.toLowerCase()) !== -1)
                      foundMatchingValue
                    );
                }
            }
        });
        console.log('Filtered chatlog', chatlog);
        LocalStorage.set('LAST_FILTER_USED', state.filterValues);
        LocalStorage.set('LAST_FILTER_USED_USERS', state.filterUsers);
        LocalStorage.set('LAST_THRESHOLD_USED', state.filterThreshold);
        LocalStorage.set('LAST_WINDOW_LENGTH', state.windowLength);
        LocalStorage.set('LAST_ROLLBACK', state.rollback);
        const ranges = slidingWindow(chatlog, state.windowLength, state.filterThreshold, state.rollback);
        console.log(ranges);
        
        const matches = chatlog.reduce((acc, msg) => { acc[msg._id] = true; return acc; }, {});
        
        this.setState(state => ({
            ...state,
            ranges: ranges,
            filterMatchingCount: chatlog.length,
            matches: matches,
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
        const ranges = state.ranges || [];
        
        let playbackShown = false;
        const rangeWidgets = [];
        ranges.forEach(range => {
            const rstart = Math.max(0, range.start);
            const rend = Math.max(rstart, range.end);
            const isRangePlaying = (rstart <= state.time && state.time <= rend);
            if (!playbackShown && state.time < rstart) {
                playbackShown = true;
                rangeWidgets.push(this.renderPlayback());
            }
            else if (!playbackShown && rstart <= state.time && state.time <= rend) {
                playbackShown = true;
            }
            rangeWidgets.push(
                <a key={rstart} href="javascript:" className={`highlight_range ${isRangePlaying ? 'active' : ''}`}
                    onClick={() => {
                        this.player.play();
                        setTimeout(() => {
                            this.player.seek(rstart);
                        }, 50);
                    }}
                >
                    <span className={`playback-state`}>▶</span>
                    {`${secondsToTime(rstart)} - ${secondsToTime(rend)} (${range.nbMatches} messages)`}
                    {isRangePlaying && (
                        <div key="playback"><span className={`playback-state`}/>{secondsToTime(state.time)}</div>
                    )}
                </a>,
            );
        });
        if (!playbackShown) {
            rangeWidgets.push(this.renderPlayback());
            playbackShown = true;
        }
        
        return (
            <div className={props.className} id="video_view">
                <div className="flex-main">
                    <div className="flex-child" style={{width: 100, flexGrow: 1}}>
                        <div id="main-player"/>
                    </div>
                    <div className="sidebar">
                        <FlexLayout direction="column" className="fullh">
                            <FlexChild className="filters-box" grow={0} shrink={0}>
                                <div>
                                    <span className="filters-box__input-left">
                                        At least
                                    </span>
                                    <input type="number" className="filters-box__input" placeholder="1" value={state.filterThreshold} onChange={(e) => {
                                        e.preventDefault();
                                        let val = parseInt(e.currentTarget.value);
                                        if (isNaN(val)) {
                                            val = null;
                                        }
                                        else {
                                            val = Math.max(1, val);
                                        }
                                        this.setState(state => ({
                                            ...state,
                                            filterThreshold: val,
                                        }));
                                    }} />
                                    <span className="filters-box__input-right">
                                        {' '}messages
                                    </span>
                                </div>
                                <div>
                                    <span className="filters-box__input-left">
                                        in a window of
                                    </span>
                                    <input type="number" className="filters-box__input" placeholder="1" value={state.windowLength} onChange={(e) => {
                                        e.preventDefault();
                                        let val = parseInt(e.currentTarget.value);
                                        if (isNaN(val)) {
                                            val = null;
                                        }
                                        else {
                                            val = Math.max(1, val);
                                        }
                                        this.setState(state => ({
                                            ...state,
                                            windowLength: val,
                                        }));
                                    }} />
                                    <span className="filters-box__input-right">
                                        {' '}seconds
                                    </span>
                                </div>
                                <div>
                                    <span className="filters-box__input-left">
                                        starting
                                    </span>
                                    <input type="number" className="filters-box__input" placeholder="0" value={state.rollback} onChange={(e) => {
                                        e.preventDefault();
                                        let val = parseInt(e.currentTarget.value);
                                        if (isNaN(val)) {
                                            val = null;
                                        }
                                        else {
                                            val = Math.max(0, val);
                                        }
                                        this.setState(state => ({
                                            ...state,
                                            rollback: val,
                                        }));
                                    }} />
                                    <span className="filters-box__input-right">
                                        seconds earlier
                                    </span>
                                </div>
                                <div>
                                    <span className="filters-box__input-left">
                                        containing
                                    </span>
                                    <div className="filters-box__input-containing">
                                        <InputMultipleValues values={state.filterValues} onChange={(values) => {
                                            //const val = e.currentTarget.value;
                                            this.setState(state => ({
                                                ...state,
                                                filterValues: values,
                                            }));
                                        }}/>
                                    </div>
                                </div>
                                <div>
                                    <span className="filters-box__input-left">
                                        only from
                                    </span>
                                    <div className="filters-box__input-containing">
                                        <InputMultipleValues values={state.filterUsers} onChange={(values) => {
                                            //const val = e.currentTarget.value;
                                            this.setState(state => ({
                                                ...state,
                                                filterUsers: values,
                                            }));
                                        }}/>
                                    </div>
                                </div>
                                <br/>
                                <div>{(state.ranges || []).length} moments found ({state.filterMatchingCount} messages)</div>
                            </FlexChild>
                            <FlexChild height={0} grow={1} className="overflow-y-scroll">
                                {!state.chatlogReady ?
                                state.chatlogError ? (
                                    <div className="block-padder text-center">
                                        <br/>
                                        An error occurred while fetching the chatlog.
                                        <br/>
                                        <br/>
                                        <button className="clickable" onClick={this.handleRetry}>Retry</button>
                                        <br/>
                                        <br/>
                                        If the problem persists, you can <br/>
                                        <a target="_blank" href="javascript:" onClick={() => {
                                            global.postMessage({ action: 'open_page', data: 'https://github.com/xurei/twitch-highlights-logger/issues/new/choose' }, '*');
                                        }}>create an issue on Github</a>
                                        <br/>{' or '}<br/>
                                        <a target="_blank" href="javascript:" onClick={() => {
                                            global.postMessage({ action: 'open_page', data: `https://twitter.com/messages/compose?recipient_id=187525770&text=Hey! I had an issue with Twitch Highlights, I cannot load the chaltog for video ${props.video_id}` }, '*');
                                        }}>contact the developper on Twitter</a>
                                    </div>
                                ) : (
                                    <div className="block-padder">Loading chatlog... {parseInt(state.chatlogProgress)}%</div>
                                ) : (
                                    <div className="block-padder" style={{height: '100%'}}>
                                        {rangeWidgets}
                                    </div>
                                )}
                            </FlexChild>
                            {state.chatlogReady && (
                                <FlexChild height={36} grow={0} className="chat-toggle">
                                    <FlexLayout direction="row" className="fullw">
                                        <FlexChild grow={1}>
                                            <button className={`chat__toggle-btn ${state.chatVisible ? '' : 'hidden'}`} onClick={this.handleVisibilityToggle}>
                                                Chat
                                            </button>
                                        </FlexChild>
                                        <FlexChild className="autoscroll-wrapper" grow={0}>
                                            <label><input type="checkbox" checked={state.autoscroll} onChange={this.handleAutoscrollToggle}/> autoscroll</label>
                                        </FlexChild>
                                    </FlexLayout>
                                </FlexChild>
                            )}
                            {state.chatlogReady && (
                                <FlexChild height={0} grow={state.chatVisible ? 3 : 0} className="chat-block overflow-y-scroll">
                                    <div className="fullh">
                                        {state.chatlog && (
                                            <Chatlog
                                              chatlog={state.chatlog}
                                              time={state.time}
                                              autoscroll={state.autoscroll}
                                              matches={state.matches}
                                            />
                                        )}
                                        {/*<pre>{JSON.stringify(state.chatlog, null, '  ')}</pre>*/}
                                    </div>
                                </FlexChild>
                            )}
                            {/*<FlexChild height={50} grow={1}>*/}
                            {/*    <FlexLayout direction="column" className="fullh">*/}
                            {/*    </FlexLayout>*/}
                            {/*</FlexChild>*/}
                        </FlexLayout>
                    </div>
                </div>
            </div>
        );
    }
    
    @autobind
    handleRetry() {
        const props = this.props;
        this.setState(state => ({
            ...state,
            chatlogError: false,
        }));
        global.postMessage({ action: 'load_chatlog', data: props.video_id }, '*');
    }
    
    @autobind
    handleAutoscrollToggle() {
        this.setState(state => ({
            ...state,
            autoscroll: !state.autoscroll,
        }));
    }
    
    @autobind
    handleVisibilityToggle() {
        this.setState(state => ({
            ...state,
            chatVisible: !state.chatVisible,
        }));
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
        position: relative;
        height: 100%;
        width: 340px;
        flex-grow: 0;
        flex-shrink: 1;
    }
    
    .block-padder {
        padding: 10px;
    }
    
    .ranges-box {
        height: 100%;
    }
    
    .overflow-y-scroll {
        overflow-y: scroll;
    }
    
    .chat-block {
        transition: flex-grow ease-out 0.2s;
    }
    
    .chat-toggle {
      background: rgba(0,0,0, 0.1);
    }
    
    .chat__toggle-btn {
        padding: 5px 7px;
        color: #fff;
        cursor: pointer;
        font-size: 18px;
        
        &:before {
            font-size: 28px;
            content: "⌄";
            position: relative;
            top: -3px;
        }
        
        //&:hover {
        //    //padding-top: 0 !important;
        //    //padding-bottom: 10px !important;
        //
        //    &:before {
        //        content: "⌃";
        //        top: 10px;
        //    }
        //}
        
        line-height: 20px;
        
        &.hidden {
            &:before {
                content: "⌃";
                top: 10px;
            }
            
            //&:hover {
            //    :before {
            //        content: "⌄";
            //        top: -3px;
            //    }
            //}
        }
        
        background: none !important;
        border: none !important;
    }
    
    .filters-box {
        background: rgba(0, 0, 0, 0.1);
        line-height: 1.45em;
        padding: 10px;
    
        .filters-box__input {
            width: 75px;
            display: inline-block;
        }
        .filters-box__input-left {
            display: inline-block;
            width: 115px;
            text-align: right;
            padding-right: 4px;
            vertical-align: top;
        }
        .filters-box__input-right {
            display: inline-block;
            padding-left: 4px;
            vertical-align: top;
            width: 115px;
        }
        .filters-box__input-containing {
            width: 205px;
            display: inline-block;
        }
        
        .input-seconds {
            display: inline-block;
            width: 90px;
            &:after {
                content: "s";
                display: inline-block;
                margin-left: 4px;
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
    
    .autoscroll-wrapper {
        padding: 8px;
        label, input {
            cursor: pointer;
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
