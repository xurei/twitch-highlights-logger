import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import Styled from 'styled-components';
import deepEqual from 'deep-eql';
import autobind from 'autobind-decorator';
import { VCenter } from 'xureact';

class VideoView extends React.Component {
    static propTypes = {
        video_id: PropTypes.string.isRequired,
    };
    
    componentDidMount() {
        const options = {
            width: '100%',
            height: '100%',
            autoplay: true,
            muted: true,
            //channel: "copainduweb",
            video: this.props.video_id,
            //collection: "<collection ID>",
            // only needed if your site is also embedded on embed.example.com and othersite.example.com
            parent: [ 'localhost' ]
        };
        this.player = new global.Twitch.Player('main-player', options);
        //this.player.setVolume(0.5);
        setTimeout(() => {
            this.player.setMuted(false);
        }, 2000);
    }
    
    render() {
        const props = this.props;
        const state = this.state;
        return (
            <div className={props.className} id="video_view">
                <div className="flex-main">
                    <div className="flew-child" style={{width: '85%', flexGrow: 1}}>
                        <div id="main-player"/>
                    </div>
                    <div className="sidebar" style={{width: 200, flexGrow: 0}}>
                        {props.video_id}
                        <div id="links"/>
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
}
`;

export { VideoView };
