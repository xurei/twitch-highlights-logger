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


class VideoView extends React.Component {
    static propTypes = {
        video_id: PropTypes.string.isRequired,
    };
    state = {
        chatlog_ready: false,
        chatlog: null,
        ranges: null,
        time: 0,
        filterValues: [''],
        userValue: '',
        filterMatchingCount: 0,
        filterThreshold: 15,
        windowLength: 120,
        chatVisible: true,
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
            parent: [ 'localhost' ],
        };
        this.player = new Embed('main-player', options);
        //this.player.setVolume(0.5);
        setTimeout(() => {
            this.player.setMuted(false);
        }, 2000);
        this.videoInterval = setInterval(this.updatePlayer.bind(this), 500);
    
        let lastFilter = LocalStorage.get('LAST_FILTER_USED', ['copainLUL']);
        const lastThreshold = LocalStorage.get('LAST_THRESHOLD_USED', 3);
        const lastWindowLength = LocalStorage.get('LAST_WINDOW_LENGTH', 120);
        
        if (typeof(lastFilter) === 'string') {
            lastFilter = [ lastFilter ];
        }
        
        this.setState(state => ({
            ...state,
            filterValues: lastFilter,
            filterThreshold: lastThreshold,
            windowLength: lastWindowLength,
        }));
        
        global.ipc.on('chatlog', (event, chatlog) => {
            this.setState(state => ({
                ...state,
                chatlog_ready: true,
                chatlog: chatlog,
            }));
            this.applyFilter();
        });
    
        global.postMessage({ action: 'load_chatlog', data: props.video_id }, '*');
    }
    
    componentDidUpdate(prevProps, prevState) {
        const state = this.state;
        if (state.chatlog_ready) {
            if (prevState.filterValues !== state.filterValues
            ||  prevState.userValue !== state.userValue
            ||  prevState.filterThreshold !== state.filterThreshold
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
                const msg = chatline.message.body.toLowerCase();
                const user = chatline.commenter.display_name.toLowerCase();
                
                const foundMatchingValue = state.filterValues.some(filterValue => {
                    return filterValue && msg.indexOf(filterValue.toLowerCase()) !== -1;
                });
                
                return (
                    //(!state.filterValues || state.filterValue === '' || msg.indexOf(state.filterValue.toLowerCase()) !== -1)
                   foundMatchingValue
                && (!state.userValue || state.userValue === '' || user.indexOf(state.userValue.toLowerCase()) !== -1)
                );
            }
        });
        console.log('Filtered chatlog', chatlog);
        console.log('Threshold:', THRESHOLD);
        LocalStorage.set('LAST_FILTER_USED', state.filterValues);
        LocalStorage.set('LAST_THRESHOLD_USED', state.filterThreshold);
        LocalStorage.set('LAST_WINDOW_LENGTH', state.windowLength);
        const ranges = slidingWindow(chatlog, state.windowLength, state.filterThreshold);
        console.log(ranges);
    
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
                <a key={range.start} href="javascript:" className={`highlight_range ${isRangePlaying ? 'active' : ''}`}
                    onClick={() => {
                        this.player.play();
                        setTimeout(() => {
                            this.player.seek(rstart);
                        }, 50);
                    }}
                >
                    <span className={`playback-state`}>▶</span>
                    {`${secondsToTime(rstart)} - ${secondsToTime(rend)}`}
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
                    <div className="flex-child" style={{width: '85%', flexGrow: 1}}>
                        <div id="main-player"/>
                    </div>
                    <div className="sidebar">
                        <FlexLayout direction="column" className="fullh">
                            <FlexChild className="filters-box" grow={0} shrink={0}>
                                <div>
                                    <span className="filters-box__input-name">
                                        Threshold:
                                    </span>
                                    <input type="number" className="filters-box__input" value={state.filterThreshold} onChange={(e) => {
                                        e.preventDefault();
                                        const val = e.currentTarget.value;
                                        this.setState(state => ({
                                            ...state,
                                            filterThreshold: Math.max(1, parseInt(val)),
                                        }));
                                    }} />
                                </div>
                                <div>
                                    <span className="filters-box__input-name">
                                        Window length:
                                    </span>
                                    <input type="number" className="filters-box__input" value={state.windowLength} onChange={(e) => {
                                        e.preventDefault();
                                        const val = e.currentTarget.value;
                                        this.setState(state => ({
                                            ...state,
                                            windowLength: Math.max(10, parseInt(val)),
                                        }));
                                    }} />
                                </div>
                                <div>
                                    <span className="filters-box__input-name">
                                        Contains:
                                    </span>
                                    {/*<input type="text" value={state.filterValue} placeholder="all" onChange={(e) => {*/}
                                    {/*    e.preventDefault();*/}
                                    {/*    const val = e.currentTarget.value;*/}
                                    {/*    this.setState(state => ({*/}
                                    {/*        ...state,*/}
                                    {/*        filterValue: val,*/}
                                    {/*    }));*/}
                                    {/*}}/>*/}
                                    <div className="filters-box__input">
                                        <InputMultipleValues values={state.filterValues} onChange={(values) => {
                                            //const val = e.currentTarget.value;
                                            this.setState(state => ({
                                                ...state,
                                                filterValues: values,
                                            }));
                                        }}/>
                                    </div>
                                </div>
                                <div>{state.filterMatchingCount} messages matching</div>
                                <div>{(state.ranges || []).length} ranges found</div>
                            </FlexChild>
                            <FlexChild height={0} grow={1} className="overflow-y-scroll">
                                {!state.chatlog_ready ? (
                                    <div className="block-padder">Loading chatlog...</div>
                                ) : (
                                    <div className="block-padder" style={{height: '100%'}}>
                                        {rangeWidgets}
                                    </div>
                                )}
                            </FlexChild>
                            {state.chatlog_ready && (
                                <FlexChild height={36} grow={0} className="chat-toggle">
                                    <button className={`chat__toggle-btn ${state.chatVisible ? '' : 'hidden'}`}
                                            onClick={this.handleVisibilityToggle}>
                                        Chat
                                    </button>
                                </FlexChild>
                            )}
                            {state.chatlog_ready && (
                                <FlexChild height={0} grow={state.chatVisible ? 3 : 0} className="chat-block overflow-y-scroll">
                                    <div className="fullh">
                                        {state.chatlog && (
                                          <Chatlog chatlog={state.chatlog}/>
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
            width: 170px;
            display: inline-block;
        }
        .filters-box__input-name {
            display: inline-block;
            width: 115px;
            text-align: right;
            padding-right: 3px;
            vertical-align: top;
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
