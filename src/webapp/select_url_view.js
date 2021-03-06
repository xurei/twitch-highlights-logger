import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import Styled from 'styled-components';
import { VCenter } from 'xureact';
import { LocalStorage } from './local_storage';

class SelectUrlView extends React.Component {
    static propTypes = {
        onSelectUrl: PropTypes.func.isRequired,
    };
    state = {
        url: '',
    }
    
    constructor(props) {
        super(props);
        const lastUrlUsed = LocalStorage.get('LAST_URL_USED', '');
        this.state.url = lastUrlUsed;
    }
    
    render() {
        const props = this.props;
        const state = this.state;
        return (
            <div className={props.className} id="select_url_view">
                <VCenter>
                    <p>Twitch URL or video ID</p>
                    <input type="text" id="video_url" placeholder="https://www.twitch.tv/videos/XXXXXXXXX" value={state.url} onChange={(e) => {
                        e.preventDefault();
                        const val = e.currentTarget.value;
                        this.setState(state => ({
                            ...state,
                            url: val,
                        }));
                    }}/>
                    <br/>
                    <button className="cta" onClick={() => {
                        LocalStorage.set('LAST_URL_USED', state.url);
                        props.onSelectUrl(state.url.split('?')[0].split('&')[0]);
                    }}>Open</button>
                </VCenter>
            </div>
        );
    }
}

//language=SCSS
SelectUrlView = Styled(SelectUrlView)`
& {
  height: 80%;
  position: relative;
  p {
    text-align: center;
    font-size: 24px;
  }
  button {
    display: block;
    margin: 0 auto;
    padding-left: 20px;
    padding-right: 20px;
  }
}
`;

export { SelectUrlView };
