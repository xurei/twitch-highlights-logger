import React from 'react'; //eslint-disable-line no-unused-vars
import Styled from 'styled-components';
//eslint-disable-next-line xurei/no-relative-parent-imports
import * as pkg from '../../package.json';
import { SelectUrlView } from './select_url_view';
import { VideoView } from './video_view';
import { FlexLayout, FlexChild } from 'xureact/lib/module/components/layout/flex-layout';

class MainView extends React.Component {
    state = {
        currentView: 'select_url',
        twitch_url: '',
    }
    render() {
        const props = this.props;
        const state = this.state;
        
        let video_id = state.twitch_url;
        if (!!video_id && video_id.match(/twitch.tv/)) {
            video_id = video_id.split('/');
            video_id = video_id[video_id.length-1];
        }
        
        return (
            <div className={props.className}>
                {props.release && props.release.new_version && (
                    <div className="new-version">
                        <strong>A new version of Twitch Highlights is available !</strong>
                        {' '}
                        {props.release && props.release.tag_name}
                        {' '}
                        <a href={props.release}>Download</a>
                    </div>
                )}
                <div className="main-content">
                    <div className="header">
                        <FlexLayout direction="row">
                            <FlexChild grow={0} width={64}>
                                {state.currentView !== 'select_url' && (
                                    <div style={{background: '#282828'}}>
                                        <div className="back-button" onClick={() => {
                                            this.setState((state) => ({
                                                ...state,
                                                currentView: 'select_url',
                                                twitch_url: '',
                                            }));
                                        }}>
                                            ᐸ
                                        </div>
                                    </div>
                                )}
                            </FlexChild>
                            <FlexChild grow={1} width={100}>
                                <div className="header-title">
                                    {state.twitch_url}
                                </div>
                            </FlexChild>
                            <FlexChild grow={0} width={64}>
                                <div style={{paddingRight: 5, paddingLeft: 5, paddingTop: 10, background: '#282828', lineHeight: 0 }}>
                                    <img src="300x300.png" alt="Logo"/>
                                </div>
                            </FlexChild>
                        </FlexLayout>
                    </div>
                    <div className="content">
                        {state.currentView === 'select_url' && (
                            <SelectUrlView onSelectUrl={(url) => {
                                this.setState((state) => ({
                                    ...state,
                                    currentView: 'video',
                                    twitch_url: url,
                                }));
                            }}/>
                        )}
                        {state.currentView === 'video' && (
                            <VideoView video_id={video_id}/>
                        )}
                    </div>
                    <div className="footer">
                        <FlexLayout direction="row">
                            <FlexChild grow={0} width={350}>
                                <div className="overflow-hidden clickable" onClick={() => {
                                    global.postMessage({ action: 'github_page', data: null }, '*');
                                }}>
                                    https://github.com/xurei/twitch-highlights-logger
                                </div>
                            </FlexChild>
                            <FlexChild grow={1} width={10}>
                            </FlexChild>
                            <FlexChild grow={0} width={120}>
                                <div className="text-right">
                                    Version: {pkg.version}
                                </div>
                            </FlexChild>
                        </FlexLayout>
                    </div>
                </div>
            </div>
        );
    }
}

//language=SCSS
MainView = Styled(MainView)`
& {
  height: 100vh;
  background: #333;
  
  .main-content {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: relative;
  }
  
  .header {
    height: 64px;
    width: 100%;
    flex-grow: 0;
    flex-shrink: 0;
    background: #222;
  }
  
  .back-button {
    font-size: 32px;
    line-height: 64px;
    text-align: center;
    cursor: pointer;
    &, * {
      user-select: none;
    }
  }

  .header-title {
    line-height: 64px;
    padding: 0 15px;
    font-size: 20px;
  }
  
  .content {
    flex-shrink: 1;
    flex-grow: 1;
    height: 1px;
    position: relative;
  }
  
  .footer {
    height: 32px;
    line-height: 32px;
    background: #222;
    width: 100%;
    padding: 0 10px;
    border-top: solid 1px #3f3f3f;
    flex-grow: 0;
    flex-shrink: 0;
  }
  
  .new-version {
    background: #D17000;
    position: relative;
    padding: 10px 40px;
    
    a {
      color: #320;
      text-decoration: underline;
    }
  }
}
`;

export default MainView;
